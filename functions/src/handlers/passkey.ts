import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { Request, Response } from 'express';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
type AuthenticatorTransport = 'ble' | 'cable' | 'hybrid' | 'internal' | 'nfc' | 'smart-card' | 'usb';
import { ALLOWED_ORIGINS, verifyAuthToken } from './shared.js';

const db = getFirestore();

// ─── RP Configuration ──────────────────────────────────────────────
// In production the RP ID is the domain (no port, no scheme).
// Locally the origin includes the port for WebAuthn to work.
const RP_NAME = 'MyCircle';
const RP_ID = process.env.FUNCTIONS_EMULATOR === 'true' ? 'localhost' : 'mycircledash.com';
const RP_ORIGINS = process.env.FUNCTIONS_EMULATOR === 'true'
  ? ['http://localhost:3000']
  : ['https://mycircledash.com', 'https://mycircle-dash.web.app', 'https://mycircle-dash.firebaseapp.com'];

// ─── Firestore helpers ─────────────────────────────────────────────
interface StoredCredential {
  credentialId: string;        // base64url
  credentialPublicKey: string; // base64url
  counter: number;
  transports?: AuthenticatorTransport[];
  createdAt: FirebaseFirestore.Timestamp;
  displayName: string;
}

async function getPasskeyCredentials(uid: string): Promise<StoredCredential[]> {
  const snap = await db.collection('users').doc(uid).collection('passkeys').get();
  return snap.docs.map(d => d.data() as StoredCredential);
}

function base64urlToUint8Array(b64url: string): Uint8Array {
  return Buffer.from(b64url, 'base64url');
}

// ─── Cloud Function ────────────────────────────────────────────────
export const passkey = onRequest(
  {
    cors: ALLOWED_ORIGINS,
    invoker: 'public',
    maxInstances: 5,
    memory: '256MiB',
    timeoutSeconds: 30,
  },
  async (req: Request, res: Response) => {
    const path = req.path.replace(/^\/passkey-api\/?/, '');

    try {
      switch (path) {
        case 'register/options':
          return await handleRegisterOptions(req, res);
        case 'register/verify':
          return await handleRegisterVerify(req, res);
        case 'authenticate/options':
          return await handleAuthenticateOptions(req, res);
        case 'authenticate/verify':
          return await handleAuthenticateVerify(req, res);
        default:
          res.status(404).json({ error: 'Not found' });
      }
    } catch (err) {
      logger.error('Passkey error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// ─── Registration (requires auth — user is already signed in) ──────
async function handleRegisterOptions(req: Request, res: Response) {
  const uid = await verifyAuthToken(req);
  if (!uid) { res.status(401).json({ error: 'Auth required' }); return; }

  const userRecord = await getAuth().getUser(uid);
  const existingCreds = await getPasskeyCredentials(uid);

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: userRecord.email || userRecord.uid,
    userDisplayName: userRecord.displayName || userRecord.email || 'User',
    attestationType: 'none',
    excludeCredentials: existingCreds.map(c => ({
      id: c.credentialId,
      transports: c.transports,
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });

  // Store challenge temporarily (5 min TTL)
  await db.collection('passkeyChallenge').doc(uid).set({
    challenge: options.challenge,
    expiresAt: new Date(Date.now() + 5 * 60_000),
  });

  res.json(options);
}

async function handleRegisterVerify(req: Request, res: Response) {
  const uid = await verifyAuthToken(req);
  if (!uid) { res.status(401).json({ error: 'Auth required' }); return; }

  const challengeDoc = await db.collection('passkeyChallenge').doc(uid).get();
  if (!challengeDoc.exists) {
    res.status(400).json({ error: 'No pending challenge' });
    return;
  }
  const { challenge } = challengeDoc.data()!;

  const verification = await verifyRegistrationResponse({
    response: req.body,
    expectedChallenge: challenge,
    expectedOrigin: RP_ORIGINS,
    expectedRPID: RP_ID,
  });

  if (!verification.verified || !verification.registrationInfo) {
    res.status(400).json({ error: 'Verification failed' });
    return;
  }

  const { credential } = verification.registrationInfo;

  // Store credential in Firestore
  const credDoc: StoredCredential = {
    credentialId: Buffer.from(credential.id).toString('base64url'),
    credentialPublicKey: Buffer.from(credential.publicKey).toString('base64url'),
    counter: credential.counter,
    transports: credential.transports,
    createdAt: FieldValue.serverTimestamp() as unknown as FirebaseFirestore.Timestamp,
    displayName: req.body.displayName || 'Passkey',
  };

  await db.collection('users').doc(uid).collection('passkeys').doc(credDoc.credentialId).set(credDoc);

  // Clean up challenge
  await db.collection('passkeyChallenge').doc(uid).delete();

  res.json({ verified: true });
}

// ─── Authentication (no auth — user is signing in) ─────────────────
async function handleAuthenticateOptions(_req: Request, res: Response) {
  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: 'preferred',
    // Empty allowCredentials = discoverable credential (resident key)
  });

  // Store challenge keyed by the challenge value itself (no uid yet)
  await db.collection('passkeyChallenge').doc(options.challenge).set({
    challenge: options.challenge,
    expiresAt: new Date(Date.now() + 5 * 60_000),
  });

  res.json(options);
}

async function handleAuthenticateVerify(req: Request, res: Response) {
  const { challenge } = req.body;
  if (!challenge) {
    res.status(400).json({ error: 'Missing challenge' });
    return;
  }

  const challengeDoc = await db.collection('passkeyChallenge').doc(challenge).get();
  if (!challengeDoc.exists) {
    res.status(400).json({ error: 'Invalid or expired challenge' });
    return;
  }

  // Find which user owns this credential
  const credentialId = req.body.id; // base64url from browser
  const usersSnap = await db.collectionGroup('passkeys')
    .where('credentialId', '==', credentialId)
    .limit(1)
    .get();

  if (usersSnap.empty) {
    res.status(400).json({ error: 'Passkey not recognized' });
    return;
  }

  const credDoc = usersSnap.docs[0];
  const stored = credDoc.data() as StoredCredential;
  const uid = credDoc.ref.parent.parent!.id; // users/{uid}/passkeys/{credId}

  const verification = await verifyAuthenticationResponse({
    response: req.body,
    expectedChallenge: challenge,
    expectedOrigin: RP_ORIGINS,
    expectedRPID: RP_ID,
    credential: {
      id: stored.credentialId,
      publicKey: base64urlToUint8Array(stored.credentialPublicKey),
      counter: stored.counter,
      transports: stored.transports,
    },
  });

  if (!verification.verified) {
    res.status(400).json({ error: 'Authentication failed' });
    return;
  }

  // Update counter
  await credDoc.ref.update({ counter: verification.authenticationInfo.newCounter });

  // Clean up challenge
  await db.collection('passkeyChallenge').doc(challenge).delete();

  // Mint a Firebase custom token
  const customToken = await getAuth().createCustomToken(uid);

  res.json({ verified: true, customToken });
}
