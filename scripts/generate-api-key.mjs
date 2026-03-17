#!/usr/bin/env node
/**
 * Generate an API key for OpenClaw / server-to-server access.
 *
 * Usage:
 *   node scripts/generate-api-key.mjs --uid=<firebase-uid> [--label=openclaw]
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS env var pointing to a service account JSON.
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { randomBytes, createHash } from 'crypto';

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v || true];
  })
);

const uid = args.uid;
const label = args.label || 'openclaw';

if (!uid) {
  console.error('Usage: node scripts/generate-api-key.mjs --uid=<firebase-uid> [--label=openclaw]');
  process.exit(1);
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Error: GOOGLE_APPLICATION_CREDENTIALS env var must point to a service account JSON file.');
  process.exit(1);
}

// Initialize Firebase Admin with service account
const sa = await import(process.env.GOOGLE_APPLICATION_CREDENTIALS, { with: { type: 'json' } });
initializeApp({ credential: cert(sa.default) });

const db = getFirestore();

// Generate a 32-byte random key (64 hex chars)
const rawKey = randomBytes(32).toString('hex');
const hash = createHash('sha256').update(rawKey).digest('hex');

// Store hash → uid mapping in Firestore
await db.collection('apiKeys').doc(hash).set({
  uid,
  label,
  createdAt: new Date().toISOString(),
});

console.log('\n--- API Key Generated ---');
console.log(`UID:   ${uid}`);
console.log(`Label: ${label}`);
console.log(`Hash:  ${hash}`);
console.log(`\nAPI Key (save this — it will NOT be shown again):\n`);
console.log(`  ${rawKey}`);
console.log('\nUse it with: X-API-Key: <key>');
console.log('The key is hashed (SHA-256) before storage — the raw key is never persisted.\n');
