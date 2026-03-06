/**
 * Convert RGBA pixel data to grayscale luminance using BT.601 coefficients.
 * Returns a Uint8Array of luminance values (one per pixel).
 */
export function toGrayscale(data: Uint8ClampedArray, width: number, height: number): Uint8Array {
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < gray.length; i++) {
    const offset = i * 4;
    // BT.601: Y = 0.299R + 0.587G + 0.114B
    gray[i] = Math.round(0.299 * data[offset] + 0.587 * data[offset + 1] + 0.114 * data[offset + 2]);
  }
  return gray;
}
