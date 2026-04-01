import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import type { Request, Response } from 'express';
import crypto from 'crypto';
import { ALLOWED_ORIGINS, verifyAuthToken, uploadToStorage } from './shared.js';

// Per-minute rate limits from GCP Cloud Console
// Module-level state persists across warm invocations — exactly what we want
type TtsSkuGroup = 'wavenet_standard' | 'neural2_polyglot' | 'chirp3';
const DL_TTS_RATE_LIMITS: Record<TtsSkuGroup, number> = {
  wavenet_standard: 1000,
  neural2_polyglot: 1000,
  chirp3:            200, // Chirp3-HD voices: 200 req/min
};
const dlTtsCallTimestamps: Record<TtsSkuGroup, number[]> = {
  wavenet_standard: [],
  neural2_polyglot: [],
  chirp3: [],
};
function getSkuGroupDL(voiceName: string): TtsSkuGroup {
  if (voiceName.includes('-Chirp3-HD-')) return 'chirp3';
  if (voiceName.includes('-Neural2-') || voiceName.includes('-Polyglot-')) return 'neural2_polyglot';
  return 'wavenet_standard';
}
async function throttleDlTtsRate(skuGroup: TtsSkuGroup): Promise<void> {
  const limit = DL_TTS_RATE_LIMITS[skuGroup];
  const windowMs = 60_000;
  const now = Date.now();
  dlTtsCallTimestamps[skuGroup] = dlTtsCallTimestamps[skuGroup].filter(t => now - t < windowMs);
  if (dlTtsCallTimestamps[skuGroup].length >= limit) {
    const waitMs = windowMs - (now - dlTtsCallTimestamps[skuGroup][0]) + 100;
    logger.warn('TTS rate limit reached, waiting', { skuGroup, waitMs });
    await new Promise(r => setTimeout(r, waitMs));
    return throttleDlTtsRate(skuGroup);
  }
  dlTtsCallTimestamps[skuGroup].push(Date.now());
}

// ─── Digital Library ────────────────────────────────────────────────
export const digitalLibrary = onRequest(
  {
    region: 'us-central1',
    memory: '1GiB',
    timeoutSeconds: 300,
    maxInstances: 5,
    cors: ALLOWED_ORIGINS,
  },
  async (req: Request, res: Response) => {
    const uid = await verifyAuthToken(req);
    if (!uid) { res.status(401).json({ error: 'Authentication required' }); return; }

    const route = req.path.replace(/^\/digital-library-api\//, '').replace(/^\//, '');
    const db = getFirestore();
    const bucket = getStorage().bucket();

    // Validate bookId is a safe UUID
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    function validateBookId(id: unknown): string | null {
      if (typeof id !== 'string' || !UUID_RE.test(id)) return null;
      return id;
    }

    // POST /digital-library-api/upload
    // Accepts base64 EPUB, writes to Storage, extracts metadata — single step (same pattern as cloudFiles)
    if (req.method === 'POST' && route === 'upload') {
      const { fileBase64 } = req.body;
      if (!fileBase64) { res.status(400).json({ error: 'fileBase64 required' }); return; }

      const buffer = Buffer.from(fileBase64, 'base64');
      if (buffer.length > 20 * 1024 * 1024) { res.status(400).json({ error: 'File too large (max 20MB)' }); return; }

      const bookId = crypto.randomUUID();
      const storagePath = `books/${bookId}/original.epub`;

      // Write EPUB to Storage
      const { downloadUrl: epubUrl } = await uploadToStorage(bucket, storagePath, buffer, 'application/epub+zip', {
        customMetadata: { uploadedBy: uid },
      });

      try {
        const fileSize = buffer.length;

        // Extract metadata using epub2
        const epub2Module = await import('epub2');
        const EPub = epub2Module.EPub;
        const tmpPath = `/tmp/epub-${crypto.randomUUID()}.epub`;
        const fs = await import('fs');
        fs.writeFileSync(tmpPath, buffer);

        const epub = await (EPub as unknown as { createAsync(path: string): Promise<any> }).createAsync(tmpPath);

        const title = epub.metadata?.title || 'Untitled';
        const author = epub.metadata?.creator || 'Unknown';
        const description = epub.metadata?.description || '';
        const language = epub.metadata?.language || 'en';

        // Extract cover image
        let coverUrl = '';
        let coverStoragePath = '';
        try {
          const coverId = epub.metadata?.cover;
          if (coverId && epub.manifest?.[coverId]) {
            const coverItem = epub.manifest[coverId];
            const [coverData] = await new Promise<[Buffer, string]>((resolve, reject) => {
              epub.getImage(coverId, (err: Error | null, data: Buffer, mimeType: string) => {
                if (err) reject(err);
                else resolve([data, mimeType]);
              });
            });
            coverStoragePath = `books/${bookId}/cover.jpg`;
            ({ downloadUrl: coverUrl } = await uploadToStorage(bucket, coverStoragePath, coverData, coverItem.mediaType || 'image/jpeg'));
          }
        } catch (coverErr) {
          logger.warn('Failed to extract cover image', { bookId, error: String(coverErr) });
        }

        // Get chapters from flow/toc
        const chapters: Array<{ index: number; title: string; href: string; characterCount: number }> = [];
        const flow = epub.flow || [];
        let totalCharacters = 0;

        for (let i = 0; i < flow.length; i++) {
          const ch = flow[i];
          let text = '';
          try {
            text = await new Promise<string>((resolve, reject) => {
              epub.getChapter(ch.id, (err: Error | null, data: string) => {
                if (err) reject(err);
                else resolve(data || '');
              });
            });
          } catch { /* skip */ }
          // Strip HTML tags iteratively to handle nested/malformed markup
          let stripped = text;
          let prev = '';
          while (prev !== stripped) { prev = stripped; stripped = stripped.replace(/<[^>]+>/g, ''); }
          const plainText = stripped.trim();
          const charCount = plainText.length;
          totalCharacters += charCount;

          const tocItem = epub.toc?.find((t: { href: string }) => ch.href && t.href?.includes(ch.href.split('#')[0]));
          chapters.push({
            index: i,
            title: tocItem?.title || `Chapter ${i + 1}`,
            href: ch.href || '',
            characterCount: charCount,
          });
        }

        // Get uploader display name
        let displayName = 'Unknown';
        try {
          const userRecord = await getAuth().getUser(uid);
          displayName = userRecord.displayName || userRecord.email || 'Unknown';
        } catch { /* ignore */ }

        // Save book doc
        await db.collection('books').doc(bookId).set({
          title, author, description, language,
          coverUrl, epubUrl,
          storagePath, coverStoragePath,
          fileSize, chapterCount: chapters.length, totalCharacters,
          uploadedBy: { uid, displayName },
          uploadedAt: FieldValue.serverTimestamp(),
          audioStatus: 'none',
          audioProgress: 0,
        });

        // Save chapter docs
        const batch = db.batch();
        for (const ch of chapters) {
          const chRef = db.collection('books').doc(bookId).collection('chapters').doc(`ch-${String(ch.index).padStart(4, '0')}`);
          batch.set(chRef, ch);
        }
        await batch.commit();

        // Cleanup temp
        try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }

        logger.info('Book registered', { bookId, title, chapters: chapters.length });
        res.json({ ok: true, bookId, title, chapterCount: chapters.length });
      } catch (err) {
        logger.error('Failed to register book', { bookId, error: String(err) });
        res.status(500).json({ error: 'Failed to process EPUB' });
      }
      return;
    }

    // GET /digital-library-api/list
    if (req.method === 'GET' && route === 'list') {
      const snapshot = await db.collection('books').orderBy('uploadedAt', 'desc').get();
      const books = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((b: any) => !b.isDeleted);
      res.json({ books });
      return;
    }

    // GET /digital-library-api/chapters/:bookId
    if (req.method === 'GET' && route.startsWith('chapters/')) {
      const bookId = route.replace('chapters/', '');
      if (!bookId) { res.status(400).json({ error: 'bookId required' }); return; }
      const snapshot = await db.collection('books').doc(bookId).collection('chapters').orderBy('index').get();
      const chapters = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json({ chapters });
      return;
    }

    // POST /digital-library-api/delete (soft-delete — moves to recycle bin)
    if (req.method === 'POST' && route === 'delete') {
      const bookId = validateBookId(req.body.bookId);
      if (!bookId) { res.status(400).json({ error: 'Invalid or missing bookId' }); return; }

      const bookRef = db.collection('books').doc(bookId);
      const bookDoc = await bookRef.get();
      if (!bookDoc.exists) { res.status(404).json({ error: 'Book not found' }); return; }

      // Soft-delete: mark as deleted, keep storage files for 30-day recovery
      await bookRef.update({ isDeleted: true, deletedAt: FieldValue.serverTimestamp() });

      logger.info('Book soft-deleted', { bookId });
      res.json({ ok: true });
      return;
    }

    // POST /digital-library-api/restore (restore from recycle bin)
    if (req.method === 'POST' && route === 'restore') {
      const bookId = validateBookId(req.body.bookId);
      if (!bookId) { res.status(400).json({ error: 'Invalid or missing bookId' }); return; }

      const bookRef = db.collection('books').doc(bookId);
      const bookDoc = await bookRef.get();
      if (!bookDoc.exists) { res.status(404).json({ error: 'Book not found' }); return; }

      await bookRef.update({ isDeleted: false, deletedAt: null });

      logger.info('Book restored', { bookId });
      res.json({ ok: true });
      return;
    }

    // POST /digital-library-api/permanent-delete (hard-delete with storage cleanup)
    if (req.method === 'POST' && route === 'permanent-delete') {
      const bookId = validateBookId(req.body.bookId);
      if (!bookId) { res.status(400).json({ error: 'Invalid or missing bookId' }); return; }

      const bookRef = db.collection('books').doc(bookId);
      const bookDoc = await bookRef.get();
      if (!bookDoc.exists) { res.status(404).json({ error: 'Book not found' }); return; }

      // Delete chapters subcollection
      const chaptersSnap = await bookRef.collection('chapters').get();
      const batch = db.batch();
      for (const chapDoc of chaptersSnap.docs) batch.delete(chapDoc.ref);
      batch.delete(bookRef);
      await batch.commit();

      // Delete storage files (ignore errors)
      try { await bucket.file(`books/${bookId}/original.epub`).delete(); } catch { /* ignore */ }
      try { await bucket.file(`books/${bookId}/cover.jpg`).delete(); } catch { /* ignore */ }
      // Delete audio files if any
      try {
        const [audioFiles] = await bucket.getFiles({ prefix: `books/${bookId}/audio/` });
        for (const f of audioFiles) { try { await f.delete(); } catch { /* ignore */ } }
      } catch { /* ignore */ }

      logger.info('Book permanently deleted', { bookId });
      res.json({ ok: true });
      return;
    }

    // POST /digital-library-api/delete-chapter-audio (soft-delete: clears audioUrl, keeps Storage file)
    if (req.method === 'POST' && route === 'delete-chapter-audio') {
      const bookId = validateBookId(req.body.bookId);
      if (!bookId) { res.status(400).json({ error: 'Invalid or missing bookId' }); return; }
      const chapterIndex = typeof req.body.chapterIndex === 'number' ? req.body.chapterIndex : null;
      if (chapterIndex === null) { res.status(400).json({ error: 'chapterIndex required' }); return; }

      const bookRef = db.collection('books').doc(bookId);
      const chaptersSnap = await bookRef.collection('chapters').where('index', '==', chapterIndex).get();
      if (chaptersSnap.empty) { res.status(404).json({ error: 'Chapter not found' }); return; }

      const chapterDoc = chaptersSnap.docs[0];
      await chapterDoc.ref.update({
        audioUrl: FieldValue.delete(),
        audioStoragePath: FieldValue.delete(),
        audioDuration: FieldValue.delete(),
      });

      // Update book-level progress
      const allChaps = await bookRef.collection('chapters').get();
      const convertedCount = allChaps.docs.filter(d => d.data().audioUrl && d.id !== chapterDoc.id).length;
      const newProgress = Math.round((convertedCount / allChaps.size) * 100);
      const newStatus = convertedCount === 0 ? 'none' : convertedCount === allChaps.size ? 'complete' : 'partial';
      await bookRef.update({ audioStatus: newStatus, audioProgress: newProgress });

      logger.info('Chapter audio deleted (soft)', { bookId, chapterIndex });
      res.json({ ok: true });
      return;
    }

    // GET /digital-library-api/progress/:bookId
    if (req.method === 'GET' && route.startsWith('progress/')) {
      const bookId = validateBookId(route.replace('progress/', ''));
      if (!bookId) { res.status(400).json({ error: 'Invalid bookId' }); return; }
      const bookDoc = await db.collection('books').doc(bookId).get();
      if (!bookDoc.exists) { res.status(404).json({ error: 'Book not found' }); return; }
      const data = bookDoc.data()!;
      let audioStatus = data.audioStatus || 'none';
      const audioError = data.audioError || null;

      // Detect stale conversions: if processing for >10 min, auto-reset to error
      if (audioStatus === 'processing' && data.updatedAt) {
        const updatedMs = data.updatedAt.toMillis ? data.updatedAt.toMillis() : Date.now();
        if (Date.now() - updatedMs > 10 * 60 * 1000) {
          audioStatus = 'error';
          await bookDoc.ref.update({
            audioStatus: 'error',
            audioError: 'Conversion timed out. You can retry — already-converted chapters will be skipped.',
          });
        }
      }

      // Detect stale paused: if paused for >30 min, client likely abandoned
      if (audioStatus === 'paused' && data.updatedAt) {
        const updatedMs = data.updatedAt.toMillis ? data.updatedAt.toMillis() : Date.now();
        if (Date.now() - updatedMs > 30 * 60 * 1000) {
          audioStatus = 'error';
          await bookDoc.ref.update({
            audioStatus: 'error',
            audioError: 'Conversion paused too long. Retry to continue.',
          });
        }
      }

      res.json({
        audioStatus,
        audioProgress: data.audioProgress || 0,
        audioError: audioStatus === 'error' && data.audioError ? data.audioError : audioError,
        canContinue: audioStatus === 'paused',
      });
      return;
    }

    // POST /digital-library-api/reset-conversion/:bookId  (any authenticated user)
    // Also accepts legacy admin/reset-conversion/:bookId path for backwards compat
    const resetRoute = route.startsWith('reset-conversion/') ? route
      : route.startsWith('admin/reset-conversion/') ? route.replace('admin/', '') : null;
    if (req.method === 'POST' && resetRoute) {
      const bookId = validateBookId(resetRoute.replace('reset-conversion/', ''));
      if (!bookId) { res.status(400).json({ error: 'Invalid bookId' }); return; }

      const bookDoc = await db.collection('books').doc(bookId).get();
      if (!bookDoc.exists) { res.status(404).json({ error: 'Book not found' }); return; }

      await bookDoc.ref.update({
        audioStatus: 'none',
        audioProgress: 0,
        audioError: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      res.json({ ok: true, message: 'Conversion reset successfully' });
      return;
    }

    // ── TTS Monthly Quota ─────────────────────────────────────────────
    // Tracked per billing SKU group — each group has its own independent free-tier meter.
    // Limits are capped at 90% of the free tier. Once reached, all TTS is hard-blocked
    // for that SKU group until the counter resets at the start of the next calendar month.
    // SKU 9D01: WaveNet + Standard share 4M/mo → hard limit 3.6M
    // SKU FEBD: Neural2 + Polyglot share 1M/mo → hard limit 900K
    // SKU F977: Chirp3 HD 1M/mo              → hard limit 900K
    type SkuGroup = 'wavenet_standard' | 'neural2_polyglot' | 'chirp3';
    const TTS_LIMITS: Record<SkuGroup, number> = {
      wavenet_standard: 3_600_000, // 90% of 4M free
      neural2_polyglot:   900_000, // 90% of 1M free
      chirp3:             900_000, // 90% of 1M free
    };

    function getSkuGroup(voiceName: string): SkuGroup {
      if (voiceName.includes('-Chirp3-HD-')) return 'chirp3';
      if (voiceName.includes('-Neural2-') || voiceName.includes('-Polyglot-')) return 'neural2_polyglot';
      return 'wavenet_standard';
    }

    async function getTtsUsage(): Promise<{ ref: FirebaseFirestore.DocumentReference; wavenet_standard: number; neural2_polyglot: number; chirp3: number }> {
      const month = new Date().toISOString().slice(0, 7);
      const ref = db.collection('ttsUsage').doc(month);
      const snap = await ref.get();
      const data = snap.data() || {};
      return {
        ref,
        wavenet_standard: data.wavenet_standard ?? 0,
        neural2_polyglot: data.neural2_polyglot ?? 0,
        chirp3: data.chirp3 ?? 0,
      };
    }

    async function incrementTtsUsage(ref: FirebaseFirestore.DocumentReference, skuGroup: SkuGroup, chars: number) {
      await ref.set({ [skuGroup]: FieldValue.increment(chars), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }

    // POST /digital-library-api/preview-voice  — synthesizes a short TTS sample
    if (req.method === 'POST' && route === 'preview-voice') {
      const { voiceName } = req.body as { voiceName?: string };
      if (!voiceName || typeof voiceName !== 'string') {
        res.status(400).json({ error: 'voiceName required' });
        return;
      }
      const langCode = voiceName.split('-').slice(0, 2).join('-');
      const sampleText = langCode.startsWith('cmn') ? '你好，这是语音预览。'
        : langCode.startsWith('es') ? 'Hola, esta es una vista previa de la voz.'
        : 'Hello, this is a voice preview sample.';
      // Check quota before synthesizing (preview counts against its SKU group)
      const previewQuota = await getTtsUsage();
      const previewSkuGroup = getSkuGroup(voiceName);
      if (previewQuota[previewSkuGroup] + sampleText.length > TTS_LIMITS[previewSkuGroup]) {
        res.status(429).json({ error: 'Monthly TTS quota reached' });
        return;
      }
      try {
        const { TextToSpeechClient } = await import('@google-cloud/text-to-speech');
        const ttsClient = new TextToSpeechClient();
        await throttleDlTtsRate(getSkuGroupDL(voiceName));
        const [ttsResponse] = await ttsClient.synthesizeSpeech({
          input: { text: sampleText },
          voice: { languageCode: langCode, name: voiceName },
          audioConfig: { audioEncoding: 'MP3' },
        });
        await incrementTtsUsage(previewQuota.ref, previewSkuGroup, sampleText.length);
        const audio = Buffer.from(ttsResponse.audioContent as Uint8Array).toString('base64');
        res.json({ audio });
      } catch (err) {
        logger.error('Preview voice TTS failed', err);
        res.status(500).json({ error: 'TTS preview failed' });
      }
      return;
    }

    // GET /digital-library-api/tts-quota
    if (req.method === 'GET' && route === 'tts-quota') {
      const usage = await getTtsUsage();
      res.json({
        wavenetStandard: { used: usage.wavenet_standard, limit: TTS_LIMITS.wavenet_standard, remaining: Math.max(0, TTS_LIMITS.wavenet_standard - usage.wavenet_standard) },
        neural2Polyglot: { used: usage.neural2_polyglot, limit: TTS_LIMITS.neural2_polyglot, remaining: Math.max(0, TTS_LIMITS.neural2_polyglot - usage.neural2_polyglot) },
        chirp3:          { used: usage.chirp3,           limit: TTS_LIMITS.chirp3,           remaining: Math.max(0, TTS_LIMITS.chirp3           - usage.chirp3) },
      });
      return;
    }

    // POST /digital-library-api/convert-to-audio
    // Supports optional `chapterIndex` param for per-chapter conversion
    if (req.method === 'POST' && route === 'convert-to-audio') {
      const bookId = validateBookId(req.body.bookId);
      if (!bookId) { res.status(400).json({ error: 'Invalid or missing bookId' }); return; }
      const singleChapterIndex = typeof req.body.chapterIndex === 'number' ? req.body.chapterIndex : null;

      const bookRef = db.collection('books').doc(bookId);
      const bookDoc = await bookRef.get();
      if (!bookDoc.exists) { res.status(404).json({ error: 'Book not found' }); return; }

      const bookData = bookDoc.data()!;

      // For whole-book conversion, check if already processing
      if (singleChapterIndex === null && bookData.audioStatus === 'processing') {
        const updatedMs = bookData.updatedAt?.toMillis ? bookData.updatedAt.toMillis() : Date.now();
        if (Date.now() - updatedMs < 10 * 60 * 1000) {
          res.status(409).json({ error: 'Conversion already in progress' });
          return;
        }
      }

      // Global concurrency limit: max 2 concurrent conversions
      if (singleChapterIndex === null) {
        const processingSnap = await db.collection('books').where('audioStatus', 'in', ['processing', 'paused']).get();
        const activeCount = processingSnap.docs.filter(d => d.id !== bookId).length;
        if (activeCount >= 2) {
          res.status(429).json({ error: 'Too many conversions in progress. Try again later.' });
          return;
        }
      }

      // Validate optional voiceName
      const voiceNameParam = req.body.voiceName as string | undefined;
      const VOICE_REGEX = /^(en-US|es-US|cmn-CN)-(Wavenet|Standard|Neural2)-[A-J]$|^(en-US|es-US|cmn-CN)-Chirp3-HD-[A-Za-z]+$|^en-US-Polyglot-\d+$/;
      if (voiceNameParam && !VOICE_REGEX.test(voiceNameParam)) {
        res.status(400).json({ error: 'Invalid voiceName format' });
        return;
      }

      // Check monthly TTS quota for this voice's SKU group
      const quota = await getTtsUsage();
      const skuGroup = getSkuGroup(voiceNameParam || 'en-US-Wavenet-D');
      const currentUsage = quota[skuGroup];
      const skuLimit = TTS_LIMITS[skuGroup];
      const charsToCheck = singleChapterIndex !== null
        ? ((await bookRef.collection('chapters').where('index', '==', singleChapterIndex).get()).docs[0]?.data()?.characterCount || 5000)
        : (bookData.totalCharacters || 0);
      if (currentUsage + charsToCheck > skuLimit) {
        res.status(429).json({
          error: 'Monthly TTS quota reached',
          used: currentUsage,
          limit: skuLimit,
          remaining: Math.max(0, skuLimit - currentUsage),
          bookChars: charsToCheck,
        });
        return;
      }

      // Mark as processing
      if (singleChapterIndex === null) {
        await bookRef.update({ audioStatus: 'processing', audioProgress: 0, audioError: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp() });
      } else {
        await bookRef.update({ updatedAt: FieldValue.serverTimestamp() });
      }

      res.json({ ok: true, message: singleChapterIndex !== null ? 'Chapter conversion started' : 'Conversion started' });

      // Process in background
      try {
        const startTime = Date.now();
        const TIME_BUDGET_MS = 4 * 60 * 1000;

        const ttsClient = new (await import('@google-cloud/text-to-speech')).TextToSpeechClient();

        const chaptersSnap = await bookRef.collection('chapters').orderBy('index').get();
        const totalChapters = chaptersSnap.size;
        let completedChapters = 0;
        let totalCharsUsed = 0;

        // Download EPUB for text extraction
        const epubFile = bucket.file(bookData.storagePath);
        const [epubBuffer] = await epubFile.download();
        const fs = await import('fs');
        const tmpPath = `/tmp/tts-${crypto.randomUUID()}.epub`;
        fs.writeFileSync(tmpPath, epubBuffer);

        const epub2Module = await import('epub2');
        const EPub = epub2Module.EPub;
        const epub = await (EPub as unknown as { createAsync(path: string): Promise<any> }).createAsync(tmpPath);

        const language = bookData.language || 'en';
        const defaultVoice = language.startsWith('zh') ? 'cmn-CN-Wavenet-A'
          : language.startsWith('es') ? 'es-US-Wavenet-A'
          : 'en-US-Wavenet-D';
        const voiceName = voiceNameParam || defaultVoice;
        const languageCode = voiceName.split('-').slice(0, 2).join('-');

        // Filter to single chapter if requested
        const docsToProcess = singleChapterIndex !== null
          ? chaptersSnap.docs.filter(d => d.data().index === singleChapterIndex)
          : chaptersSnap.docs;

        for (const chapterDoc of docsToProcess) {
          const chData = chapterDoc.data();

          // Skip chapters that already have audio
          if (chData.audioUrl) {
            completedChapters++;
            if (singleChapterIndex === null) {
              const progress = Math.round((completedChapters / totalChapters) * 100);
              await bookRef.update({ audioProgress: progress, updatedAt: FieldValue.serverTimestamp() });
            }
            continue;
          }

          // Check time budget (only for whole-book)
          if (singleChapterIndex === null && Date.now() - startTime > TIME_BUDGET_MS) {
            const progress = Math.round((completedChapters / totalChapters) * 100);
            await bookRef.update({ audioStatus: 'paused', audioProgress: progress, updatedAt: FieldValue.serverTimestamp() });
            if (totalCharsUsed > 0) await incrementTtsUsage(quota.ref, skuGroup, totalCharsUsed);
            try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
            logger.info('Audio conversion paused (time budget)', { bookId, completedChapters, totalChapters });
            return;
          }

          // Extract chapter text
          let chapterText = '';
          try {
            const flow = epub.flow || [];
            const flowItem = flow[chData.index];
            if (flowItem) {
              const rawHtml = await new Promise<string>((resolve, reject) => {
                epub.getChapter(flowItem.id, (err: Error | null, data: string) => {
                  if (err) reject(err);
                  else resolve(data || '');
                });
              });
              let stripped = rawHtml;
              let prev = '';
              while (prev !== stripped) { prev = stripped; stripped = stripped.replace(/<[^>]+>/g, ''); }
              chapterText = stripped.replace(/\s+/g, ' ').trim();
            }
          } catch {
            logger.warn('Failed to extract chapter text for TTS', { bookId, chapter: chData.index });
          }

          if (!chapterText || chapterText.length < 10) {
            completedChapters++;
            continue;
          }

          const MAX_BYTES = 4500;
          const chunks: string[] = [];
          let remaining = chapterText;
          while (remaining.length > 0) {
            if (remaining.length <= MAX_BYTES) {
              chunks.push(remaining);
              break;
            }
            let splitAt = remaining.lastIndexOf('. ', MAX_BYTES);
            if (splitAt === -1) splitAt = remaining.lastIndexOf(' ', MAX_BYTES);
            if (splitAt === -1) splitAt = MAX_BYTES;
            chunks.push(remaining.slice(0, splitAt + 1));
            remaining = remaining.slice(splitAt + 1).trimStart();
          }

          const audioBuffers: Buffer[] = [];
          for (const chunk of chunks) {
            await throttleDlTtsRate(getSkuGroupDL(voiceName));
            const [ttsResponse] = await ttsClient.synthesizeSpeech({
              input: { text: chunk },
              voice: { languageCode, name: voiceName },
              audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0 },
            });
            if (ttsResponse.audioContent) {
              audioBuffers.push(Buffer.from(ttsResponse.audioContent as Uint8Array));
            }
          }

          totalCharsUsed += chapterText.length;

          if (audioBuffers.length > 0) {
            const combinedAudio = Buffer.concat(audioBuffers);
            const audioPath = `books/${bookId}/audio/chapter-${String(chData.index).padStart(4, '0')}.mp3`;
            const { downloadUrl: audioUrl } = await uploadToStorage(bucket, audioPath, combinedAudio, 'audio/mpeg');

            const wordCount = chapterText.split(/\s+/).length;
            const estimatedDuration = Math.round((wordCount / 150) * 60);

            await chapterDoc.ref.update({
              audioUrl,
              audioStoragePath: audioPath,
              audioDuration: estimatedDuration,
            });
          }

          completedChapters++;
          if (singleChapterIndex === null) {
            const progress = Math.round((completedChapters / totalChapters) * 100);
            await bookRef.update({ audioProgress: progress, updatedAt: FieldValue.serverTimestamp() });
          }
        }

        await incrementTtsUsage(quota.ref, skuGroup, totalCharsUsed);

        // For whole-book, mark complete. For single chapter, update progress.
        if (singleChapterIndex === null) {
          await bookRef.update({ audioStatus: 'complete', audioProgress: 100 });
        } else {
          // Recount converted chapters for book-level progress
          const allChaps = await bookRef.collection('chapters').get();
          const convertedCount = allChaps.docs.filter(d => d.data().audioUrl).length;
          const newProgress = Math.round((convertedCount / allChaps.size) * 100);
          const newStatus = convertedCount === allChaps.size ? 'complete' : 'partial';
          await bookRef.update({ audioStatus: newStatus, audioProgress: newProgress });
        }

        try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
        logger.info('Audio conversion complete', { bookId, chapterIndex: singleChapterIndex, charsUsed: totalCharsUsed });
      } catch (err) {
        logger.error('Audio conversion failed', { bookId, chapterIndex: singleChapterIndex, error: String(err) });
        if (singleChapterIndex === null) {
          await bookRef.update({ audioStatus: 'error', audioError: String(err).slice(0, 200) }).catch(() => {});
        }
      }
      return;
    }

    res.status(404).json({ error: 'Not found' });
  }
);
