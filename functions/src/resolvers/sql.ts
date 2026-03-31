import { z } from 'zod';
import { logger } from 'firebase-functions/v2';
import { getFirestore } from 'firebase-admin/firestore';
import {
  clearSqlConfigCache,
  createSqlClient,
  getCachedSqlConfig,
  testSqlConnection,
  initSqlSchema,
  SqlConnectionConfig,
} from '../sqlClient';
import { Client } from 'pg';
import { logChatToSql, logBenchmarkToSql } from '../sqlWriter';

async function runBackfill(
  uid: string,
  config: SqlConnectionConfig,
  startAfterDocId: string | null,
  initialMigrated: number,
  initialErrors: number,
): Promise<void> {
  const db = getFirestore();
  let client: Client | null = null;
  let totalMigrated = initialMigrated;
  let totalErrors = initialErrors;
  let lastDocId = startAfterDocId;

  try {
    client = await createSqlClient(config);

    // Backfill chat logs
    let hasMore = true;
    while (hasMore) {
      let query = db.collection('aiChatLogs')
        .orderBy('timestamp')
        .limit(500);
      if (lastDocId) {
        const lastDoc = await db.collection('aiChatLogs').doc(lastDocId).get();
        if (lastDoc.exists) {
          query = query.startAfter(lastDoc);
        }
      }

      const snap = await query.get();
      if (snap.empty) { hasMore = false; break; }

      for (const doc of snap.docs) {
        try {
          const d = doc.data();
          await logChatToSql(client, {
            userId: d.userId || 'unknown',
            provider: d.provider || 'unknown',
            model: d.model || 'unknown',
            inputTokens: d.inputTokens || 0,
            outputTokens: d.outputTokens || 0,
            totalTokens: d.totalTokens || 0,
            latencyMs: d.latencyMs || 0,
            toolCalls: d.toolCalls || [],
            questionPreview: d.questionPreview || '',
            answerPreview: d.answerPreview || '',
            status: d.status || 'success',
            usedFallback: d.usedFallback || false,
            fullQuestion: d.fullQuestion,
            fullAnswer: d.fullAnswer,
            endpointId: d.endpointId,
            error: d.error,
          }, doc.id);
          totalMigrated++;
        } catch {
          totalErrors++;
        }
        lastDocId = doc.id;
      }

      // Update progress
      await db.doc(`users/${uid}/sqlBackfillState/status`).update({
        totalMigrated,
        totalErrors,
        lastDocId,
      });

      if (snap.size < 500) hasMore = false;
    }

    // Backfill benchmark results
    const benchSnap = await db.collectionGroup('benchmarkRuns').get();
    for (const doc of benchSnap.docs) {
      try {
        const d = doc.data();
        const runUserId = d.userId || doc.ref.parent.parent?.id || 'unknown';
        const results = d.results || [];
        for (const r of results) {
          await logBenchmarkToSql(client, r, doc.id, runUserId);
          totalMigrated++;
        }
      } catch {
        totalErrors++;
      }
    }

    await db.doc(`users/${uid}/sqlBackfillState/status`).set({
      status: 'completed',
      totalMigrated,
      totalErrors,
      lastDocId,
      startedAt: (await db.doc(`users/${uid}/sqlBackfillState/status`).get()).data()?.startedAt,
      completedAt: new Date().toISOString(),
      error: null,
    });
  } catch (err: any) {
    await db.doc(`users/${uid}/sqlBackfillState/status`).update({
      status: 'error',
      totalMigrated,
      totalErrors,
      lastDocId,
      error: err.message || String(err),
    });
  } finally {
    if (client) try { await client.end(); } catch { /* ignore */ }
  }
}

export function createSqlQueryResolvers() {
  return {
    sqlConnectionStatus: async (_: any, __: any, ctx: any) => {
      const uid = ctx?.uid;
      if (!uid) throw new Error('Authentication required');

      const db = getFirestore();
      const doc = await db.doc(`users/${uid}/sqlConnection/config`).get();
      if (!doc.exists) return null;

      const data = doc.data() as SqlConnectionConfig;
      return {
        tunnelUrl: data.tunnelUrl,
        dbName: data.dbName || 'mycircle',
        status: data.status || 'unknown',
        lastTestedAt: data.lastTestedAt || null,
        hasCredentials: !!(data.username && data.password),
      };
    },
    sqlBackfillStatus: async (_: any, __: any, ctx: any) => {
      const uid = ctx?.uid;
      if (!uid) return null;
      const db = getFirestore();
      const doc = await db.doc(`users/${uid}/sqlBackfillState/status`).get();
      if (!doc.exists) return { status: 'idle', totalMigrated: 0, totalErrors: 0, startedAt: null, completedAt: null, error: null };
      const d = doc.data()!;
      return {
        status: d.status || 'idle',
        totalMigrated: d.totalMigrated || 0,
        totalErrors: d.totalErrors || 0,
        startedAt: d.startedAt || null,
        completedAt: d.completedAt || null,
        error: d.error || null,
      };
    },
    sqlAnalyticsSummary: async (_: any, { days = 30 }: { days?: number }, ctx: any) => {
      const uid = ctx?.uid;
      if (!uid) return null;
      const config = await getCachedSqlConfig(uid);
      if (!config || config.status !== 'connected') return null;

      let client;
      try {
        client = await createSqlClient(config);
        const since = new Date(Date.now() - days * 86400000).toISOString();

        const summary = await client.query(
          `SELECT COUNT(*) as total_calls,
                  COALESCE(SUM(input_tokens),0) as total_input,
                  COALESCE(SUM(output_tokens),0) as total_output
           FROM ai_chat_logs WHERE created_at >= $1`, [since]
        );

        const providers = await client.query(
          `SELECT provider, COUNT(*) as calls, COALESCE(SUM(input_tokens+output_tokens),0) as tokens,
                  COALESCE(AVG(latency_ms),0) as avg_latency,
                  CASE WHEN COUNT(*)>0 THEN COUNT(*) FILTER (WHERE status='error')::float/COUNT(*) ELSE 0 END as error_rate
           FROM ai_chat_logs WHERE created_at >= $1 GROUP BY provider`, [since]
        );

        const models = await client.query(
          `SELECT model, provider, COUNT(*) as calls, COALESCE(SUM(input_tokens+output_tokens),0) as tokens,
                  COALESCE(AVG(latency_ms),0) as avg_latency
           FROM ai_chat_logs WHERE created_at >= $1 GROUP BY model, provider ORDER BY calls DESC`, [since]
        );

        const daily = await client.query(
          `SELECT created_at::date as date, COUNT(*) as calls, COALESCE(SUM(input_tokens+output_tokens),0) as tokens,
                  COALESCE(AVG(latency_ms),0) as avg_latency, COUNT(*) FILTER (WHERE status='error') as errors
           FROM ai_chat_logs WHERE created_at >= $1 GROUP BY created_at::date ORDER BY date`, [since]
        );

        const s = summary.rows[0];
        return {
          totalCalls: parseInt(s.total_calls),
          totalInputTokens: parseInt(s.total_input),
          totalOutputTokens: parseInt(s.total_output),
          totalCost: null,
          providerBreakdown: providers.rows.map((r: any) => ({
            provider: r.provider, calls: parseInt(r.calls), tokens: parseInt(r.tokens),
            avgLatencyMs: parseFloat(r.avg_latency), errorRate: parseFloat(r.error_rate),
          })),
          modelBreakdown: models.rows.map((r: any) => ({
            model: r.model, provider: r.provider, calls: parseInt(r.calls), tokens: parseInt(r.tokens),
            avgLatencyMs: parseFloat(r.avg_latency), estimatedCost: null,
          })),
          dailyBreakdown: daily.rows.map((r: any) => ({
            date: r.date.toISOString().slice(0, 10), calls: parseInt(r.calls), tokens: parseInt(r.tokens),
            avgLatencyMs: parseFloat(r.avg_latency), errors: parseInt(r.errors),
          })),
          since,
        };
      } catch (err) {
        logger.warn('sqlAnalyticsSummary failed', { error: String(err) });
        return null;
      } finally {
        if (client) try { await client.end(); } catch {}
      }
    },
    sqlLatencyPercentiles: async (_: any, { days = 30 }: { days?: number }, ctx: any) => {
      const uid = ctx?.uid;
      if (!uid) return [];
      const config = await getCachedSqlConfig(uid);
      if (!config || config.status !== 'connected') return [];

      let client;
      try {
        client = await createSqlClient(config);
        const since = new Date(Date.now() - days * 86400000).toISOString();
        const result = await client.query(
          `SELECT provider, model,
                  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency_ms) as p50,
                  PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY latency_ms) as p90,
                  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms) as p99,
                  COUNT(*) as sample_size
           FROM ai_chat_logs WHERE created_at >= $1 AND status='success'
           GROUP BY provider, model ORDER BY sample_size DESC`, [since]
        );
        return result.rows.map((r: any) => ({
          provider: r.provider, model: r.model,
          p50: parseFloat(r.p50), p90: parseFloat(r.p90), p99: parseFloat(r.p99),
          sampleSize: parseInt(r.sample_size),
        }));
      } catch (err) {
        logger.warn('sqlLatencyPercentiles failed', { error: String(err) });
        return [];
      } finally {
        if (client) try { await client.end(); } catch {}
      }
    },
    sqlToolUsageStats: async (_: any, { days = 30 }: { days?: number }, ctx: any) => {
      const uid = ctx?.uid;
      if (!uid) return [];
      const config = await getCachedSqlConfig(uid);
      if (!config || config.status !== 'connected') return [];

      let client;
      try {
        client = await createSqlClient(config);
        const since = new Date(Date.now() - days * 86400000).toISOString();
        const result = await client.query(
          `SELECT tc.tool_name, COUNT(*) as call_count,
                  AVG(tc.duration_ms) as avg_duration,
                  CASE WHEN COUNT(*)>0 THEN COUNT(*) FILTER (WHERE tc.error IS NOT NULL)::float/COUNT(*) ELSE 0 END as error_rate
           FROM ai_tool_calls tc JOIN ai_chat_logs l ON tc.log_id=l.id
           WHERE l.created_at >= $1
           GROUP BY tc.tool_name ORDER BY call_count DESC`, [since]
        );
        return result.rows.map((r: any) => ({
          toolName: r.tool_name, callCount: parseInt(r.call_count),
          avgDurationMs: r.avg_duration ? parseFloat(r.avg_duration) : null,
          errorRate: parseFloat(r.error_rate),
        }));
      } catch (err) {
        logger.warn('sqlToolUsageStats failed', { error: String(err) });
        return [];
      } finally {
        if (client) try { await client.end(); } catch {}
      }
    },
    sqlToolCoOccurrences: async (_: any, { days = 30, minCount = 2 }: { days?: number; minCount?: number }, ctx: any) => {
      const uid = ctx?.uid;
      if (!uid) return [];
      const config = await getCachedSqlConfig(uid);
      if (!config || config.status !== 'connected') return [];

      let client;
      try {
        client = await createSqlClient(config);
        const since = new Date(Date.now() - days * 86400000).toISOString();
        const result = await client.query(
          `SELECT t1.tool_name as tool_a, t2.tool_name as tool_b, COUNT(*) as co_occurrences
           FROM ai_tool_calls t1
           JOIN ai_tool_calls t2 ON t1.log_id=t2.log_id AND t1.tool_name < t2.tool_name
           JOIN ai_chat_logs l ON t1.log_id=l.id
           WHERE l.created_at >= $1
           GROUP BY t1.tool_name, t2.tool_name
           HAVING COUNT(*) >= $2
           ORDER BY co_occurrences DESC`, [since, minCount]
        );
        return result.rows.map((r: any) => ({
          toolA: r.tool_a, toolB: r.tool_b, coOccurrences: parseInt(r.co_occurrences),
        }));
      } catch (err) {
        logger.warn('sqlToolCoOccurrences failed', { error: String(err) });
        return [];
      } finally {
        if (client) try { await client.end(); } catch {}
      }
    },
    sqlBenchmarkTrends: async (_: any, { weeks = 12 }: { weeks?: number }, ctx: any) => {
      const uid = ctx?.uid;
      if (!uid) return [];
      const config = await getCachedSqlConfig(uid);
      if (!config || config.status !== 'connected') return [];

      let client;
      try {
        client = await createSqlClient(config);
        const since = new Date(Date.now() - weeks * 7 * 86400000).toISOString();
        const result = await client.query(
          `SELECT endpoint_name, model, DATE_TRUNC('week', created_at)::date as week,
                  AVG(tokens_per_second) as avg_tps, AVG(time_to_first_token) as avg_ttft,
                  COUNT(*) as sample_size
           FROM benchmark_results WHERE created_at >= $1 AND error IS NULL
           GROUP BY endpoint_name, model, DATE_TRUNC('week', created_at)
           ORDER BY week`, [since]
        );
        return result.rows.map((r: any) => ({
          endpointName: r.endpoint_name, model: r.model,
          week: r.week.toISOString().slice(0, 10),
          avgTps: parseFloat(r.avg_tps || 0), avgTtft: parseFloat(r.avg_ttft || 0),
          sampleSize: parseInt(r.sample_size),
        }));
      } catch (err) {
        logger.warn('sqlBenchmarkTrends failed', { error: String(err) });
        return [];
      } finally {
        if (client) try { await client.end(); } catch {}
      }
    },
    sqlChatSearch: async (_: any, { query, limit = 20 }: { query: string; limit?: number }, ctx: any) => {
      const uid = ctx?.uid;
      if (!uid || !query.trim()) return [];
      const config = await getCachedSqlConfig(uid);
      if (!config || config.status !== 'connected') return [];

      let client;
      try {
        client = await createSqlClient(config);
        const pattern = `%${query.trim()}%`;
        const cap = Math.min(limit, 50);
        const result = await client.query(
          `SELECT id, created_at, provider, model, question_preview, answer_preview, latency_ms, total_tokens
           FROM ai_chat_logs
           WHERE full_question ILIKE $1 OR full_answer ILIKE $1
           ORDER BY created_at DESC LIMIT $2`, [pattern, cap]
        );
        return result.rows.map((r: any) => ({
          id: r.id, timestamp: r.created_at.toISOString(),
          provider: r.provider, model: r.model,
          questionPreview: r.question_preview || '', answerPreview: r.answer_preview || '',
          latencyMs: r.latency_ms, totalTokens: r.total_tokens,
        }));
      } catch (err) {
        logger.warn('sqlChatSearch failed', { error: String(err) });
        return [];
      } finally {
        if (client) try { await client.end(); } catch {}
      }
    },
  };
}

export function createSqlMutationResolvers() {
  return {
    saveSqlConnection: async (_: any, { input }: { input: any }, ctx: any) => {
      const uid = ctx?.uid;
      if (!uid) throw new Error('Authentication required');

      const schema = z.object({
        tunnelUrl: z.string().url().max(500),
        dbName: z.string().max(100).optional(),
        username: z.string().max(100).optional(),
        password: z.string().max(200).optional(),
      });
      const parsed = schema.parse(input);

      const db = getFirestore();
      const docRef = db.doc(`users/${uid}/sqlConnection/config`);

      // Save the connection config (merge so partial updates work)
      const configData: Record<string, any> = {
        tunnelUrl: parsed.tunnelUrl,
        updatedAt: new Date().toISOString(),
      };
      if (parsed.dbName !== undefined) configData.dbName = parsed.dbName;
      if (parsed.username !== undefined) configData.username = parsed.username;
      if (parsed.password !== undefined) configData.password = parsed.password;

      await docRef.set(configData, { merge: true });

      // Read back the full config for testing
      const savedDoc = await docRef.get();
      const config = savedDoc.data() as SqlConnectionConfig;

      // Test the connection
      const result = await testSqlConnection(config);
      let status = 'error';

      if (result.ok) {
        // Initialize schema if connection succeeded
        const client = await createSqlClient(config);
        try {
          await initSqlSchema(client);
          status = 'connected';
        } catch {
          status = 'error';
        } finally {
          try { await client.end(); } catch { /* ignore */ }
        }
      }

      const now = new Date().toISOString();
      await docRef.update({
        status,
        lastTestedAt: now,
        updatedAt: now,
      });

      clearSqlConfigCache(uid);

      return {
        tunnelUrl: config.tunnelUrl,
        dbName: config.dbName || 'mycircle',
        status,
        lastTestedAt: now,
        hasCredentials: !!(config.username && config.password),
      };
    },
    testSqlConnection: async (_: any, __: any, ctx: any) => {
      const uid = ctx?.uid;
      if (!uid) throw new Error('Authentication required');

      const db = getFirestore();
      const docRef = db.doc(`users/${uid}/sqlConnection/config`);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new Error('No SQL connection configured. Save a connection first.');
      }

      const config = doc.data() as SqlConnectionConfig;
      const result = await testSqlConnection(config);
      const status = result.ok ? 'connected' : 'error';
      const now = new Date().toISOString();

      await docRef.update({
        status,
        lastTestedAt: now,
        updatedAt: now,
      });

      clearSqlConfigCache(uid);

      return {
        tunnelUrl: config.tunnelUrl,
        dbName: config.dbName || 'mycircle',
        status,
        lastTestedAt: now,
        hasCredentials: !!(config.username && config.password),
      };
    },
    deleteSqlConnection: async (_: any, __: any, ctx: any) => {
      const uid = ctx?.uid;
      if (!uid) throw new Error('Authentication required');

      const db = getFirestore();

      // Delete connection config and backfill state in parallel
      await Promise.all([
        db.doc(`users/${uid}/sqlConnection/config`).delete(),
        db.doc(`users/${uid}/sqlBackfillState/status`).delete(),
      ]);

      clearSqlConfigCache(uid);

      return true;
    },
    startSqlBackfill: async (_: any, __: any, ctx: any) => {
      const uid = ctx?.uid;
      if (!uid) throw new Error('Authentication required');

      const db = getFirestore();

      // Check SQL connection exists
      const connDoc = await db.doc(`users/${uid}/sqlConnection/config`).get();
      if (!connDoc.exists || connDoc.data()?.status !== 'connected') {
        throw new Error('SQL connection not configured or not connected');
      }

      // Check if already running
      const stateDoc = await db.doc(`users/${uid}/sqlBackfillState/status`).get();
      const existingState = stateDoc.exists ? stateDoc.data() : null;
      if (existingState?.status === 'running') {
        return existingState;
      }

      const config = connDoc.data() as SqlConnectionConfig;
      const lastDocId = existingState?.status === 'error' ? existingState.lastDocId : null;
      const totalMigrated = existingState?.status === 'error' ? (existingState.totalMigrated || 0) : 0;
      const totalErrors = existingState?.status === 'error' ? (existingState.totalErrors || 0) : 0;

      // Update state to running
      await db.doc(`users/${uid}/sqlBackfillState/status`).set({
        status: 'running',
        totalMigrated,
        totalErrors,
        lastDocId: lastDocId || null,
        startedAt: new Date().toISOString(),
        completedAt: null,
        error: null,
      });

      // Run backfill in background (fire and forget)
      runBackfill(uid, config, lastDocId, totalMigrated, totalErrors).catch(err => {
        logger.error('Backfill failed', { error: String(err) });
      });

      return {
        status: 'running',
        totalMigrated,
        totalErrors,
        startedAt: new Date().toISOString(),
        completedAt: null,
        error: null,
      };
    },
  };
}
