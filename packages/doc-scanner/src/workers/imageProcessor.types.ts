import type { Point } from '../utils/contourTrace';

export type WorkerRequest =
  | { type: 'detectEdges'; imageData: ImageData; scaledWidth: number }
  | { type: 'perspectiveWarp'; imageData: ImageData; corners: Point[]; outputWidth: number; outputHeight: number }
  | { type: 'enhanceBW'; imageData: ImageData };

export type WorkerResponse =
  | { type: 'edgesDetected'; corners: Point[] | null }
  | { type: 'warpComplete'; imageData: ImageData }
  | { type: 'enhanceComplete'; imageData: ImageData }
  | { type: 'error'; message: string };
