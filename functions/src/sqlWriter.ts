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

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
