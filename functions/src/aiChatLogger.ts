import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { getCachedSqlConfig, createSqlClient } from './sqlClient';
import { logChatToSql } from './sqlWriter';

export interface AiToolCallTiming {
  name: string;
  durationMs?: number;
  error?: string;
}

export interface AiChatLogEntry {
  userId: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
  toolCalls: AiToolCallTiming[];
  questionPreview: string;
  answerPreview: string;
  status: 'success' | 'error';
  error?: string;
  usedFallback: boolean;
  /** Full untruncated user message */
  fullQuestion?: string;
  /** Full untruncated AI response */
  fullAnswer?: string;
  /** Endpoint ID for correlating with benchmark data */
  endpointId?: string;
}

/** Truncate text to a maximum length, adding ellipsis if truncated. */
export function truncate(text: string, max: number): string {
  if (!text || text.length <= max) return text || '';
  return text.slice(0, max) + '...';
}

/**
 * Fire-and-forget write to the `aiChatLogs` collection.
 * Never throws — logs a warning on failure.
 */
export function logAiChatInteraction(entry: AiChatLogEntry): void {
  try {
    const db = getFirestore();
    const data = {
      ...entry,
      questionPreview: truncate(entry.questionPreview, 200),
      answerPreview: truncate(entry.answerPreview, 500),
      fullQuestion: truncate(entry.fullQuestion || '', 5000),
      fullAnswer: truncate(entry.fullAnswer || '', 10000),
      timestamp: FieldValue.serverTimestamp(),
    };

    db.collection('aiChatLogs').add(data)
      .then(async (ref) => {
        // SQL dual-write (fire-and-forget)
        try {
          const config = await getCachedSqlConfig(entry.userId);
          if (config && config.status === 'connected') {
            const client = createSqlClient(config);
            await logChatToSql(client, entry, ref.id);
          }
        } catch (sqlErr) {
          logger.warn('SQL dual-write failed', { error: String(sqlErr) });
        }
      })
      .catch((err) => {
        logger.warn('Failed to log AI chat interaction', { error: String(err) });
      });
  } catch (err) {
    logger.warn('Failed to log AI chat interaction', { error: String(err) });
  }
}
