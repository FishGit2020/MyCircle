import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { GraphQLError } from 'graphql';
import { uploadToStorage } from '../handlers/shared.js';

const db = getFirestore();
const ANNIVERSARIES = 'anniversaries';
const YEARS_SUB = 'years';
const MAX_PICTURES_PER_YEAR = 10;
const MAX_CONTRIBUTORS = 10;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface AnniversaryLocationInput {
  lat: number;
  lon: number;
  name?: string;
}

interface FloatingRuleInput {
  month: number;
  weekday: number;
  ordinal: number;
}

function resolveFloatingDate(rule: FloatingRuleInput, year: number): Date {
  const { month, weekday, ordinal } = rule;
  if (ordinal === -1) {
    const lastDay = new Date(year, month + 1, 0);
    const diff = (lastDay.getDay() - weekday + 7) % 7;
    lastDay.setDate(lastDay.getDate() - diff);
    return lastDay;
  }
  const first = new Date(year, month, 1);
  const firstDayOfWeek = first.getDay();
  const daysUntilFirst = (weekday - firstDayOfWeek + 7) % 7;
  const day = 1 + daysUntilFirst + (ordinal - 1) * 7;
  return new Date(year, month, day);
}

function validateFloatingRule(rule: FloatingRuleInput): void {
  if (rule.month < 0 || rule.month > 11) {
    throw new GraphQLError('FloatingRule month must be 0-11', { extensions: { code: 'BAD_USER_INPUT' } });
  }
  if (rule.weekday < 0 || rule.weekday > 6) {
    throw new GraphQLError('FloatingRule weekday must be 0-6', { extensions: { code: 'BAD_USER_INPUT' } });
  }
  if (![-1, 1, 2, 3, 4, 5].includes(rule.ordinal)) {
    throw new GraphQLError('FloatingRule ordinal must be 1-5 or -1', { extensions: { code: 'BAD_USER_INPUT' } });
  }
}

/* ---------- helpers ---------- */

async function getAnniversaryDoc(id: string) {
  const snap = await db.collection(ANNIVERSARIES).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as Record<string, unknown>;
}

function assertOwnerOrContributor(doc: Record<string, unknown>, uid: string) {
  const ownerUid = doc.ownerUid as string;
  const contributorUids = (doc.contributorUids as string[]) || [];
  if (ownerUid !== uid && !contributorUids.includes(uid)) {
    throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } });
  }
}

function assertOwner(doc: Record<string, unknown>, uid: string) {
  if (doc.ownerUid !== uid) {
    throw new GraphQLError('Only the owner can perform this action', { extensions: { code: 'FORBIDDEN' } });
  }
}

function toISOString(ts: unknown): string | null {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === 'string') return ts;
  return null;
}

function formatAnniversary(doc: Record<string, unknown>) {
  return {
    ...doc,
    originalDate: toISOString(doc.originalDate),
    floatingRule: doc.floatingRule || null,
    createdAt: toISOString(doc.createdAt),
    updatedAt: toISOString(doc.updatedAt),
    contributorUids: doc.contributorUids || [],
    contributors: ((doc.contributors as Array<Record<string, unknown>>) || []).map(c => ({
      ...c,
      addedAt: toISOString(c.addedAt),
    })),
    years: [],
  };
}

function formatYear(data: Record<string, unknown>) {
  // Backward compat: old docs have `location` (single), new ones have `locations` (array)
  let locations = data.locations as Array<Record<string, unknown>> | undefined;
  if (!locations && data.location) {
    locations = [data.location as Record<string, unknown>];
  }
  return {
    ...data,
    pictures: data.pictures || [],
    locations: locations || [],
    updatedAt: toISOString(data.updatedAt),
  };
}

/* ---------- query resolvers ---------- */

export function createAnniversaryQueryResolvers() {
  return {
    anniversaries: async (_: unknown, __: unknown, context: { uid?: string }) => {
      if (!context.uid) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });

      const owned = await db.collection(ANNIVERSARIES)
        .where('ownerUid', '==', context.uid)
        .get();

      const contributed = await db.collection(ANNIVERSARIES)
        .where('contributorUids', 'array-contains', context.uid)
        .get();

      const seen = new Set<string>();
      const results: Record<string, unknown>[] = [];

      for (const snap of [...owned.docs, ...contributed.docs]) {
        if (seen.has(snap.id)) continue;
        seen.add(snap.id);
        const doc = { id: snap.id, ...snap.data() };
        const yearSnaps = await snap.ref.collection(YEARS_SUB).orderBy('yearNumber').get();
        const years = yearSnaps.docs.map(y => formatYear({ id: y.id, ...y.data() } as Record<string, unknown>));
        results.push({ ...formatAnniversary(doc as Record<string, unknown>), years });
      }

      return results;
    },

    anniversary: async (_: unknown, args: { id: string }, context: { uid?: string }) => {
      if (!context.uid) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
      const doc = await getAnniversaryDoc(args.id);
      if (!doc) return null;
      assertOwnerOrContributor(doc, context.uid);

      const yearSnaps = await db.collection(ANNIVERSARIES).doc(args.id)
        .collection(YEARS_SUB).orderBy('yearNumber').get();
      const years = yearSnaps.docs.map(y => formatYear({ id: y.id, ...y.data() } as Record<string, unknown>));

      return { ...formatAnniversary(doc), years };
    },

    anniversaryYear: async (_: unknown, args: { anniversaryId: string; yearNumber: number }, context: { uid?: string }) => {
      if (!context.uid) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
      const doc = await getAnniversaryDoc(args.anniversaryId);
      if (!doc) return null;
      assertOwnerOrContributor(doc, context.uid);

      const yearSnap = await db.collection(ANNIVERSARIES).doc(args.anniversaryId)
        .collection(YEARS_SUB).doc(String(args.yearNumber)).get();
      if (!yearSnap.exists) return null;
      return formatYear({ id: yearSnap.id, ...yearSnap.data() } as Record<string, unknown>);
    },

    searchUsers: async (_: unknown, args: { query: string }, context: { uid?: string }) => {
      if (!context.uid) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
      const query = args.query.trim().toLowerCase();
      if (!query || query.length < 3) return [];

      try {
        const userRecord = await getAuth().getUserByEmail(query);
        if (userRecord.uid === context.uid) return [];
        return [{
          uid: userRecord.uid,
          displayName: userRecord.displayName || null,
          email: userRecord.email || '',
        }];
      } catch {
        return [];
      }
    },
  };
}

/* ---------- mutation resolvers ---------- */

export function createAnniversaryMutationResolvers() {
  return {
    createAnniversary: async (_: unknown, args: { input: { title: string; originalDate?: string; floatingRule?: FloatingRuleInput; location?: AnniversaryLocationInput } }, context: { uid?: string }) => {
      if (!context.uid) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });

      const { title, originalDate, floatingRule, location } = args.input;
      if (!title.trim() || title.trim().length > 100) {
        throw new GraphQLError('Title must be 1-100 characters', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      if (!originalDate && !floatingRule) {
        throw new GraphQLError('Either originalDate or floatingRule is required', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      let parsedDate: Date;
      if (originalDate) {
        parsedDate = new Date(originalDate);
        if (isNaN(parsedDate.getTime())) {
          throw new GraphQLError('Invalid date format', { extensions: { code: 'BAD_USER_INPUT' } });
        }
      } else {
        validateFloatingRule(floatingRule!);
        parsedDate = resolveFloatingDate(floatingRule!, new Date().getFullYear());
      }

      if (floatingRule && !originalDate) {
        // Already validated above
      } else if (floatingRule) {
        validateFloatingRule(floatingRule);
      }

      const userRecord = await getAuth().getUser(context.uid);
      const now = FieldValue.serverTimestamp();
      const anniversaryData = {
        ownerUid: context.uid,
        ownerDisplayName: userRecord.displayName || 'Unknown',
        title: title.trim(),
        originalDate: Timestamp.fromDate(parsedDate),
        floatingRule: floatingRule ? { month: floatingRule.month, weekday: floatingRule.weekday, ordinal: floatingRule.ordinal } : null,
        location: location || null,
        contributorUids: [] as string[],
        contributors: [] as unknown[],
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await db.collection(ANNIVERSARIES).add(anniversaryData);

      // Auto-generate yearly placeholders
      const startYear = parsedDate.getFullYear();
      const currentYear = new Date().getFullYear();
      const batch = db.batch();

      for (let y = startYear; y <= currentYear; y++) {
        const yearNumber = y - startYear;
        const yearRef = docRef.collection(YEARS_SUB).doc(String(yearNumber));
        batch.set(yearRef, {
          yearNumber,
          year: y,
          activity: null,
          notes: null,
          pictures: [],
          locations: [],
          updatedAt: now,
          updatedBy: null,
        });
      }
      await batch.commit();

      const created = await docRef.get();
      const createdData = { id: created.id, ...created.data() } as Record<string, unknown>;
      const yearSnaps = await docRef.collection(YEARS_SUB).orderBy('yearNumber').get();
      const years = yearSnaps.docs.map(ys => formatYear({ id: ys.id, ...ys.data() } as Record<string, unknown>));

      return { ...formatAnniversary(createdData), years };
    },

    updateAnniversary: async (_: unknown, args: { id: string; input: { title?: string; location?: AnniversaryLocationInput } }, context: { uid?: string }) => {
      if (!context.uid) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
      const doc = await getAnniversaryDoc(args.id);
      if (!doc) throw new GraphQLError('Anniversary not found', { extensions: { code: 'NOT_FOUND' } });
      assertOwner(doc, context.uid);

      const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
      if (args.input.title !== undefined) {
        if (!args.input.title.trim() || args.input.title.trim().length > 100) {
          throw new GraphQLError('Title must be 1-100 characters', { extensions: { code: 'BAD_USER_INPUT' } });
        }
        updates.title = args.input.title.trim();
      }
      if (args.input.location !== undefined) updates.location = args.input.location;

      await db.collection(ANNIVERSARIES).doc(args.id).update(updates);
      const updated = await getAnniversaryDoc(args.id);
      const yearSnaps = await db.collection(ANNIVERSARIES).doc(args.id).collection(YEARS_SUB).orderBy('yearNumber').get();
      const years = yearSnaps.docs.map(ys => formatYear({ id: ys.id, ...ys.data() } as Record<string, unknown>));
      return { ...formatAnniversary(updated!), years };
    },

    deleteAnniversary: async (_: unknown, args: { id: string }, context: { uid?: string }) => {
      if (!context.uid) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
      const doc = await getAnniversaryDoc(args.id);
      if (!doc) throw new GraphQLError('Anniversary not found', { extensions: { code: 'NOT_FOUND' } });
      assertOwner(doc, context.uid);

      // Delete pictures from Storage
      const bucket = getStorage().bucket();
      const [files] = await bucket.getFiles({ prefix: `anniversaries/${args.id}/` });
      await Promise.all(files.map(f => f.delete().catch(() => { /* ignore missing */ })));

      // Delete years subcollection
      const yearSnaps = await db.collection(ANNIVERSARIES).doc(args.id).collection(YEARS_SUB).get();
      const batch = db.batch();
      yearSnaps.docs.forEach(ys => batch.delete(ys.ref));
      batch.delete(db.collection(ANNIVERSARIES).doc(args.id));
      await batch.commit();

      return true;
    },

    updateAnniversaryYear: async (_: unknown, args: { anniversaryId: string; yearNumber: number; input: { activity?: string; notes?: string; locations?: AnniversaryLocationInput[] } }, context: { uid?: string }) => {
      if (!context.uid) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
      const doc = await getAnniversaryDoc(args.anniversaryId);
      if (!doc) throw new GraphQLError('Anniversary not found', { extensions: { code: 'NOT_FOUND' } });
      assertOwnerOrContributor(doc, context.uid);

      const yearRef = db.collection(ANNIVERSARIES).doc(args.anniversaryId)
        .collection(YEARS_SUB).doc(String(args.yearNumber));
      const yearSnap = await yearRef.get();
      if (!yearSnap.exists) throw new GraphQLError('Year not found', { extensions: { code: 'NOT_FOUND' } });

      const updates: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: context.uid,
      };
      if (args.input.activity !== undefined) {
        if (args.input.activity && args.input.activity.length > 500) {
          throw new GraphQLError('Activity must be under 500 characters', { extensions: { code: 'BAD_USER_INPUT' } });
        }
        updates.activity = args.input.activity;
      }
      if (args.input.notes !== undefined) {
        if (args.input.notes && args.input.notes.length > 5000) {
          throw new GraphQLError('Notes must be under 5000 characters', { extensions: { code: 'BAD_USER_INPUT' } });
        }
        updates.notes = args.input.notes;
      }
      if (args.input.locations !== undefined) updates.locations = args.input.locations;

      await yearRef.update(updates);
      const updated = await yearRef.get();
      return formatYear({ id: updated.id, ...updated.data() } as Record<string, unknown>);
    },

    uploadAnniversaryPicture: async (_: unknown, args: { input: { anniversaryId: string; yearNumber: number; filename: string; base64Data: string; mimeType: string } }, context: { uid?: string }) => {
      if (!context.uid) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
      const doc = await getAnniversaryDoc(args.input.anniversaryId);
      if (!doc) throw new GraphQLError('Anniversary not found', { extensions: { code: 'NOT_FOUND' } });
      assertOwnerOrContributor(doc, context.uid);

      if (!ALLOWED_MIME_TYPES.includes(args.input.mimeType)) {
        throw new GraphQLError('Only JPEG, PNG, and WebP images are allowed', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const buffer = Buffer.from(args.input.base64Data, 'base64');
      if (buffer.length > MAX_IMAGE_SIZE) {
        throw new GraphQLError('Image exceeds 10 MB limit', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const yearRef = db.collection(ANNIVERSARIES).doc(args.input.anniversaryId)
        .collection(YEARS_SUB).doc(String(args.input.yearNumber));
      const yearSnap = await yearRef.get();
      if (!yearSnap.exists) throw new GraphQLError('Year not found', { extensions: { code: 'NOT_FOUND' } });

      const yearData = yearSnap.data()!;
      const pictures = (yearData.pictures as unknown[]) || [];
      if (pictures.length >= MAX_PICTURES_PER_YEAR) {
        throw new GraphQLError(`Maximum ${MAX_PICTURES_PER_YEAR} pictures per year`, { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const storagePath = `anniversaries/${args.input.anniversaryId}/years/${args.input.yearNumber}/${Date.now()}_${args.input.filename}`;
      const bucket = getStorage().bucket();
      const { downloadUrl } = await uploadToStorage(bucket, storagePath, buffer, args.input.mimeType);

      const pictureInfo = {
        url: downloadUrl,
        filename: args.input.filename,
        storagePath,
        uploadedAt: new Date().toISOString(),
        uploadedBy: context.uid,
      };

      await yearRef.update({
        pictures: FieldValue.arrayUnion(pictureInfo),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: context.uid,
      });

      return pictureInfo;
    },

    deleteAnniversaryPicture: async (_: unknown, args: { anniversaryId: string; yearNumber: number; storagePath: string }, context: { uid?: string }) => {
      if (!context.uid) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
      const doc = await getAnniversaryDoc(args.anniversaryId);
      if (!doc) throw new GraphQLError('Anniversary not found', { extensions: { code: 'NOT_FOUND' } });
      assertOwnerOrContributor(doc, context.uid);

      // Delete from Storage
      const bucket = getStorage().bucket();
      try {
        await bucket.file(args.storagePath).delete();
      } catch { /* file may already be deleted */ }

      // Remove from Firestore array
      const yearRef = db.collection(ANNIVERSARIES).doc(args.anniversaryId)
        .collection(YEARS_SUB).doc(String(args.yearNumber));
      const yearSnap = await yearRef.get();
      if (!yearSnap.exists) return false;

      const yearData = yearSnap.data()!;
      const pictures = ((yearData.pictures as Array<Record<string, unknown>>) || [])
        .filter(p => p.storagePath !== args.storagePath);

      await yearRef.update({
        pictures,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: context.uid,
      });

      return true;
    },

    addAnniversaryContributor: async (_: unknown, args: { anniversaryId: string; contributorUid: string }, context: { uid?: string }) => {
      if (!context.uid) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
      const doc = await getAnniversaryDoc(args.anniversaryId);
      if (!doc) throw new GraphQLError('Anniversary not found', { extensions: { code: 'NOT_FOUND' } });
      assertOwner(doc, context.uid);

      const contributorUids = (doc.contributorUids as string[]) || [];
      if (contributorUids.includes(args.contributorUid)) {
        throw new GraphQLError('User is already a contributor', { extensions: { code: 'BAD_USER_INPUT' } });
      }
      if (contributorUids.length >= MAX_CONTRIBUTORS) {
        throw new GraphQLError(`Maximum ${MAX_CONTRIBUTORS} contributors`, { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const contributorRecord = await getAuth().getUser(args.contributorUid);
      const contributorInfo = {
        uid: args.contributorUid,
        displayName: contributorRecord.displayName || 'Unknown',
        email: contributorRecord.email || '',
        addedAt: new Date().toISOString(),
      };

      await db.collection(ANNIVERSARIES).doc(args.anniversaryId).update({
        contributorUids: FieldValue.arrayUnion(args.contributorUid),
        contributors: FieldValue.arrayUnion(contributorInfo),
        updatedAt: FieldValue.serverTimestamp(),
      });

      const updated = await getAnniversaryDoc(args.anniversaryId);
      const yearSnaps = await db.collection(ANNIVERSARIES).doc(args.anniversaryId).collection(YEARS_SUB).orderBy('yearNumber').get();
      const years = yearSnaps.docs.map(ys => formatYear({ id: ys.id, ...ys.data() } as Record<string, unknown>));
      return { ...formatAnniversary(updated!), years };
    },

    removeAnniversaryContributor: async (_: unknown, args: { anniversaryId: string; contributorUid: string }, context: { uid?: string }) => {
      if (!context.uid) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
      const doc = await getAnniversaryDoc(args.anniversaryId);
      if (!doc) throw new GraphQLError('Anniversary not found', { extensions: { code: 'NOT_FOUND' } });
      assertOwner(doc, context.uid);

      const contributors = ((doc.contributors as Array<Record<string, unknown>>) || [])
        .filter(c => c.uid !== args.contributorUid);

      await db.collection(ANNIVERSARIES).doc(args.anniversaryId).update({
        contributorUids: FieldValue.arrayRemove(args.contributorUid),
        contributors,
        updatedAt: FieldValue.serverTimestamp(),
      });

      const updated = await getAnniversaryDoc(args.anniversaryId);
      const yearSnaps = await db.collection(ANNIVERSARIES).doc(args.anniversaryId).collection(YEARS_SUB).orderBy('yearNumber').get();
      const years = yearSnaps.docs.map(ys => formatYear({ id: ys.id, ...ys.data() } as Record<string, unknown>));
      return { ...formatAnniversary(updated!), years };
    },
  };
}
