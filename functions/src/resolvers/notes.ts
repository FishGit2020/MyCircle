import { getFirestore, FieldValue } from 'firebase-admin/firestore';
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

function docToNote(id: string, data: FirebaseFirestore.DocumentData) {
  return {
    id,
    title: data.title ?? '',
    content: data.content ?? '',
    createdAt: toTimestampString(data.createdAt),
    updatedAt: toTimestampString(data.updatedAt),
  };
}

export function createNotesResolvers() {
  return {
    Query: {
      notes: async (_: unknown, { limit = 500, search }: { limit?: number; search?: string }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const cap = Math.min(limit, 500);

        const snap = await db
          .collection('users').doc(uid).collection('notes')
          .orderBy('updatedAt', 'desc')
          .limit(cap)
          .get();

        let docs = snap.docs.map(d => docToNote(d.id, d.data()));

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

    Mutation: {
      addNote: async (_: unknown, { input }: { input: { title: string; content: string } }, context: ResolverContext) => {
        const uid = requireAuth(context);
        if (!input.title.trim() && !input.content.trim()) {
          throw new GraphQLError('Note must have a title or content', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        const db = getFirestore();
        const ref = await db
          .collection('users').doc(uid).collection('notes')
          .add({
            title: input.title,
            content: input.content,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        const snap = await ref.get();
        return docToNote(ref.id, snap.data() ?? {});
      },

      updateNote: async (_: unknown, { id, input }: { id: string; input: { title?: string | null; content?: string | null } }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const ref = db.collection('users').doc(uid).collection('notes').doc(id);
        const snap = await ref.get();
        if (!snap.exists) {
          throw new GraphQLError('Note not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
        if (input.title != null) updates.title = input.title;
        if (input.content != null) updates.content = input.content;
        await ref.update(updates);
        const updated = await ref.get();
        return docToNote(id, updated.data() ?? {});
      },

      deleteNote: async (_: unknown, { id }: { id: string }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const ref = db.collection('users').doc(uid).collection('notes').doc(id);
        const snap = await ref.get();
        if (!snap.exists) {
          return false;
        }
        await ref.delete();
        return true;
      },
    },
  };
}
