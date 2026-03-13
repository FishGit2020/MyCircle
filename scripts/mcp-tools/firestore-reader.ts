import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import {
  getFirestore,
  Timestamp,
  type Firestore,
  type Query,
  type DocumentData,
} from 'firebase-admin/firestore';

// ─── Firebase init (singleton) ───────────────────────────────

function getDb(): Firestore {
  if (getApps().length === 0) {
    initializeApp({ credential: applicationDefault() });
  }
  return getFirestore();
}

// ─── Helpers ─────────────────────────────────────────────────

function formatTimestamp(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (val instanceof Date) {
    return val.toISOString();
  }
  if (typeof val === 'object' && val !== null && '_seconds' in val) {
    const ts = val as { _seconds: number; _nanoseconds: number };
    return new Date(ts._seconds * 1000).toISOString();
  }
  return String(val);
}

function formatDocFields(data: DocumentData): string {
  const lines: string[] = [];
  for (const [key, val] of Object.entries(data)) {
    if (val instanceof Timestamp || (typeof val === 'object' && val !== null && '_seconds' in val)) {
      lines.push(`  ${key}: ${formatTimestamp(val)}`);
    } else if (typeof val === 'object' && val !== null) {
      lines.push(`  ${key}: ${JSON.stringify(val)}`);
    } else {
      lines.push(`  ${key}: ${String(val)}`);
    }
  }
  return lines.join('\n');
}

// ─── Public API ──────────────────────────────────────────────

export interface ReadFeedbackOptions {
  collection?: string;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Query a Firestore collection with optional ordering and limit.
 */
export async function readFirestoreFeedback(options: ReadFeedbackOptions = {}): Promise<string> {
  const {
    collection = 'feedback',
    limit = 20,
    orderBy = 'createdAt',
    orderDirection = 'desc',
  } = options;

  try {
    const db = getDb();
    let query: Query<DocumentData> = db.collection(collection);
    query = query.orderBy(orderBy, orderDirection).limit(limit);

    const snapshot = await query.get();

    if (snapshot.empty) {
      return `No documents found in "${collection}".`;
    }

    const docs = snapshot.docs.map((doc, i) => {
      const data = doc.data();
      return `[${i + 1}] id: ${doc.id}\n${formatDocFields(data)}`;
    });

    return `# ${collection} (${snapshot.size} document${snapshot.size === 1 ? '' : 's'})\n\n${docs.join('\n\n')}`;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `Error reading "${collection}": ${msg}`;
  }
}

/**
 * Get document counts for key Firestore collections.
 */
export async function readFirestoreStats(): Promise<string> {
  const collections = ['worshipSongs', 'announcements', 'users'];
  const results: string[] = [];

  try {
    const db = getDb();

    for (const name of collections) {
      try {
        const snapshot = await db.collection(name).count().get();
        results.push(`${name}: ${snapshot.data().count} documents`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push(`${name}: error — ${msg}`);
      }
    }

    return `# Firestore Collection Stats\n\n${results.join('\n')}`;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `Error connecting to Firestore: ${msg}`;
  }
}

/**
 * Read recent feedback/announcements from the last N days.
 */
export async function readUserFeedback(days: number = 7): Promise<string> {
  try {
    const db = getDb();
    const cutoff = Timestamp.fromDate(
      new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    );

    const collections = ['feedback', 'announcements'];
    const sections: string[] = [];

    for (const name of collections) {
      try {
        const snapshot = await db
          .collection(name)
          .where('createdAt', '>=', cutoff)
          .orderBy('createdAt', 'desc')
          .limit(50)
          .get();

        if (snapshot.empty) {
          sections.push(`## ${name}\nNo documents in the last ${days} day(s).`);
          continue;
        }

        const docs = snapshot.docs.map((doc, i) => {
          const data = doc.data();
          return `[${i + 1}] id: ${doc.id}\n${formatDocFields(data)}`;
        });

        sections.push(
          `## ${name} (${snapshot.size} in last ${days} day${days === 1 ? '' : 's'})\n\n${docs.join('\n\n')}`
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        sections.push(`## ${name}\nError: ${msg}`);
      }
    }

    return sections.join('\n\n');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `Error connecting to Firestore: ${msg}`;
  }
}
