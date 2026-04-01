import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

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

export const onConversionJobCreated = onDocumentCreated(
  {
    document: 'users/{uid}/conversionJobs/{jobId}',
    memory: '512MiB',
    timeoutSeconds: 540,
  },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const uid = event.params.uid;
    const jobId = event.params.jobId;
    const db = getFirestore();
    const jobRef = db.doc(`users/${uid}/conversionJobs/${jobId}`);

    const { bookId, chapterIndex, voiceName } = data;

    try {
      // Mark as processing
      await jobRef.update({ status: 'processing' });

      // Check TTS quota
      const quota = await getTtsUsage();
      const bookRef = db.collection('books').doc(bookId);
      const bookDoc = await bookRef.get();
      if (!bookDoc.exists) {
        await jobRef.update({ status: 'error', error: 'Book not found' });
        return;
      }

      const bookData = bookDoc.data()!;

      // Get chapter data
      const chaptersSnap = await bookRef.collection('chapters').where('index', '==', chapterIndex).get();
      if (chaptersSnap.empty) {
        await jobRef.update({ status: 'error', error: 'Chapter not found' });
        return;
      }

      const chapterDoc = chaptersSnap.docs[0];
      const chData = chapterDoc.data();

      // Skip if already has audio
      if (chData.audioUrl) {
        await jobRef.update({ status: 'complete' });
        return;
      }

      const charsNeeded = chData.characterCount || 5000;
      const skuGroup = getSkuGroup(voiceName);
      if (quota[skuGroup] + charsNeeded > TTS_LIMITS[skuGroup]) {
        await jobRef.update({ status: 'error', error: 'Monthly TTS quota reached' });
        return;
      }

      // Extract chapter text from EPUB
      const bucket = getStorage().bucket();
      const epubFile = bucket.file(bookData.storagePath);
      const [epubBuffer] = await epubFile.download();
      const fs = await import('fs');
      const crypto = await import('crypto');
      const tmpPath = `/tmp/tts-${crypto.randomUUID()}.epub`;
      fs.writeFileSync(tmpPath, epubBuffer);

      const epub2Module = await import('epub2');
      const EPub = epub2Module.EPub;
      const epub = await (EPub as unknown as { createAsync(path: string): Promise<any> }).createAsync(tmpPath); // eslint-disable-line @typescript-eslint/no-explicit-any

      let chapterText = '';
      const flow = epub.flow || [];
      const flowItem = flow[chData.index];
      if (flowItem) {
        const rawHtml = await new Promise<string>((resolve, reject) => {
          epub.getChapter(flowItem.id, (err: Error | null, text: string) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            if (err) reject(err); else resolve(text);
          });
        });
        chapterText = rawHtml.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
      }

      try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }

      if (!chapterText) {
        await jobRef.update({ status: 'error', error: 'No text found in chapter' });
        return;
      }

      // Split text into chunks (5000 byte TTS API limit)
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

      // Convert each chunk to audio
      const languageCode = voiceName.split('-').slice(0, 2).join('-');
      const ttsClient = new (await import('@google-cloud/text-to-speech')).TextToSpeechClient();
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

      // Combine audio and upload
      const combined = Buffer.concat(audioBuffers);
      const audioPath = `books/${bookId}/audio/chapter-${chapterIndex}.mp3`;
      const audioFile = bucket.file(audioPath);
      await audioFile.save(combined, { contentType: 'audio/mpeg', metadata: { cacheControl: 'public, max-age=31536000' } });
      await audioFile.makePublic();
      const audioUrl = `https://storage.googleapis.com/${bucket.name}/${audioPath}`;

      // Update chapter with audio URL
      await chapterDoc.ref.update({ audioUrl });

      // Increment TTS usage for this SKU group
      const charsUsed = chapterText.length;
      await quota.ref.set(
        { [skuGroup]: FieldValue.increment(charsUsed), updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );

      // Update book progress
      const allChapters = await bookRef.collection('chapters').get();
      const convertedCount = allChapters.docs.filter(d => d.data().audioUrl).length;
      const totalCount = allChapters.size;
      const progress = Math.round((convertedCount / totalCount) * 100);
      await bookRef.update({
        audioProgress: progress,
        audioStatus: convertedCount === totalCount ? 'complete' : bookData.audioStatus || 'none',
        updatedAt: FieldValue.serverTimestamp(),
      });

      await jobRef.update({ status: 'complete' });
      logger.info('Conversion job complete', { uid, jobId, bookId, chapterIndex });
    } catch (err: any) {
      logger.error('Conversion job failed', { uid, jobId, error: err.message });
      await jobRef.update({ status: 'error', error: err.message || 'Conversion failed' });
    }
  }
);
