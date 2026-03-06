/**
 * Canny non-maximum suppression + hysteresis thresholding.
 * Returns binary edge map (0 or 255).
 */
export function cannyThreshold(
  magnitude: Float32Array,
  direction: Float32Array,
  width: number,
  height: number,
  low = 30,
  high = 80
): Uint8Array {
  const size = width * height;
  const nms = new Float32Array(size);

  // Non-maximum suppression
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const mag = magnitude[idx];
      // Quantize direction to 4 angles (0, 45, 90, 135)
      let angle = (direction[idx] * 180) / Math.PI;
      if (angle < 0) angle += 180;

      let n1 = 0, n2 = 0;
      if ((angle < 22.5) || (angle >= 157.5)) {
        n1 = magnitude[y * width + (x + 1)];
        n2 = magnitude[y * width + (x - 1)];
      } else if (angle < 67.5) {
        n1 = magnitude[(y - 1) * width + (x + 1)];
        n2 = magnitude[(y + 1) * width + (x - 1)];
      } else if (angle < 112.5) {
        n1 = magnitude[(y - 1) * width + x];
        n2 = magnitude[(y + 1) * width + x];
      } else {
        n1 = magnitude[(y - 1) * width + (x - 1)];
        n2 = magnitude[(y + 1) * width + (x + 1)];
      }

      nms[idx] = (mag >= n1 && mag >= n2) ? mag : 0;
    }
  }

  // Hysteresis thresholding
  const edges = new Uint8Array(size);
  const STRONG = 255;
  const WEAK = 128;

  for (let i = 0; i < size; i++) {
    if (nms[i] >= high) edges[i] = STRONG;
    else if (nms[i] >= low) edges[i] = WEAK;
  }

  // Connect weak edges to strong edges
  let changed = true;
  while (changed) {
    changed = false;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (edges[idx] !== WEAK) continue;
        // Check 8-neighborhood for strong edge
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (edges[(y + dy) * width + (x + dx)] === STRONG) {
              edges[idx] = STRONG;
              changed = true;
            }
          }
        }
      }
    }
  }

  // Suppress remaining weak edges
  for (let i = 0; i < size; i++) {
    if (edges[i] !== STRONG) edges[i] = 0;
  }

  return edges;
}

/**
 * Adaptive threshold using integral image for B&W scanned look.
 * O(1) per pixel after integral image construction.
 */
export function adaptiveThreshold(
  gray: Uint8Array,
  width: number,
  height: number,
  blockSize = 15,
  c = 10
): Uint8Array {
  // Build integral image (use Float64Array for large sums)
  const integral = new Float64Array((width + 1) * (height + 1));
  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    for (let x = 0; x < width; x++) {
      rowSum += gray[y * width + x];
      integral[(y + 1) * (width + 1) + (x + 1)] =
        integral[y * (width + 1) + (x + 1)] + rowSum;
    }
  }

  const out = new Uint8Array(width * height);
  const half = Math.floor(blockSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const x1 = Math.max(0, x - half);
      const y1 = Math.max(0, y - half);
      const x2 = Math.min(width - 1, x + half);
      const y2 = Math.min(height - 1, y + half);
      const count = (x2 - x1 + 1) * (y2 - y1 + 1);

      const sum =
        integral[(y2 + 1) * (width + 1) + (x2 + 1)]
        - integral[y1 * (width + 1) + (x2 + 1)]
        - integral[(y2 + 1) * (width + 1) + x1]
        + integral[y1 * (width + 1) + x1];

      const mean = sum / count;
      out[y * width + x] = gray[y * width + x] > mean - c ? 255 : 0;
    }
  }

  return out;
}
