import { toGrayscale } from './grayscale';

const DOWNSAMPLE_WIDTH = 160;

/**
 * Compute the mean absolute difference between two frames as a percentage (0-100).
 * Both frames are downsampled to ~160px width and converted to grayscale.
 */
export function computeFrameDiff(frameA: ImageData, frameB: ImageData): number {
  const a = downsampleGray(frameA);
  const b = downsampleGray(frameB);

  const len = Math.min(a.length, b.length);
  if (len === 0) return 0;

  let totalDiff = 0;
  for (let i = 0; i < len; i++) {
    totalDiff += Math.abs(a[i] - b[i]);
  }

  // Normalize to percentage (max diff per pixel is 255)
  return (totalDiff / len / 255) * 100;
}

/**
 * Returns true if the frame difference exceeds the given threshold.
 */
export function isSceneChanged(diff: number, threshold: number): boolean {
  return diff > threshold;
}

/**
 * Downsample an ImageData to ~160px width and return grayscale byte array.
 */
function downsampleGray(imageData: ImageData): Uint8Array {
  const { width, height, data } = imageData;
  const scale = DOWNSAMPLE_WIDTH / width;
  const dw = Math.round(width * scale);
  const dh = Math.round(height * scale);

  // Convert to grayscale first
  const grayFull = toGrayscale(data, width, height);

  // Nearest-neighbor downsample from grayscale
  const result = new Uint8Array(dw * dh);
  for (let y = 0; y < dh; y++) {
    const srcY = Math.min(Math.floor(y / scale), height - 1);
    for (let x = 0; x < dw; x++) {
      const srcX = Math.min(Math.floor(x / scale), width - 1);
      result[y * dw + x] = grayFull[srcY * width + srcX];
    }
  }

  return result;
}
