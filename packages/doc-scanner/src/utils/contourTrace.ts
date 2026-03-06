export interface Point {
  x: number;
  y: number;
}

/**
 * Moore neighborhood boundary tracing.
 * Finds all contours in a binary edge image and returns arrays of boundary points.
 */
export function traceContours(
  edges: Uint8Array,
  width: number,
  height: number
): Point[][] {
  const visited = new Uint8Array(width * height);
  const contours: Point[][] = [];

  // Moore neighborhood directions (clockwise from left)
  const dx = [-1, -1, 0, 1, 1, 1, 0, -1];
  const dy = [0, -1, -1, -1, 0, 1, 1, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (edges[idx] === 0 || visited[idx]) continue;
      // Check if this is a border pixel (has a background neighbor)
      if (edges[y * width + (x - 1)] !== 0) continue;

      const contour: Point[] = [];
      let cx = x, cy = y;
      let dir = 0; // Start looking left

      do {
        contour.push({ x: cx, y: cy });
        visited[cy * width + cx] = 1;

        // Search Moore neighborhood starting from direction opposite of entry
        let found = false;
        const startDir = (dir + 5) % 8; // Backtrack direction + 1

        for (let i = 0; i < 8; i++) {
          const d = (startDir + i) % 8;
          const nx = cx + dx[d];
          const ny = cy + dy[d];

          if (nx >= 0 && nx < width && ny >= 0 && ny < height && edges[ny * width + nx] !== 0) {
            cx = nx;
            cy = ny;
            dir = d;
            found = true;
            break;
          }
        }

        if (!found) break;
      } while (cx !== x || cy !== y);

      if (contour.length >= 20) {
        contours.push(contour);
      }
    }
  }

  return contours;
}
