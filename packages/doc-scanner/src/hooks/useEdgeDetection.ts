import { useState, useRef, useCallback, useEffect } from 'react';
import type { Point } from '../utils/contourTrace';
import type { WorkerResponse } from '../workers/imageProcessor.types';
import { toGrayscale } from '../utils/grayscale';
import { gaussianBlur } from '../utils/gaussianBlur';
import { sobelEdge } from '../utils/sobelEdge';
import { cannyThreshold, adaptiveThreshold } from '../utils/threshold';
import { traceContours } from '../utils/contourTrace';
import { detectQuad } from '../utils/quadDetect';
import { perspectiveWarp } from '../utils/perspectiveTransform';

interface UseEdgeDetectionReturn {
  detectEdges: (imageData: ImageData) => void;
  warpPerspective: (imageData: ImageData, corners: Point[], outputWidth: number, outputHeight: number) => void;
  enhanceBW: (imageData: ImageData) => void;
  corners: Point[] | null;
  warpedImage: ImageData | null;
  enhancedImage: ImageData | null;
  isProcessing: boolean;
  error: string | null;
}

// Scale image using canvas for edge detection at lower resolution
function scaleDown(imageData: ImageData, targetWidth: number): { data: Uint8ClampedArray; width: number; height: number } {
  const scale = targetWidth / imageData.width;
  const newHeight = Math.round(imageData.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext('2d')!;
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = imageData.width;
  srcCanvas.height = imageData.height;
  srcCanvas.getContext('2d')!.putImageData(imageData, 0, 0);
  ctx.drawImage(srcCanvas, 0, 0, targetWidth, newHeight);
  return { data: ctx.getImageData(0, 0, targetWidth, newHeight).data, width: targetWidth, height: newHeight };
}

function runDetectEdges(imageData: ImageData): Point[] | null {
  const SCALED_WIDTH = 640;
  const needsScale = imageData.width > SCALED_WIDTH;
  const { data, width, height } = needsScale
    ? scaleDown(imageData, SCALED_WIDTH)
    : { data: imageData.data, width: imageData.width, height: imageData.height };

  const gray = toGrayscale(data, width, height);
  const blurred = gaussianBlur(gray, width, height);
  const { magnitude, direction } = sobelEdge(blurred, width, height);
  const edges = cannyThreshold(magnitude, direction, width, height, 30, 80);
  const contours = traceContours(edges, width, height);
  const quad = detectQuad(contours, width, height, 0.05);

  if (!quad) return null;

  if (needsScale) {
    const scale = imageData.width / SCALED_WIDTH;
    return quad.map(p => ({ x: Math.round(p.x * scale), y: Math.round(p.y * scale) }));
  }
  return quad;
}

function runEnhanceBW(imageData: ImageData): ImageData {
  const gray = toGrayscale(imageData.data, imageData.width, imageData.height);
  const bw = adaptiveThreshold(gray, imageData.width, imageData.height, 15, 10);
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

export function useEdgeDetection(): UseEdgeDetectionReturn {
  const workerRef = useRef<Worker | null>(null);
  const workerReady = useRef(false);
  const [corners, setCorners] = useState<Point[] | null>(null);
  const [warpedImage, setWarpedImage] = useState<ImageData | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<ImageData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Try to set up worker — if it fails, we fall back to main thread
  useEffect(() => {
    try {
      const w = new Worker(
        new URL('../workers/imageProcessor.worker.ts', import.meta.url),
        { type: 'module' }
      );

      w.onmessage = (e: MessageEvent<WorkerResponse>) => {
        workerReady.current = true;
        setIsProcessing(false);
        const msg = e.data;
        switch (msg.type) {
          case 'edgesDetected':
            setCorners(msg.corners);
            break;
          case 'warpComplete':
            setWarpedImage(msg.imageData);
            break;
          case 'enhanceComplete':
            setEnhancedImage(msg.imageData);
            break;
          case 'error':
            setError(msg.message);
            break;
        }
      };

      w.onerror = () => {
        // Worker failed to load (Module Federation, CSP, etc.) — use main thread
        workerReady.current = false;
        w.terminate();
        workerRef.current = null;
      };

      workerRef.current = w;
    } catch {
      // Worker construction failed — main thread fallback
      workerRef.current = null;
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const detectEdges = useCallback((imageData: ImageData) => {
    setIsProcessing(true);
    setError(null);
    setCorners(null);

    // Main-thread fallback (also handles worker-not-ready case)
    // Use requestAnimationFrame + setTimeout to yield to the UI first (show spinner)
    setTimeout(() => {
      try {
        const result = runDetectEdges(imageData);
        setCorners(result);
      } catch (err) {
        setError(String(err));
      } finally {
        setIsProcessing(false);
      }
    }, 50);
  }, []);

  const warpPerspective = useCallback((imageData: ImageData, crns: Point[], outputWidth: number, outputHeight: number) => {
    setIsProcessing(true);
    setError(null);
    setWarpedImage(null);

    setTimeout(() => {
      try {
        const result = perspectiveWarp(imageData.data, imageData.width, imageData.height, crns, outputWidth, outputHeight);
        setWarpedImage(result);
      } catch (err) {
        setError(String(err));
      } finally {
        setIsProcessing(false);
      }
    }, 50);
  }, []);

  const enhanceBW = useCallback((imageData: ImageData) => {
    setIsProcessing(true);
    setError(null);
    setEnhancedImage(null);

    setTimeout(() => {
      try {
        const result = runEnhanceBW(imageData);
        setEnhancedImage(result);
      } catch (err) {
        setError(String(err));
      } finally {
        setIsProcessing(false);
      }
    }, 50);
  }, []);

  return { detectEdges, warpPerspective, enhanceBW, corners, warpedImage, enhancedImage, isProcessing, error };
}
