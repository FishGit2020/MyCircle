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

export function createDailyLogResolvers() {
  return {
    Mutation: {
      createDailyLog: async (
        _: unknown,
        { input }: { input: { content: string; date?: string } },
        context: ResolverContext
      ) => {
        const uid = requireAuth(context);
        const db = getFirestore();

        const date = input.date || new Date().toISOString().split('T')[0];
        const now = FieldValue.serverTimestamp();

        const ref = await db.collection('users').doc(uid).collection('dailylog').add({
          content: input.content,
          date,
          createdAt: now,
          updatedAt: now,
        });

        return {
          id: ref.id,
          content: input.content,
          date,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      },
    },
  };
}
