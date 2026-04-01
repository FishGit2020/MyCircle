import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const TIME_BUDGET_MS = 8 * 60 * 1000; // 8 minutes (of 9 min max)

// TTS billing SKUs — each has its own independent free-tier meter.
// Limits are capped at 90% of the free tier as a hard safety buffer.
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

// Per-minute rate limits from GCP Cloud Console
// Module-level state persists across warm invocations — exactly what we want
const TTS_RATE_LIMITS: Record<SkuGroup, number> = {
  wavenet_standard: 900, // 90% of 1000 req/min
  neural2_polyglot: 900, // 90% of 1000 req/min
  chirp3:           180, // 90% of 200 req/min (Chirp3-HD)
};
const ttsCallTimestamps: Record<SkuGroup, number[]> = {
  wavenet_standard: [],
  neural2_polyglot: [],
  chirp3: [],
};
async function throttleTtsRate(skuGroup: SkuGroup): Promise<void> {
  const limit = TTS_RATE_LIMITS[skuGroup];
  const windowMs = 60_000;
  const now = Date.now();
  ttsCallTimestamps[skuGroup] = ttsCallTimestamps[skuGroup].filter(t => now - t < windowMs);
  if (ttsCallTimestamps[skuGroup].length >= limit) {
    const waitMs = windowMs - (now - ttsCallTimestamps[skuGroup][0]) + 100;
    logger.warn('TTS rate limit reached, waiting', { skuGroup, waitMs });
    await new Promise(r => setTimeout(r, waitMs));
    return throttleTtsRate(skuGroup);
  }
  ttsCallTimestamps[skuGroup].push(Date.now());
}

async function getTtsUsage() {
  const db = getFirestore();
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

export const onBatchConversionCreated = onDocumentCreated(
  {
    document: 'users/{uid}/conversionBatchJobs/{jobId}',
    memory: '1GiB',
    timeoutSeconds: 540,
  },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    // Only process new jobs (status === 'pending')
    if (data.status !== 'pending') return;

    const uid = event.params.uid;
    const jobId = event.params.jobId;
    const db = getFirestore();
    const jobRef = db.doc(`users/${uid}/conversionBatchJobs/${jobId}`);

    const { bookId, voiceName } = data;
    const chapterIndices: number[] = data.chapterIndices || [];
    const completedChapters: number[] = data.completedChapters || [];

    try {
      await jobRef.update({ status: 'processing' });

      // Get book data
      const bookRef = db.collection('books').doc(bookId);
      const bookDoc = await bookRef.get();
      if (!bookDoc.exists) {
        await jobRef.update({ status: 'error', error: 'Book not found' });
        return;
      }
      const bookData = bookDoc.data()!;

      // Download EPUB once
      const bucket = getStorage().bucket();
      const epubFile = bucket.file(bookData.storagePath);
      const [epubBuffer] = await epubFile.download();
      const fs = await import('fs');
      const crypto = await import('crypto');
      const tmpPath = `/tmp/batch-${crypto.randomUUID()}.epub`;
      fs.writeFileSync(tmpPath, epubBuffer);

      const epub2Module = await import('epub2');
      const EPub = epub2Module.EPub;
      const epub = await (EPub as unknown as { createAsync(p: string): Promise<any> }).createAsync(tmpPath); // eslint-disable-line @typescript-eslint/no-explicit-any

      const languageCode = voiceName.split('-').slice(0, 2).join('-');
      const ttsClient = new (await import('@google-cloud/text-to-speech')).TextToSpeechClient();

      const startTime = Date.now();
      let totalCharsUsed = 0;

      // Get all chapter docs for this book
      const chaptersSnap = await bookRef.collection('chapters').orderBy('index').get();
      const chapterDocs = new Map(chaptersSnap.docs.map(d => [d.data().index as number, d]));

      // Process chapters sequentially
      const remaining = chapterIndices.filter(idx => !completedChapters.includes(idx));

      for (const chapterIndex of remaining) {
        // Cancellation check — stop if user requested cancel
        const jobSnap = await jobRef.get();
        if (jobSnap.data()?.cancelRequested) {
          logger.info('Batch conversion cancelled by user', { uid, jobId, bookId });
          try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
          return;
        }

        // Time budget check — pause and re-trigger if running low
        if (Date.now() - startTime > TIME_BUDGET_MS) {
          // Save progress and create a resume job
          await jobRef.update({
            status: 'paused',
            completedChapters,
            currentChapter: null,
          });

          // Increment TTS usage for work done so far
          if (totalCharsUsed > 0) {
            const quota = await getTtsUsage();
            await quota.ref.set(
              { [getSkuGroup(voiceName)]: FieldValue.increment(totalCharsUsed), updatedAt: FieldValue.serverTimestamp() },
              { merge: true }
            );
          }

          // Create a resume job (new doc triggers the worker again)
          const resumeRef = db.collection(`users/${uid}/conversionBatchJobs`).doc();
          await resumeRef.set({
            bookId,
            chapterIndices,
            voiceName,
            uid,
            status: 'pending',
            currentChapter: null,
            completedChapters,
            error: null,
            createdAt: FieldValue.serverTimestamp(),
          });

          try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
          logger.info('Batch conversion paused, resume job created', { uid, jobId, completed: completedChapters.length, total: chapterIndices.length });
          return;
        }

        // Check TTS quota
        const quota = await getTtsUsage();
        const chapterDoc = chapterDocs.get(chapterIndex);
        if (!chapterDoc) continue;
        const chData = chapterDoc.data();

        // Skip if already has audio
        if (chData.audioUrl) {
          completedChapters.push(chapterIndex);
          await jobRef.update({ completedChapters, currentChapter: chapterIndex });
          continue;
        }

        const charsNeeded = chData.characterCount || 5000;
        const skuGroup = getSkuGroup(voiceName);
        if (quota[skuGroup] + totalCharsUsed + charsNeeded > TTS_LIMITS[skuGroup]) {
          await jobRef.update({ status: 'error', error: 'Monthly TTS quota reached', completedChapters });
          try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
          return;
        }

        // Update current chapter
        await jobRef.update({ currentChapter: chapterIndex });

        // Extract chapter text
        let chapterText = '';
        try {
          const flow = epub.flow || [];
          const flowItem = flow[chData.index];
          if (flowItem) {
            const rawHtml = await new Promise<string>((resolve, reject) => {
              epub.getChapter(flowItem.id, (err: Error | null, text: string) => {
                if (err) reject(err); else resolve(text);
              });
            });
            chapterText = rawHtml.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
          }
        } catch { /* ignore extraction failure */ }

        if (!chapterText) {
          completedChapters.push(chapterIndex); // Skip empty chapters
          await jobRef.update({ completedChapters });
          continue;
        }

        // Split text into chunks (TTS API limit ~4500 bytes)
        const MAX_BYTES = 4500;
        const chunks: string[] = [];
        let current = '';
        for (const sentence of chapterText.split(/(?<=[.!?])\s+/)) {
          if (Buffer.byteLength(current + ' ' + sentence, 'utf-8') > MAX_BYTES) {
            if (current) chunks.push(current.trim());
            current = sentence;
          } else {
            current += ' ' + sentence;
          }
        }
        if (current.trim()) chunks.push(current.trim());

        // Convert chunks to audio
        const audioBuffers: Buffer[] = [];
        for (const chunk of chunks) {
          await throttleTtsRate(skuGroup);
          const [response] = await ttsClient.synthesizeSpeech({
            input: { text: chunk },
            voice: { languageCode, name: voiceName },
            audioConfig: { audioEncoding: 'MP3' },
          });
          if (response.audioContent) {
            audioBuffers.push(Buffer.from(response.audioContent as Uint8Array));
          }
        }

        // Upload combined audio
        const combined = Buffer.concat(audioBuffers);
        const audioPath = `books/${bookId}/audio/chapter-${chapterIndex}.mp3`;
        const audioFile = bucket.file(audioPath);
        await audioFile.save(combined, { contentType: 'audio/mpeg', metadata: { cacheControl: 'public, max-age=31536000' } });
        await audioFile.makePublic();
        const audioUrl = `https://storage.googleapis.com/${bucket.name}/${audioPath}`;

        // Update chapter doc
        await chapterDoc.ref.update({ audioUrl });
        totalCharsUsed += chapterText.length;
        completedChapters.push(chapterIndex);

        // Update book progress
        const allChaps = await bookRef.collection('chapters').get();
        const convertedCount = allChaps.docs.filter(d => d.data().audioUrl).length;
        const progress = Math.round((convertedCount / allChaps.size) * 100);
        await bookRef.update({
          audioProgress: progress,
          audioStatus: convertedCount === allChaps.size ? 'complete' : 'processing',
          updatedAt: FieldValue.serverTimestamp(),
        });

        await jobRef.update({ completedChapters });
        logger.info('Chapter converted', { uid, jobId, chapterIndex, progress });
      }

      // All chapters done
      if (totalCharsUsed > 0) {
        const quota = await getTtsUsage();
        await quota.ref.set(
          { [getSkuGroup(voiceName)]: FieldValue.increment(totalCharsUsed), updatedAt: FieldValue.serverTimestamp() },
          { merge: true }
        );
      }

      await jobRef.update({ status: 'complete', currentChapter: null, completedChapters });
      try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
      logger.info('Batch conversion complete', { uid, jobId, bookId, chapters: completedChapters.length });
    } catch (err: any) {
      logger.error('Batch conversion failed', { uid, jobId, error: err.message });
      await jobRef.update({ status: 'error', error: err.message || 'Conversion failed', completedChapters });
    }
  }
);
