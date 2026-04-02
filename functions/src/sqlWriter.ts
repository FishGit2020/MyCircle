import { logger } from 'firebase-functions/v2';
import type { SqlProxyClient } from './sqlClient';
import type { AiChatLogEntry } from './aiChatLogger';

export async function logChatToSql(
  client: SqlProxyClient,
  entry: AiChatLogEntry,
  firestoreDocId: string,
): Promise<void> {
  try {
    await client.query(
      `INSERT INTO ai_chat_logs (
        id, user_id, provider, model, input_tokens, output_tokens, total_tokens,
        latency_ms, status, error, used_fallback, endpoint_id,
        question_preview, answer_preview, full_question, full_answer, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW())
      ON CONFLICT (id) DO NOTHING`,
      [
        firestoreDocId,
        entry.userId,
        entry.provider,
        entry.model,
        entry.inputTokens,
        entry.outputTokens,
        entry.totalTokens,
        entry.latencyMs,
        entry.status,
        entry.error || null,
        entry.usedFallback,
        entry.endpointId || null,
        entry.questionPreview?.slice(0, 200) || null,
        entry.answerPreview?.slice(0, 500) || null,
        entry.fullQuestion?.slice(0, 5000) || null,
        entry.fullAnswer?.slice(0, 10000) || null,
      ],
    );

    if (entry.toolCalls && entry.toolCalls.length > 0) {
      for (const tc of entry.toolCalls) {
        await client.query(
          `INSERT INTO ai_tool_calls (log_id, tool_name, duration_ms, error)
           VALUES ($1, $2, $3, $4)`,
          [firestoreDocId, tc.name, tc.durationMs ?? null, tc.error ?? null],
        );
      }
    }
  } catch (err) {
    logger.warn('SQL chat log write failed', { error: String(err) });
  }
}

export async function logBenchmarkToSql(
  client: SqlProxyClient,
  result: {
    endpointId: string;
    endpointName: string;
    model: string;
    prompt: string;
    timing?: {
      totalDuration?: number;
      loadDuration?: number;
      evalDuration?: number;
      evalCount?: number;
      tokensPerSecond?: number;
      promptTokensPerSecond?: number;
      timeToFirstToken?: number;
    };
    qualityScore?: number;
    qualityFeedback?: string;
    qualityJudge?: string;
    error?: string;
    timestamp: string;
  },
  runId: string,
  userId: string,
): Promise<void> {
  try {
    const promptHash = simpleHash(result.prompt);
    const id = `${runId}_${result.endpointId}_${result.model}_${promptHash}`;

    await client.query(
      `INSERT INTO benchmark_results (
        id, run_id, user_id, endpoint_id, endpoint_name, model, prompt,
        tokens_per_second, prompt_tokens_per_second, time_to_first_token,
        total_duration, load_duration, eval_duration, eval_count,
        quality_score, quality_feedback, quality_judge, error, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      ON CONFLICT (id) DO NOTHING`,
      [
        id, runId, userId,
        result.endpointId, result.endpointName, result.model, result.prompt,
        result.timing?.tokensPerSecond ?? null,
        result.timing?.promptTokensPerSecond ?? null,
        result.timing?.timeToFirstToken ?? null,
        result.timing?.totalDuration ?? null,
        result.timing?.loadDuration ?? null,
        result.timing?.evalDuration ?? null,
        result.timing?.evalCount ?? null,
        result.qualityScore ?? null,
        result.qualityFeedback ?? null,
        result.qualityJudge ?? null,
        result.error ?? null,
        result.timestamp,
      ],
    );
  } catch (err) {
    logger.warn('SQL benchmark write failed', { error: String(err) });
  }
}

export async function logQuotaToSql(
  client: SqlProxyClient,
  snapshot: {
    id: string;
    collectedAt: string;
    elapsedDays: number;
    daysInMonth: number;
    cloudRun: { totalRequests: number; mtdCostUsd: number; projectedCostUsd: number };
    functions: { totalInvocations: number; mtdCostUsd: number; projectedCostUsd: number };
    storage: { totalBytes: number; bandwidthBytes: number; mtdCostUsd: number; projectedCostUsd: number };
    firestore: { reads: { today: number; peak7d: number }; writes: { today: number; peak7d: number }; deletes: { today: number; peak7d: number }; mtdCostUsd: number; projectedCostUsd: number };
    tts: { wavenetStandard: { used: number }; neural2Polyglot: { used: number }; chirp3: { used: number } };
    artifactRegistry: { totalBytes: number; mtdCostUsd: number; projectedCostUsd: number };
    hosting: { storageBytes: number | null; dailyDownloadBytes: number | null; mtdCostUsd: number; projectedCostUsd: number };
    totalMtdCostUsd: number;
    totalProjectedCostUsd: number;
    errors: string[];
  },
): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS quota_snapshots (
      id                       TEXT PRIMARY KEY,
      collected_at             TIMESTAMPTZ NOT NULL,
      elapsed_days             INTEGER NOT NULL DEFAULT 0,
      days_in_month            INTEGER NOT NULL DEFAULT 0,
      cloud_run_requests       BIGINT NOT NULL DEFAULT 0,
      cloud_run_mtd_cost       NUMERIC(10,4) NOT NULL DEFAULT 0,
      cloud_run_proj_cost      NUMERIC(10,4) NOT NULL DEFAULT 0,
      functions_invocations    BIGINT NOT NULL DEFAULT 0,
      functions_mtd_cost       NUMERIC(10,4) NOT NULL DEFAULT 0,
      functions_proj_cost      NUMERIC(10,4) NOT NULL DEFAULT 0,
      storage_bytes            BIGINT NOT NULL DEFAULT 0,
      storage_bandwidth_bytes  BIGINT NOT NULL DEFAULT 0,
      storage_mtd_cost         NUMERIC(10,4) NOT NULL DEFAULT 0,
      storage_proj_cost        NUMERIC(10,4) NOT NULL DEFAULT 0,
      firestore_reads_today    BIGINT NOT NULL DEFAULT 0,
      firestore_reads_peak7d   BIGINT NOT NULL DEFAULT 0,
      firestore_writes_today   BIGINT NOT NULL DEFAULT 0,
      firestore_writes_peak7d  BIGINT NOT NULL DEFAULT 0,
      firestore_deletes_today  BIGINT NOT NULL DEFAULT 0,
      firestore_deletes_peak7d BIGINT NOT NULL DEFAULT 0,
      firestore_mtd_cost       NUMERIC(10,4) NOT NULL DEFAULT 0,
      firestore_proj_cost      NUMERIC(10,4) NOT NULL DEFAULT 0,
      tts_wavenet_chars        BIGINT NOT NULL DEFAULT 0,
      tts_neural2_chars        BIGINT NOT NULL DEFAULT 0,
      tts_chirp3_chars         BIGINT NOT NULL DEFAULT 0,
      artifact_bytes           BIGINT NOT NULL DEFAULT 0,
      artifact_mtd_cost        NUMERIC(10,4) NOT NULL DEFAULT 0,
      artifact_proj_cost       NUMERIC(10,4) NOT NULL DEFAULT 0,
      hosting_storage_bytes    BIGINT,
      hosting_dl_bytes         BIGINT,
      hosting_mtd_cost         NUMERIC(10,4) NOT NULL DEFAULT 0,
      hosting_proj_cost        NUMERIC(10,4) NOT NULL DEFAULT 0,
      total_mtd_cost           NUMERIC(10,4) NOT NULL DEFAULT 0,
      total_proj_cost          NUMERIC(10,4) NOT NULL DEFAULT 0,
      errors                   TEXT[] NOT NULL DEFAULT '{}',
      raw_json                 JSONB NOT NULL,
      created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await client.query(
    `INSERT INTO quota_snapshots (
      id, collected_at, elapsed_days, days_in_month,
      cloud_run_requests, cloud_run_mtd_cost, cloud_run_proj_cost,
      functions_invocations, functions_mtd_cost, functions_proj_cost,
      storage_bytes, storage_bandwidth_bytes, storage_mtd_cost, storage_proj_cost,
      firestore_reads_today, firestore_reads_peak7d,
      firestore_writes_today, firestore_writes_peak7d,
      firestore_deletes_today, firestore_deletes_peak7d,
      firestore_mtd_cost, firestore_proj_cost,
      tts_wavenet_chars, tts_neural2_chars, tts_chirp3_chars,
      artifact_bytes, artifact_mtd_cost, artifact_proj_cost,
      hosting_storage_bytes, hosting_dl_bytes, hosting_mtd_cost, hosting_proj_cost,
      total_mtd_cost, total_proj_cost, errors, raw_json
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
      $15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,
      $29,$30,$31,$32,$33,$34,$35,$36
    ) ON CONFLICT (id) DO NOTHING`,
    [
      snapshot.id,
      snapshot.collectedAt,
      snapshot.elapsedDays,
      snapshot.daysInMonth,
      snapshot.cloudRun.totalRequests,
      snapshot.cloudRun.mtdCostUsd,
      snapshot.cloudRun.projectedCostUsd,
      snapshot.functions.totalInvocations,
      snapshot.functions.mtdCostUsd,
      snapshot.functions.projectedCostUsd,
      snapshot.storage.totalBytes,
      snapshot.storage.bandwidthBytes,
      snapshot.storage.mtdCostUsd,
      snapshot.storage.projectedCostUsd,
      snapshot.firestore.reads.today,
      snapshot.firestore.reads.peak7d,
      snapshot.firestore.writes.today,
      snapshot.firestore.writes.peak7d,
      snapshot.firestore.deletes.today,
      snapshot.firestore.deletes.peak7d,
      snapshot.firestore.mtdCostUsd,
      snapshot.firestore.projectedCostUsd,
      snapshot.tts.wavenetStandard.used,
      snapshot.tts.neural2Polyglot.used,
      snapshot.tts.chirp3.used,
      snapshot.artifactRegistry.totalBytes,
      snapshot.artifactRegistry.mtdCostUsd,
      snapshot.artifactRegistry.projectedCostUsd,
      snapshot.hosting.storageBytes ?? null,
      snapshot.hosting.dailyDownloadBytes ?? null,
      snapshot.hosting.mtdCostUsd,
      snapshot.hosting.projectedCostUsd,
      snapshot.totalMtdCostUsd,
      snapshot.totalProjectedCostUsd,
      snapshot.errors,
      JSON.stringify(snapshot),
    ],
  );
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
