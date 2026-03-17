import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import axios from 'axios';

/**
 * Firestore trigger: when a new crawl job is created, start crawling.
 * The job document path: users/{uid}/crawlJobs/{jobId}
 */
export const crawlWorker = onDocumentCreated(
  {
    document: 'users/{uid}/crawlJobs/{jobId}',
    timeoutSeconds: 540,
    memory: '512MiB',
  },
  async (event) => {
    const { uid, jobId } = event.params;
    const db = getFirestore();
    const jobRef = db.doc(`users/${uid}/crawlJobs/${jobId}`);

    async function addTrace(
      level: string,
      message: string,
      url?: string,
      durationMs?: number,
    ): Promise<void> {
      await jobRef.collection('traces').add({
        timestamp: new Date(),
        level,
        message,
        url: url ?? null,
        durationMs: durationMs ?? null,
      });
    }

    async function shouldStop(): Promise<boolean> {
      const snap = await jobRef.get();
      const status = snap.data()?.status;
      return status === 'stopping' || status === 'stopped';
    }

    try {
      const jobData = event.data?.data();
      if (!jobData) return;

      const startUrl: string = jobData.url;
      const maxDepth: number = jobData.maxDepth ?? 2;
      const maxPages: number = jobData.maxPages ?? 20;

      await jobRef.update({ status: 'running', updatedAt: new Date() });
      await addTrace('info', `Starting crawl of ${startUrl}`, startUrl);

      const visited = new Set<string>();
      const toVisit: Array<{ url: string; depth: number }> = [
        { url: startUrl, depth: 0 },
      ];

      while (toVisit.length > 0 && visited.size < maxPages) {
        // Check stop flag every iteration
        if (await shouldStop()) {
          await jobRef.update({ status: 'stopped', updatedAt: new Date() });
          await addTrace('info', 'Crawl stopped by user');
          return;
        }

        const current = toVisit.shift()!;
        if (visited.has(current.url)) continue;
        visited.add(current.url);

        const start = Date.now();
        try {
          const response = await axios.get(current.url, {
            timeout: 10_000,
            maxRedirects: 3,
            headers: { 'User-Agent': 'MyCircle-Crawler/1.0' },
            validateStatus: (s: number) => s < 500,
            responseType: 'text',
            maxContentLength: 5 * 1024 * 1024, // 5 MB limit
          });

          const duration = Date.now() - start;
          const contentType: string =
            response.headers['content-type'] || '';
          const html: string =
            typeof response.data === 'string' ? response.data : '';

          // Extract title
          const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
          const title = titleMatch ? titleMatch[1].trim().substring(0, 500) : null;

          // Extract text preview (strip tags, first 500 chars)
          const textContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          const contentPreview = textContent.substring(0, 500);

          // Store document
          await jobRef.collection('documents').add({
            url: current.url,
            title,
            contentPreview,
            statusCode: response.status,
            contentType: contentType.split(';')[0].trim(),
            crawledAt: new Date(),
            size: html.length,
            depth: current.depth,
          });

          await addTrace(
            'info',
            `Crawled ${current.url} (${response.status}, ${html.length} bytes, ${duration}ms)`,
            current.url,
            duration,
          );

          // Update pages visited
          await jobRef.update({
            pagesVisited: visited.size,
            updatedAt: new Date(),
          });

          // Extract and queue links if not at max depth
          if (current.depth < maxDepth && contentType.includes('text/html')) {
            const linkRegex = /href=["']([^"']+)["']/gi;
            let match: RegExpExecArray | null;
            const baseUrl = new URL(current.url);

            while ((match = linkRegex.exec(html)) !== null) {
              try {
                const resolved = new URL(match[1], baseUrl.href);
                // Only follow same-origin HTTP(S) links
                if (
                  resolved.origin === baseUrl.origin &&
                  !visited.has(resolved.href) &&
                  (resolved.protocol === 'http:' || resolved.protocol === 'https:')
                ) {
                  // Strip hash fragments
                  resolved.hash = '';
                  if (!visited.has(resolved.href)) {
                    toVisit.push({ url: resolved.href, depth: current.depth + 1 });
                  }
                }
              } catch {
                // Invalid URL — skip
              }
            }
          }
        } catch (err: unknown) {
          const duration = Date.now() - start;
          const message =
            err instanceof Error ? err.message : String(err);
          await addTrace(
            'error',
            `Failed to crawl ${current.url}: ${message}`,
            current.url,
            duration,
          );

          await jobRef.collection('documents').add({
            url: current.url,
            title: null,
            contentPreview: `Error: ${message}`,
            statusCode: 0,
            contentType: null,
            crawledAt: new Date(),
            size: 0,
            depth: current.depth,
          });
        }

        // Polite delay between requests
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Mark completed
      await jobRef.update({ status: 'completed', updatedAt: new Date() });
      await addTrace(
        'info',
        `Crawl completed. Visited ${visited.size} pages.`,
      );
    } catch (err: unknown) {
      logger.error('Crawl worker error:', err);
      await jobRef.update({ status: 'failed', updatedAt: new Date() });
      await addTrace(
        'error',
        `Crawl failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  },
);
