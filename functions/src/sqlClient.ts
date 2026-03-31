import { getFirestore } from 'firebase-admin/firestore';
import { Client } from 'pg';

export interface SqlConnectionConfig {
  tunnelUrl: string;
  dbName: string;
  username?: string;
  password?: string;
  status: string;
  lastTestedAt?: string;
}

// In-memory cache for connection configs (60s TTL)
const configCache = new Map<string, { config: SqlConnectionConfig | null; expiry: number }>();
const CACHE_TTL_MS = 60_000;

export async function getCachedSqlConfig(uid: string): Promise<SqlConnectionConfig | null> {
  const cached = configCache.get(uid);
  if (cached && Date.now() < cached.expiry) return cached.config;

  const db = getFirestore();
  const doc = await db.doc(`users/${uid}/sqlConnection/config`).get();
  const config = doc.exists ? (doc.data() as SqlConnectionConfig) : null;
  configCache.set(uid, { config, expiry: Date.now() + CACHE_TTL_MS });
  return config;
}

export function clearSqlConfigCache(uid: string): void {
  configCache.delete(uid);
}

export async function createSqlClient(config: SqlConnectionConfig): Promise<Client> {
  // Parse the tunnel URL to extract host/port
  const url = new URL(config.tunnelUrl);
  const client = new Client({
    host: url.hostname,
    port: url.port ? parseInt(url.port, 10) : 5432,
    database: config.dbName || 'mycircle',
    user: config.username || 'postgres',
    password: config.password || undefined,
    ssl: url.protocol === 'https:' ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 10_000,
  });
  await client.connect();
  return client;
}

export async function testSqlConnection(config: SqlConnectionConfig): Promise<{ ok: boolean; error?: string }> {
  let client: Client | null = null;
  try {
    client = await createSqlClient(config);
    await client.query('SELECT 1');
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || String(err) };
  } finally {
    if (client) {
      try { await client.end(); } catch { /* ignore */ }
    }
  }
}

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS ai_chat_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    latency_ms INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'success',
    error TEXT,
    used_fallback BOOLEAN NOT NULL DEFAULT false,
    endpoint_id TEXT,
    question_preview TEXT,
    answer_preview TEXT,
    full_question TEXT,
    full_answer TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS ai_tool_calls (
    id SERIAL PRIMARY KEY,
    log_id TEXT NOT NULL REFERENCES ai_chat_logs(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    duration_ms INTEGER,
    error TEXT
  );

  CREATE TABLE IF NOT EXISTS benchmark_results (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    endpoint_id TEXT NOT NULL,
    endpoint_name TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt TEXT NOT NULL,
    tokens_per_second REAL,
    prompt_tokens_per_second REAL,
    time_to_first_token REAL,
    total_duration REAL,
    load_duration REAL,
    eval_duration REAL,
    eval_count INTEGER,
    quality_score REAL,
    quality_feedback TEXT,
    quality_judge TEXT,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL
  );

  CREATE TABLE IF NOT EXISTS feature_events (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    feature TEXT NOT NULL,
    action TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_chat_logs_created_at ON ai_chat_logs(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_chat_logs_provider_model ON ai_chat_logs(provider, model);
  CREATE INDEX IF NOT EXISTS idx_chat_logs_user_id ON ai_chat_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_chat_logs_status ON ai_chat_logs(status);
  CREATE INDEX IF NOT EXISTS idx_tool_calls_log_id ON ai_tool_calls(log_id);
  CREATE INDEX IF NOT EXISTS idx_tool_calls_tool_name ON ai_tool_calls(tool_name);
  CREATE INDEX IF NOT EXISTS idx_benchmark_created_at ON benchmark_results(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_benchmark_model ON benchmark_results(model);
  CREATE INDEX IF NOT EXISTS idx_benchmark_endpoint ON benchmark_results(endpoint_id, model);
`;

export async function initSqlSchema(client: Client): Promise<void> {
  await client.query(SCHEMA_SQL);
}
