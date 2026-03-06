/**
 * Sobel edge detection — returns gradient magnitude and direction arrays.
 */
export interface SobelResult {
  magnitude: Float32Array;
  direction: Float32Array;
}

export function sobelEdge(gray: Uint8Array, width: number, height: number): SobelResult {
  const size = width * height;
  const magnitude = new Float32Array(size);
  const direction = new Float32Array(size);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      // Gx kernel: [-1 0 1; -2 0 2; -1 0 1]
      const gx =
        -gray[(y - 1) * width + (x - 1)] + gray[(y - 1) * width + (x + 1)]
        - 2 * gray[y * width + (x - 1)] + 2 * gray[y * width + (x + 1)]
        - gray[(y + 1) * width + (x - 1)] + gray[(y + 1) * width + (x + 1)];
      // Gy kernel: [-1 -2 -1; 0 0 0; 1 2 1]
      const gy =
        -gray[(y - 1) * width + (x - 1)] - 2 * gray[(y - 1) * width + x] - gray[(y - 1) * width + (x + 1)]
        + gray[(y + 1) * width + (x - 1)] + 2 * gray[(y + 1) * width + x] + gray[(y + 1) * width + (x + 1)];

      magnitude[idx] = Math.sqrt(gx * gx + gy * gy);
      direction[idx] = Math.atan2(gy, gx);
    }
  }

  return { magnitude, direction };
}
