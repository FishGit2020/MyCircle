import { onDocumentCreated } from 'firebase-functions/v2/firestore';
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
    if (!jobDoc.exists || jobDoc.data()!.status !== 'pending') return;
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

      for (const file of sorted) {
        const indexMatch = file.name.match(/chapter-(\d+)\.mp3$/);
        const index = indexMatch ? parseInt(indexMatch[1], 10) : 0;
        const chapterTitle = chapterMap.get(index) ?? `Chapter ${index}`;
        const [fileBuffer] = await file.download();
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
      const storagePath = `books/${bookId}/audiobook.zip`;
      const { downloadUrl } = await uploadToStorage(bucket, storagePath, zipBuffer, 'application/zip');

      await bookRef.update({
        zipStatus: 'ready',
        zipUrl: downloadUrl,
        zipSize: zipBuffer.length,
        zipGeneratedAt: new Date(),
        zipError: null,
      });
      await jobRef.update({ status: 'complete', updatedAt: new Date() });

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      await bookRef.update({ zipStatus: 'error', zipError: msg }).catch(() => {});
      await jobRef.update({ status: 'error', error: msg, updatedAt: new Date() }).catch(() => {});
    }
  }
);
