import { getFirestore } from 'firebase-admin/firestore';
import { GraphQLError } from 'graphql';

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
  if (typeof val === 'object' && val !== null && 'toMillis' in val && typeof (val as { toMillis: () => number }).toMillis === 'function') {
    return new Date((val as { toMillis: () => number }).toMillis()).toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

export function createNotesResolvers() {
  return {
    Query: {
      notes: async (_: unknown, { limit = 20, search }: { limit?: number; search?: string }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const cap = Math.min(limit, 100);

        const snap = await db
          .collection('users').doc(uid).collection('notes')
          .orderBy('updatedAt', 'desc')
          .limit(cap)
          .get();

        let docs = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title ?? '',
            content: data.content ?? '',
            createdAt: toTimestampString(data.createdAt),
            updatedAt: toTimestampString(data.updatedAt),
          };
        });

        // Client-side search filter (Firestore doesn't support full-text search)
        if (search && search.trim()) {
          const q = search.trim().toLowerCase();
          docs = docs.filter(n =>
            n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
          );
        }

        return docs;
      },
    },
  };
}
