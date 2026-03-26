import { useState, useCallback, useRef, useEffect } from 'react';
import { computeFrameDiff, isSceneChanged } from '../utils/sceneDiff';
import { BATCH_DWELL_MS, SCENE_CHANGE_THRESHOLD } from '../types';
import type { BatchPhase } from '../types';

export interface UseBatchCaptureReturn {
  batchEnabled: boolean;
  toggleBatch: (enabled: boolean) => void;
  dwellProgress: number;
  sceneChanged: boolean;
  phase: BatchPhase;
  startMonitoring: (videoElement: HTMLVideoElement) => void;
  stopMonitoring: () => void;
}

interface BatchState {
  phase: BatchPhase;
  referenceFrame: ImageData | null;
  dwellStart: number | null;
  sceneChanged: boolean;
}

export function useBatchCapture(
  onAutoCapture: (imageData: ImageData) => void
): UseBatchCaptureReturn {
  const [batchEnabled, setBatchEnabled] = useState(false);
  const [dwellProgress, setDwellProgress] = useState(0);
  const stateRef = useRef<BatchState>({
    phase: 'idle',
    referenceFrame: null,
    dwellStart: null,
    sceneChanged: false,
  });
  const [phase, setPhase] = useState<BatchPhase>('idle');
  const [sceneChanged, setSceneChanged] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const getCaptureCanvas = useCallback((): HTMLCanvasElement => {
    if (!captureCanvasRef.current) {
      captureCanvasRef.current = document.createElement('canvas');
    }
    return captureCanvasRef.current;
  }, []);

  const captureFrame = useCallback((): ImageData | null => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return null;

    const canvas = getCaptureCanvas();
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }, [getCaptureCanvas]);

  const pollFrame = useCallback(() => {
    if (!batchEnabled) return;

    const frame = captureFrame();
    if (!frame) return;

    const s = stateRef.current;

    if (s.phase === 'waiting_scene_change' && s.referenceFrame) {
      // Check for scene change
      const diff = computeFrameDiff(s.referenceFrame, frame);
      if (isSceneChanged(diff, SCENE_CHANGE_THRESHOLD)) {
        s.phase = 'detecting';
        s.sceneChanged = true;
        s.referenceFrame = null;
        s.dwellStart = null;
        setPhase('detecting');
        setSceneChanged(true);
        setDwellProgress(0);
      }
      return;
    }

    if (s.phase === 'detecting' || s.phase === 'dwelling') {
      // Simple edge presence check: compare current frame stability
      // For simplicity, we check if consecutive frames are stable (low diff)
      if (!s.referenceFrame) {
        s.referenceFrame = frame;
        s.dwellStart = Date.now();
        s.phase = 'dwelling';
        setPhase('dwelling');
        return;
      }

      const diff = computeFrameDiff(s.referenceFrame, frame);
      if (diff < 5) {
        // Frame is stable — continue dwelling
        const elapsed = Date.now() - (s.dwellStart || Date.now());
        const progress = Math.min((elapsed / BATCH_DWELL_MS) * 100, 100);
        setDwellProgress(progress);

        if (elapsed >= BATCH_DWELL_MS) {
          // Auto-capture!
          s.phase = 'capturing';
          setPhase('capturing');
          setDwellProgress(100);

          // Capture and notify
          onAutoCapture(frame);

          // Move to cooldown → waiting for scene change
          s.phase = 'waiting_scene_change';
          s.referenceFrame = frame;
          s.dwellStart = null;
          s.sceneChanged = false;
          setPhase('waiting_scene_change');
          setSceneChanged(false);
          setDwellProgress(0);
        }
      } else {
        // Frame changed — reset dwell timer
        s.referenceFrame = frame;
        s.dwellStart = Date.now();
        setDwellProgress(0);
      }
    }
  }, [batchEnabled, captureFrame, onAutoCapture]);

  const startMonitoring = useCallback((videoElement: HTMLVideoElement) => {
    videoRef.current = videoElement;
    stateRef.current = {
      phase: 'detecting',
      referenceFrame: null,
      dwellStart: null,
      sceneChanged: false,
    };
    setPhase('detecting');
    setDwellProgress(0);
  }, []);

  const stopMonitoring = useCallback(() => {
    videoRef.current = null;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    stateRef.current.phase = 'idle';
    setPhase('idle');
    setDwellProgress(0);
  }, []);

  // Polling interval
  useEffect(() => {
    if (batchEnabled && videoRef.current) {
      intervalRef.current = setInterval(pollFrame, 500);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [batchEnabled, pollFrame]);

  const toggleBatch = useCallback((enabled: boolean) => {
    setBatchEnabled(enabled);
    if (!enabled) {
      stopMonitoring();
    }
  }, [stopMonitoring]);

  return {
    batchEnabled,
    toggleBatch,
    dwellProgress,
    sceneChanged,
    phase,
    startMonitoring,
    stopMonitoring,
  };
}
