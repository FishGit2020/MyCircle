import type { Point } from './contourTrace';
import { solveLinearSystem } from './matrixMath';

/**
 * Compute 3×3 perspective homography matrix from 4 source → 4 destination point pairs.
 * H maps src → dst: [x', y', w]^T = H * [x, y, 1]^T
 * Returns the 9 elements [h0..h8] where h8=1.
 */
export function computeHomography(src: Point[], dst: Point[]): number[] | null {
  // Build 8×8 system: for each point pair (xi, yi) → (Xi, Yi):
  //   Xi = (h0*xi + h1*yi + h2) / (h6*xi + h7*yi + 1)
  //   Yi = (h3*xi + h4*yi + h5) / (h6*xi + h7*yi + 1)
  // Rearranged to linear form:
  //   h0*xi + h1*yi + h2 - h6*xi*Xi - h7*yi*Xi = Xi
  //   h3*xi + h4*yi + h5 - h6*xi*Yi - h7*yi*Yi = Yi

  const A: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < 4; i++) {
    const { x: sx, y: sy } = src[i];
    const { x: dx, y: dy } = dst[i];

    A.push([sx, sy, 1, 0, 0, 0, -sx * dx, -sy * dx]);
    b.push(dx);
    A.push([0, 0, 0, sx, sy, 1, -sx * dy, -sy * dy]);
    b.push(dy);
  }

  const h = solveLinearSystem(A, b);
  if (!h) return null;

  return [...h, 1]; // h8 = 1
}

/**
 * Apply inverse perspective warp with bilinear interpolation.
 * Warps the source image so that the `srcCorners` quad maps to a rectangle of `outWidth × outHeight`.
 */
export function perspectiveWarp(
  srcData: Uint8ClampedArray,
  srcWidth: number,
  srcHeight: number,
  srcCorners: Point[],
  outWidth: number,
  outHeight: number
): ImageData {
  // Destination corners: rectangle
  const dstCorners: Point[] = [
    { x: 0, y: 0 },
    { x: outWidth - 1, y: 0 },
    { x: outWidth - 1, y: outHeight - 1 },
    { x: 0, y: outHeight - 1 },
  ];

  // Inverse mapping: dst → src (so we map each output pixel to source)
  const H = computeHomography(dstCorners, srcCorners);
  if (!H) {
    // Fallback: return blank image
    return new ImageData(outWidth, outHeight);
  }

  const out = new ImageData(outWidth, outHeight);
  const outArr = out.data;

  for (let dy = 0; dy < outHeight; dy++) {
    for (let dx = 0; dx < outWidth; dx++) {
      // Map dst → src using homography
      const w = H[6] * dx + H[7] * dy + H[8];
      const sx = (H[0] * dx + H[1] * dy + H[2]) / w;
      const sy = (H[3] * dx + H[4] * dy + H[5]) / w;

      // Bilinear interpolation
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      const x1 = x0 + 1;
      const y1 = y0 + 1;

      if (x0 < 0 || y0 < 0 || x1 >= srcWidth || y1 >= srcHeight) continue;

      const fx = sx - x0;
      const fy = sy - y0;

      const outIdx = (dy * outWidth + dx) * 4;
      for (let c = 0; c < 4; c++) {
        const v00 = srcData[(y0 * srcWidth + x0) * 4 + c];
        const v10 = srcData[(y0 * srcWidth + x1) * 4 + c];
        const v01 = srcData[(y1 * srcWidth + x0) * 4 + c];
        const v11 = srcData[(y1 * srcWidth + x1) * 4 + c];

        outArr[outIdx + c] = Math.round(
          v00 * (1 - fx) * (1 - fy) +
          v10 * fx * (1 - fy) +
          v01 * (1 - fx) * fy +
          v11 * fx * fy
        );
      }
    }
  }

  return out;
}

/**
 * Estimate output dimensions from the quad corners.
 */
export function estimateOutputSize(corners: Point[]): { width: number; height: number } {
  const [tl, tr, br, bl] = corners;
  const topWidth = Math.sqrt((tr.x - tl.x) ** 2 + (tr.y - tl.y) ** 2);
  const bottomWidth = Math.sqrt((br.x - bl.x) ** 2 + (br.y - bl.y) ** 2);
  const leftHeight = Math.sqrt((bl.x - tl.x) ** 2 + (bl.y - tl.y) ** 2);
  const rightHeight = Math.sqrt((br.x - tr.x) ** 2 + (br.y - tr.y) ** 2);

  return {
    width: Math.round(Math.max(topWidth, bottomWidth)),
    height: Math.round(Math.max(leftHeight, rightHeight)),
  };
}
