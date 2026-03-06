/**
 * Apply a 5×5 Gaussian blur (σ≈1.4) to a grayscale image.
 * Returns a new Uint8Array with the blurred values.
 */
const KERNEL = [
  2,  4,  5,  4,  2,
  4,  9, 12,  9,  4,
  5, 12, 15, 12,  5,
  4,  9, 12,  9,  4,
  2,  4,  5,  4,  2,
];
const KERNEL_SUM = 159;

export function gaussianBlur(gray: Uint8Array, width: number, height: number): Uint8Array {
  const out = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let ky = -2; ky <= 2; ky++) {
        for (let kx = -2; kx <= 2; kx++) {
          const px = Math.min(Math.max(x + kx, 0), width - 1);
          const py = Math.min(Math.max(y + ky, 0), height - 1);
          sum += gray[py * width + px] * KERNEL[(ky + 2) * 5 + (kx + 2)];
        }
      }
      out[y * width + x] = Math.round(sum / KERNEL_SUM);
    }
  }
  return out;
}
