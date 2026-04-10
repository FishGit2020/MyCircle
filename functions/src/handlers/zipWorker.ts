import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import { uploadToStorage } from './shared.js';

export const onZipJobCreated = onDocumentCreated(
  {
    document: 'books/{bookId}/zipJobs/{jobId}',
    memory: '1GiB',
    timeoutSeconds: 540,
  },
  async (event) => {
    const { bookId, jobId } = event.params;
    const db = getFirestore();
    const bucket = getStorage().bucket();
    const bookRef = db.collection('books').doc(bookId);
    const jobRef = bookRef.collection('zipJobs').doc(jobId);

    // Idempotency guard — only process 'pending' jobs
    const jobDoc = await jobRef.get();
    if (!jobDoc.exists || jobDoc.data()!.status !== 'pending') {
      logger.info('Skipping zip job (not pending)', { bookId, jobId, status: jobDoc.data()?.status });
      return;
    }
    logger.info('Starting zip job', { bookId, jobId });
    await jobRef.update({ status: 'processing', updatedAt: new Date() });

    try {
      const bookDoc = await bookRef.get();
      if (!bookDoc.exists) throw new Error('Book not found');
      const bookTitle = (bookDoc.data()!.title as string) ?? 'Audiobook';

      // Build chapter index → title map
      const chaptersSnap = await bookRef.collection('chapters').get();
      const chapterMap = new Map<number, string>();
      for (const doc of chaptersSnap.docs) {
        const d = doc.data();
        chapterMap.set(d.index as number, d.title as string);
      }

      // List audio files sorted by chapter index
      const [audioFiles] = await bucket.getFiles({ prefix: `books/${bookId}/audio/` });
      if (audioFiles.length === 0) throw new Error('No audio files found for this book');
      logger.info('Found audio files', { bookId, count: audioFiles.length });

      const sorted = audioFiles.sort((a, b) => {
        const ai = parseInt(a.name.match(/chapter-(\d+)\.mp3$/)?.[1] ?? '0', 10);
        const bi = parseInt(b.name.match(/chapter-(\d+)\.mp3$/)?.[1] ?? '0', 10);
        return ai - bi;
      });

      // Stream chapters into archiver → passthrough buffer
      const archive = archiver('zip', { store: true });
      const passThrough = new PassThrough();
      const chunks: Buffer[] = [];
      passThrough.on('data', (chunk: Buffer) => chunks.push(chunk));

      archive.pipe(passThrough);

      let downloadedCount = 0;
      let totalBytes = 0;
      for (const file of sorted) {
        const indexMatch = file.name.match(/chapter-(\d+)\.mp3$/);
        const index = indexMatch ? parseInt(indexMatch[1], 10) : 0;
        const chapterTitle = chapterMap.get(index) ?? `Chapter ${index}`;
        const [fileBuffer] = await file.download();
        totalBytes += fileBuffer.length;
        downloadedCount++;
        logger.info('Downloaded chapter', { bookId, chapter: index, size: fileBuffer.length, progress: `${downloadedCount}/${sorted.length}` });
        archive.append(fileBuffer, { name: `${bookTitle} - Ch${index} ${chapterTitle}.mp3` });
      }

      await archive.finalize();

      // Wait for passthrough to drain
      await new Promise<void>((resolve, reject) => {
        passThrough.on('end', resolve);
        passThrough.on('error', reject);
        archive.on('error', reject);
      });

      const zipBuffer = Buffer.concat(chunks);
      logger.info('ZIP archive created', { bookId, zipSize: zipBuffer.length, totalAudioBytes: totalBytes, chapters: sorted.length });

      const storagePath = `books/${bookId}/audiobook.zip`;
      const { downloadUrl } = await uploadToStorage(bucket, storagePath, zipBuffer, 'application/zip');
      logger.info('ZIP uploaded to storage', { bookId, storagePath });

      await bookRef.update({
        zipStatus: 'ready',
        zipUrl: downloadUrl,
        zipSize: zipBuffer.length,
        zipGeneratedAt: new Date(),
        zipError: null,
      });
      await jobRef.update({ status: 'complete', updatedAt: new Date() });
      logger.info('Zip job complete', { bookId, jobId, zipSize: zipBuffer.length });

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('Zip job failed', { bookId, jobId, error: msg });
      await bookRef.update({ zipStatus: 'error', zipError: msg }).catch(() => {});
      await jobRef.update({ status: 'error', error: msg, updatedAt: new Date() }).catch(() => {});
    }
  }
);
