import { useState, useRef, useCallback, useEffect } from 'react';
import type { Point } from '../utils/contourTrace';
import type { WorkerRequest, WorkerResponse } from '../workers/imageProcessor.types';

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

export function useEdgeDetection(): UseEdgeDetectionReturn {
  const workerRef = useRef<Worker | null>(null);
  const [corners, setCorners] = useState<Point[] | null>(null);
  const [warpedImage, setWarpedImage] = useState<ImageData | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<ImageData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/imageProcessor.worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
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

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const detectEdges = useCallback((imageData: ImageData) => {
    setIsProcessing(true);
    setError(null);
    setCorners(null);
    const msg: WorkerRequest = { type: 'detectEdges', imageData, scaledWidth: 640 };
    workerRef.current?.postMessage(msg, [imageData.data.buffer]);
  }, []);

  const warpPerspective = useCallback((imageData: ImageData, crns: Point[], outputWidth: number, outputHeight: number) => {
    setIsProcessing(true);
    setError(null);
    setWarpedImage(null);
    const msg: WorkerRequest = { type: 'perspectiveWarp', imageData, corners: crns, outputWidth, outputHeight };
    workerRef.current?.postMessage(msg, [imageData.data.buffer]);
  }, []);

  const enhanceBW = useCallback((imageData: ImageData) => {
    setIsProcessing(true);
    setError(null);
    setEnhancedImage(null);
    const msg: WorkerRequest = { type: 'enhanceBW', imageData };
    workerRef.current?.postMessage(msg, [imageData.data.buffer]);
  }, []);

  return { detectEdges, warpPerspective, enhanceBW, corners, warpedImage, enhancedImage, isProcessing, error };
}
