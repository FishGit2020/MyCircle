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

function jobPath(uid: string): string {
  return `users/${uid}/crawlJobs`;
}

export function createWebCrawlerResolvers() {
  return {
    Query: {
      crawlJobs: async (_: unknown, __: unknown, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const snap = await db
          .collection(jobPath(uid))
          .orderBy('createdAt', 'desc')
          .limit(50)
          .get();

        return snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            url: data.url ?? '',
            status: data.status ?? 'pending',
            maxDepth: data.maxDepth ?? 2,
            maxPages: data.maxPages ?? 20,
            pagesVisited: data.pagesVisited ?? 0,
            createdAt: toTimestampString(data.createdAt),
            updatedAt: toTimestampString(data.updatedAt),
          };
        });
      },

      crawlJobDetail: async (_: unknown, { id }: { id: string }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();

        const jobRef = db.doc(`${jobPath(uid)}/${id}`);
        const jobDoc = await jobRef.get();
        if (!jobDoc.exists) throw new GraphQLError('Crawl job not found');
        const jobData = jobDoc.data()!;

        const [docSnap, traceSnap] = await Promise.all([
          jobRef.collection('documents').orderBy('crawledAt', 'desc').get(),
          jobRef.collection('traces').orderBy('timestamp', 'desc').limit(200).get(),
        ]);

        return {
          job: {
            id: jobDoc.id,
            url: jobData.url ?? '',
            status: jobData.status ?? 'pending',
            maxDepth: jobData.maxDepth ?? 2,
            maxPages: jobData.maxPages ?? 20,
            pagesVisited: jobData.pagesVisited ?? 0,
            createdAt: toTimestampString(jobData.createdAt),
            updatedAt: toTimestampString(jobData.updatedAt),
          },
          documents: docSnap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              jobId: id,
              url: data.url ?? '',
              title: data.title ?? null,
              contentPreview: data.contentPreview ?? null,
              statusCode: data.statusCode ?? 0,
              contentType: data.contentType ?? null,
              crawledAt: toTimestampString(data.crawledAt),
              size: data.size ?? 0,
              depth: data.depth ?? 0,
            };
          }),
          traces: traceSnap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              jobId: id,
              timestamp: toTimestampString(data.timestamp),
              level: data.level ?? 'info',
              message: data.message ?? '',
              url: data.url ?? null,
              durationMs: data.durationMs ?? null,
            };
          }),
        };
      },
    },

    Mutation: {
      startCrawl: async (
        _: unknown,
        { input }: { input: { url: string; maxDepth?: number; maxPages?: number } },
        context: ResolverContext,
      ) => {
        const uid = requireAuth(context);
        const db = getFirestore();

        // Validate URL
        try {
          new URL(input.url);
        } catch {
          throw new GraphQLError('Invalid URL');
        }

        const now = new Date();
        const jobData = {
          url: input.url,
          status: 'pending',
          maxDepth: Math.min(input.maxDepth ?? 2, 5),
          maxPages: Math.min(input.maxPages ?? 20, 100),
          pagesVisited: 0,
          createdAt: now,
          updatedAt: now,
        };

        const docRef = await db.collection(jobPath(uid)).add(jobData);

        return {
          id: docRef.id,
          ...jobData,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
      },

      stopCrawl: async (_: unknown, { id }: { id: string }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();

        const jobRef = db.doc(`${jobPath(uid)}/${id}`);
        const jobDoc = await jobRef.get();
        if (!jobDoc.exists) throw new GraphQLError('Crawl job not found');

        const data = jobDoc.data()!;
        if (data.status !== 'running' && data.status !== 'pending') {
          throw new GraphQLError(`Cannot stop a job with status: ${data.status}`);
        }

        const now = new Date();
        await jobRef.update({ status: 'stopping', updatedAt: now });

        return {
          id: jobDoc.id,
          url: data.url ?? '',
          status: 'stopping',
          maxDepth: data.maxDepth ?? 2,
          maxPages: data.maxPages ?? 20,
          pagesVisited: data.pagesVisited ?? 0,
          createdAt: toTimestampString(data.createdAt),
          updatedAt: now.toISOString(),
        };
      },

      deleteCrawlJob: async (_: unknown, { id }: { id: string }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();

        const jobRef = db.doc(`${jobPath(uid)}/${id}`);
        const jobDoc = await jobRef.get();
        if (!jobDoc.exists) throw new GraphQLError('Crawl job not found');

        // Delete subcollections
        const [docSnap, traceSnap] = await Promise.all([
          jobRef.collection('documents').get(),
          jobRef.collection('traces').get(),
        ]);

        const batch = db.batch();
        docSnap.docs.forEach((d) => batch.delete(d.ref));
        traceSnap.docs.forEach((d) => batch.delete(d.ref));
        batch.delete(jobRef);
        await batch.commit();

        return true;
      },
    },
  };
}
