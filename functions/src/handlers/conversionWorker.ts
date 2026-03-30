import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const TTS_MONTHLY_CHAR_LIMIT = 3_500_000;

async function getTtsUsage() {
  const db = getFirestore();
  const month = new Date().toISOString().slice(0, 7);
  const ref = db.collection('ttsUsage').doc(month);
  const snap = await ref.get();
  return {
    chars: snap.exists ? (snap.data()?.totalCharacters ?? 0) : 0,
    ref,
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
      if (quota.chars + charsNeeded > TTS_MONTHLY_CHAR_LIMIT) {
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
      const languageCode = voiceName.slice(0, voiceName.lastIndexOf('-Neural2'));
      const ttsClient = new (await import('@google-cloud/text-to-speech')).TextToSpeechClient();
      const audioBuffers: Buffer[] = [];

      for (const chunk of chunks) {
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

      // Increment TTS usage
      const charsUsed = chapterText.length;
      await quota.ref.set(
        { totalCharacters: FieldValue.increment(charsUsed), updatedAt: FieldValue.serverTimestamp() },
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
