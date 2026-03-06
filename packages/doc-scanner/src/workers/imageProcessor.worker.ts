import { toGrayscale } from '../utils/grayscale';
import { gaussianBlur } from '../utils/gaussianBlur';
import { sobelEdge } from '../utils/sobelEdge';
import { cannyThreshold, adaptiveThreshold } from '../utils/threshold';
import { traceContours } from '../utils/contourTrace';
import { detectQuad } from '../utils/quadDetect';
import { perspectiveWarp } from '../utils/perspectiveTransform';
import type { WorkerRequest, WorkerResponse } from './imageProcessor.types';
import type { Point } from '../utils/contourTrace';

function scaleImageData(imageData: ImageData, targetWidth: number): { data: Uint8ClampedArray; width: number; height: number } {
  const scale = targetWidth / imageData.width;
  const newHeight = Math.round(imageData.height * scale);
  const canvas = new OffscreenCanvas(targetWidth, newHeight);
  const ctx = canvas.getContext('2d')!;
  const srcCanvas = new OffscreenCanvas(imageData.width, imageData.height);
  srcCanvas.getContext('2d')!.putImageData(imageData, 0, 0);
  ctx.drawImage(srcCanvas, 0, 0, targetWidth, newHeight);
  const scaled = ctx.getImageData(0, 0, targetWidth, newHeight);
  return { data: scaled.data, width: targetWidth, height: newHeight };
}

function handleDetectEdges(imageData: ImageData, scaledWidth: number): Point[] | null {
  // Scale down for fast edge detection
  const needsScale = imageData.width > scaledWidth;
  const { data, width, height } = needsScale
    ? scaleImageData(imageData, scaledWidth)
    : { data: imageData.data, width: imageData.width, height: imageData.height };

  const gray = toGrayscale(data, width, height);
  const blurred = gaussianBlur(gray, width, height);
  const { magnitude, direction } = sobelEdge(blurred, width, height);
  const edges = cannyThreshold(magnitude, direction, width, height, 30, 80);
  const contours = traceContours(edges, width, height);
  const quad = detectQuad(contours, width, height, 0.05);

  if (!quad) return null;

  // Scale corners back to original resolution
  if (needsScale) {
    const scale = imageData.width / scaledWidth;
    return quad.map(p => ({ x: Math.round(p.x * scale), y: Math.round(p.y * scale) }));
  }
  return quad;
}

function handlePerspectiveWarp(
  imageData: ImageData,
  corners: Point[],
  outputWidth: number,
  outputHeight: number
): ImageData {
  return perspectiveWarp(imageData.data, imageData.width, imageData.height, corners, outputWidth, outputHeight);
}

function handleEnhanceBW(imageData: ImageData): ImageData {
  const gray = toGrayscale(imageData.data, imageData.width, imageData.height);
  const bw = adaptiveThreshold(gray, imageData.width, imageData.height, 15, 10);

  // Convert back to RGBA
  const out = new ImageData(imageData.width, imageData.height);
  for (let i = 0; i < bw.length; i++) {
    const offset = i * 4;
    out.data[offset] = bw[i];
    out.data[offset + 1] = bw[i];
    out.data[offset + 2] = bw[i];
    out.data[offset + 3] = 255;
  }
  return out;
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  try {
    const msg = e.data;
    let response: WorkerResponse;

    switch (msg.type) {
      case 'detectEdges': {
        const corners = handleDetectEdges(msg.imageData, msg.scaledWidth);
        response = { type: 'edgesDetected', corners };
        break;
      }
      case 'perspectiveWarp': {
        const result = handlePerspectiveWarp(msg.imageData, msg.corners, msg.outputWidth, msg.outputHeight);
        response = { type: 'warpComplete', imageData: result };
        break;
      }
      case 'enhanceBW': {
        const result = handleEnhanceBW(msg.imageData);
        response = { type: 'enhanceComplete', imageData: result };
        break;
      }
    }

    self.postMessage(response!);
  } catch (err) {
    self.postMessage({ type: 'error', message: String(err) } satisfies WorkerResponse);
  }
};
