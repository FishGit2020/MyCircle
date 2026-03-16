import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import type { Request, Response } from 'express';
import axios from 'axios';
import NodeCache from 'node-cache';
import { XMLParser } from 'fast-xml-parser';
import { ALLOWED_ORIGINS, checkRateLimit, verifyAuthToken } from './shared.js';

interface Deal {
  id: string;
  title: string;
  url: string;
  source: 'slickdeals' | 'dealnews' | 'reddit';
  price?: string;
  originalPrice?: string;
  store?: string;
  category?: string;
  thumbnail?: string;
  postedAt: string;
  score?: number;
}

const dealsCache = new NodeCache();
const CACHE_TTL = 900; // 15 minutes
const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

// ─── SlickDeals RSS ─────────────────────────────────────────────
async function fetchSlickDeals(): Promise<Deal[]> {
  try {
    const res = await axios.get(
      'https://slickdeals.net/newsearch.php?mode=frontpage&searcharea=deals&searchin=first&rss=1',
      { timeout: 10000, headers: { 'User-Agent': 'MyCircle/1.0 (deal-aggregator)' } }
    );
    const parsed = xmlParser.parse(res.data);
    const items = parsed?.rss?.channel?.item;
    if (!Array.isArray(items)) return [];

    return items.slice(0, 20).map((item: Record<string, unknown>, i: number) => {
      const title = typeof item.title === 'string' ? item.title : '';
      const priceMatch = title.match(/\$[\d,.]+/);
      return {
        id: `sd-${i}-${Date.now()}`,
        title,
        url: (item.link as string) || '',
        source: 'slickdeals' as const,
        price: priceMatch ? priceMatch[0] : undefined,
        store: extractStore(title),
        category: categorize(title),
        postedAt: item.pubDate ? new Date(item.pubDate as string).toISOString() : new Date().toISOString(),
      };
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn('SlickDeals fetch failed', { error: message });
    return [];
  }
}

// ─── DealNews RSS ───────────────────────────────────────────────
async function fetchDealNews(): Promise<Deal[]> {
  try {
    const res = await axios.get(
      'https://www.dealnews.com/rss/',
      { timeout: 10000, headers: { 'User-Agent': 'MyCircle/1.0 (deal-aggregator)' } }
    );
    const parsed = xmlParser.parse(res.data);
    const items = parsed?.rss?.channel?.item;
    if (!Array.isArray(items)) return [];

    return items.slice(0, 20).map((item: Record<string, unknown>, i: number) => {
      const title = typeof item.title === 'string' ? item.title : '';
      const priceMatch = title.match(/\$[\d,.]+/);
      const originalMatch = title.match(/(?:was|reg\.?|originally)\s*\$[\d,.]+/i);
      return {
        id: `dn-${i}-${Date.now()}`,
        title,
        url: (item.link as string) || '',
        source: 'dealnews' as const,
        price: priceMatch ? priceMatch[0] : undefined,
        originalPrice: originalMatch ? originalMatch[0].match(/\$[\d,.]+/)?.[0] : undefined,
        store: extractStore(title),
        category: categorize(title),
        postedAt: item.pubDate ? new Date(item.pubDate as string).toISOString() : new Date().toISOString(),
      };
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn('DealNews fetch failed', { error: message });
    return [];
  }
}

// ─── Reddit r/deals ─────────────────────────────────────────────
async function fetchRedditDeals(): Promise<Deal[]> {
  try {
    const res = await axios.get(
      'https://www.reddit.com/r/deals/hot.json?limit=20',
      { timeout: 10000, headers: { 'User-Agent': 'MyCircle/1.0 (deal-aggregator; contact@mycircledash.com)' } }
    );
    const posts = res.data?.data?.children;
    if (!Array.isArray(posts)) return [];

    return posts
      .filter((p: Record<string, Record<string, unknown>>) => !p.data.stickied && !p.data.is_self)
      .slice(0, 20)
      .map((p: Record<string, Record<string, unknown>>, i: number) => {
        const data = p.data;
        const title = (data.title as string) || '';
        const priceMatch = title.match(/\$[\d,.]+/);
        const thumbnail = data.thumbnail as string | undefined;
        return {
          id: `rd-${i}-${Date.now()}`,
          title,
          url: (data.url as string) || `https://reddit.com${data.permalink as string}`,
          source: 'reddit' as const,
          price: priceMatch ? priceMatch[0] : undefined,
          store: extractStore(title),
          category: categorize(title),
          thumbnail: thumbnail && thumbnail.startsWith('http') ? thumbnail : undefined,
          postedAt: data.created_utc ? new Date((data.created_utc as number) * 1000).toISOString() : new Date().toISOString(),
          score: (data.score as number) || 0,
        };
      });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn('Reddit fetch failed', { error: message });
    return [];
  }
}

// ─── Helpers ────────────────────────────────────────────────────
const STORE_PATTERNS: [RegExp, string][] = [
  [/amazon/i, 'Amazon'],
  [/walmart/i, 'Walmart'],
  [/costco/i, 'Costco'],
  [/target/i, 'Target'],
  [/best\s*buy/i, 'Best Buy'],
  [/home\s*depot/i, 'Home Depot'],
  [/lowe'?s/i, "Lowe's"],
  [/newegg/i, 'Newegg'],
  [/b&?h/i, 'B&H'],
  [/microcenter/i, 'Micro Center'],
  [/sam'?s\s*club/i, "Sam's Club"],
  [/macy'?s/i, "Macy's"],
  [/nike/i, 'Nike'],
  [/adidas/i, 'Adidas'],
];

function extractStore(title: string): string | undefined {
  for (const [pattern, name] of STORE_PATTERNS) {
    if (pattern.test(title)) return name;
  }
  return undefined;
}

const CATEGORY_PATTERNS: [RegExp, string][] = [
  [/headphone|laptop|phone|tablet|tv|monitor|gpu|cpu|ssd|camera|speaker|airpod|earbuds?|switch|xbox|playstation|ps5|gaming|computer/i, 'electronics'],
  [/vacuum|kitchen|mattress|furniture|bed|pillow|towel|appliance|blender|mixer|instant\s*pot|air\s*fryer/i, 'home'],
  [/jeans|shirt|shoes|sneaker|jacket|dress|clothing|apparel|wear/i, 'fashion'],
  [/tide|detergent|grocery|food|snack|coffee|vitamin|supplement|protein/i, 'grocery'],
];

function categorize(title: string): string {
  for (const [pattern, cat] of CATEGORY_PATTERNS) {
    if (pattern.test(title)) return cat;
  }
  return 'other';
}

// ─── Main Handler ───────────────────────────────────────────────
export const dealsProxy = onRequest(
  {
    cors: ALLOWED_ORIGINS,
    invoker: 'public',
    maxInstances: 5,
    memory: '256MiB',
    timeoutSeconds: 30,
  },
  async (req: Request, res: Response) => {
    // Auth check
    const uid = await verifyAuthToken(req);
    if (!uid) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Rate limit: 20 req/min per IP (generous since data is cached)
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown';
    if (checkRateLimit(ip, 20, 60)) {
      res.status(429).json({ error: 'Rate limit exceeded' });
      return;
    }

    const path = req.path.replace(/^\/deals-api\//, '');

    switch (path) {
      case 'deals': {
        // Check cache first
        const cached = dealsCache.get<Deal[]>('all-deals');
        if (cached) {
          res.status(200).json(cached);
          return;
        }

        // Fetch from all sources in parallel
        const [slickdeals, dealnews, reddit] = await Promise.all([
          fetchSlickDeals(),
          fetchDealNews(),
          fetchRedditDeals(),
        ]);

        const allDeals = [...slickdeals, ...dealnews, ...reddit]
          .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());

        dealsCache.set('all-deals', allDeals, CACHE_TTL);
        logger.info('Deals fetched', {
          slickdeals: slickdeals.length,
          dealnews: dealnews.length,
          reddit: reddit.length,
          total: allDeals.length,
        });

        res.status(200).json(allDeals);
        return;
      }
      default:
        res.status(404).json({ error: `Unknown deals route: ${path}` });
        return;
    }
  }
);
