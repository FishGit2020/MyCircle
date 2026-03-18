import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as dns from 'dns';

/**
 * Check if a resolved IP address falls within private/reserved ranges.
 * Blocks SSRF attacks by preventing requests to internal infrastructure.
 */
function isPrivateIp(ip: string): boolean {
  // IPv4 private/reserved ranges
  const parts = ip.split('.').map(Number);
  if (parts.length === 4 && parts.every((p) => p >= 0 && p <= 255)) {
    if (parts[0] === 127) return true;                                    // 127.0.0.0/8
    if (parts[0] === 10) return true;                                     // 10.0.0.0/8
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true; // 172.16.0.0/12
    if (parts[0] === 192 && parts[1] === 168) return true;               // 192.168.0.0/16
    if (parts[0] === 169 && parts[1] === 254) return true;               // 169.254.0.0/16
    if (parts[0] === 0) return true;                                      // 0.0.0.0/8
  }
  // IPv6 private/reserved
  if (ip === '::1') return true;
  if (ip.startsWith('fc') || ip.startsWith('fd')) return true;   // fc00::/7
  if (ip.startsWith('fe80')) return true;                         // fe80::/10
  return false;
}

/**
 * Resolve a URL's hostname and check if it points to a private/reserved IP.
 * Returns true if the URL is blocked (private), false if safe to fetch.
 */
export async function isPrivateUrl(urlString: string): Promise<boolean> {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return true;
    const { address } = await dns.promises.lookup(parsed.hostname);
    return isPrivateIp(address);
  } catch {
    return true; // If DNS resolution fails, block the request
  }
}

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
          // SSRF protection: block private/internal IPs
          if (await isPrivateUrl(current.url)) {
            await addTrace(
              'warn',
              `Blocked private/internal URL: ${current.url}`,
              current.url,
            );
            await jobRef.collection('documents').add({
              url: current.url,
              title: null,
              contentPreview: 'Error: URL resolves to a private or reserved network address',
              statusCode: 0,
              contentType: null,
              crawledAt: new Date(),
              size: 0,
              depth: current.depth,
            });
            continue;
          }

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

          // Parse HTML with cheerio for safe content extraction
          const $ = cheerio.load(html);
          const title = $('title').first().text().trim().substring(0, 500) || null;

          // Extract metadata from <meta> tags
          const description =
            $('meta[name="description"]').attr('content')?.substring(0, 1000) ||
            $('meta[property="og:description"]').attr('content')?.substring(0, 1000) ||
            null;
          const author =
            $('meta[name="author"]').attr('content')?.substring(0, 200) || null;
          const publishDate =
            $('meta[property="article:published_time"]').attr('content') || null;
          const ogImage =
            $('meta[property="og:image"]').attr('content') || null;

          // Extract text content (strip script/style)
          $('script, style').remove();
          const textContent = $.root().text().replace(/\s+/g, ' ').trim();
          const contentPreview = textContent.substring(0, 500);

          // Full content up to 100KB with truncation flag
          const MAX_CONTENT_LENGTH = 100_000;
          const fullContent = textContent.substring(0, MAX_CONTENT_LENGTH);
          const contentTruncated = textContent.length > MAX_CONTENT_LENGTH;

          // Store document
          await jobRef.collection('documents').add({
            url: current.url,
            title,
            contentPreview,
            fullContent,
            contentTruncated,
            description,
            author,
            publishDate,
            ogImage,
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
