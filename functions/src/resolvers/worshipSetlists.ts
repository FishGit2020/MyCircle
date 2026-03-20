import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { GraphQLError } from 'graphql';

const COLLECTION = 'worshipSetlists';

interface ResolverContext {
  uid: string | null;
}

function requireAuth(context: ResolverContext): string {
  if (!context.uid) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.uid;
}

function toTimestampString(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (typeof (val as { toMillis?: () => number }).toMillis === 'function') {
    return new Date((val as { toMillis: () => number }).toMillis()).toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

interface SetlistEntryData {
  songId: string;
  position: number;
  snapshotTitle: string;
  snapshotKey: string;
}

function normalizeEntries(entries: SetlistEntryData[]): SetlistEntryData[] {
  const sorted = [...entries].sort((a, b) => a.position - b.position);
  return sorted.map((e, i) => ({ ...e, position: i }));
}

function docToSetlist(id: string, data: FirebaseFirestore.DocumentData) {
  return {
    id,
    name: data.name ?? '',
    serviceDate: data.serviceDate ?? null,
    entries: Array.isArray(data.entries) ? data.entries : [],
    createdAt: toTimestampString(data.createdAt),
    updatedAt: toTimestampString(data.updatedAt),
    createdBy: data.createdBy ?? '',
  };
}

export function createWorshipSetlistResolvers() {
  return {
    Query: {
      worshipSetlists: async (_: unknown, __: unknown, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const snap = await db
          .collection(COLLECTION)
          .where('createdBy', '==', uid)
          .orderBy('updatedAt', 'desc')
          .get();
        return snap.docs.map(d => docToSetlist(d.id, d.data()));
      },

      worshipSetlist: async (_: unknown, { id }: { id: string }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const doc = await db.collection(COLLECTION).doc(id).get();
        if (!doc.exists) return null;
        const data = doc.data()!;
        if (data.createdBy !== uid) return null;
        return docToSetlist(doc.id, data);
      },
    },

    Mutation: {
      addWorshipSetlist: async (_: unknown, { input }: { input: { name: string; serviceDate?: string; entries?: SetlistEntryData[] } }, context: ResolverContext) => {
        const uid = requireAuth(context);
        if (!input.name?.trim()) {
          throw new GraphQLError('Setlist name is required', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        const db = getFirestore();
        const now = FieldValue.serverTimestamp();
        const entries = normalizeEntries(input.entries ?? []);
        const ref = await db.collection(COLLECTION).add({
          name: input.name.trim(),
          serviceDate: input.serviceDate ?? null,
          entries,
          createdAt: now,
          updatedAt: now,
          createdBy: uid,
        });
        const created = await ref.get();
        return docToSetlist(ref.id, created.data()!);
      },

      updateWorshipSetlist: async (_: unknown, { id, input }: { id: string; input: { name?: string; serviceDate?: string; entries?: SetlistEntryData[] } }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const ref = db.collection(COLLECTION).doc(id);
        const doc = await ref.get();
        if (!doc.exists || doc.data()!.createdBy !== uid) {
          throw new GraphQLError('Setlist not found', { extensions: { code: 'NOT_FOUND' } });
        }
        const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
        if (input.name !== undefined) {
          if (!input.name.trim()) {
            throw new GraphQLError('Setlist name is required', { extensions: { code: 'BAD_USER_INPUT' } });
          }
          updates.name = input.name.trim();
        }
        if (input.serviceDate !== undefined) updates.serviceDate = input.serviceDate;
        if (input.entries !== undefined) updates.entries = normalizeEntries(input.entries);
        await ref.update(updates);
        const updated = await ref.get();
        return docToSetlist(ref.id, updated.data()!);
      },

      deleteWorshipSetlist: async (_: unknown, { id }: { id: string }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const ref = db.collection(COLLECTION).doc(id);
        const doc = await ref.get();
        if (!doc.exists || doc.data()!.createdBy !== uid) {
          throw new GraphQLError('Setlist not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await ref.delete();
        return true;
      },
    },
  };
}
