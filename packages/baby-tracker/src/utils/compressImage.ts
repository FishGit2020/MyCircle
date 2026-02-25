/**
 * Client-side image compression using native <canvas>.
 * Resizes to maxWidth (preserving aspect ratio) and exports as JPEG.
 * Typical output: ~100-300KB from a 3-10MB phone photo.
 */
export async function compressImage(file: File, maxWidth = 1024, quality = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  // Calculate new dimensions preserving aspect ratio
  let newWidth = width;
  let newHeight = height;
  if (width > maxWidth) {
    newWidth = maxWidth;
    newHeight = Math.round((height / width) * maxWidth);
  }

  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);
  bitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob returned null'));
      },
      'image/jpeg',
      quality,
    );
  });
}
