import React, { useRef, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import { useCamera } from '../hooks/useCamera';

interface CameraCaptureProps {
  onCapture: (imageData: ImageData) => void;
}

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const { t } = useTranslation();
  const { videoRef, isActive, error, startCamera, stopCamera, captureFrame } = useCamera();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = useCallback(() => {
    const frame = captureFrame();
    if (frame) {
      stopCamera();
      onCapture(frame);
    }
  }, [captureFrame, stopCamera, onCapture]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      onCapture(imageData);
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);

    // Reset input so same file can be selected again
    e.target.value = '';
  }, [onCapture]);

  return (
    <div className="flex flex-col items-center gap-4">
      {isActive ? (
        <div className="relative w-full max-w-lg">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded-lg bg-black"
            data-testid="camera-video"
          />
          <button
            type="button"
            onClick={handleCapture}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-16 h-16 rounded-full bg-white dark:bg-gray-200 border-4 border-blue-500 shadow-lg hover:scale-105 active:scale-95 transition-transform touch-manipulation"
            aria-label={t('docScanner.capture')}
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-blue-500 pointer-events-none" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 w-full max-w-lg">
          {error && (
            <div className="w-full p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error === 'permission_denied' && t('docScanner.cameraPermissionDenied')}
              {error === 'no_camera' && t('docScanner.noCameraFound')}
              {error === 'camera_error' && t('docScanner.noCameraFound')}
            </div>
          )}

          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={startCamera}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {t('docScanner.capture')}
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {t('docScanner.uploadImage')}
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="file-input"
          />
        </div>
      )}
    </div>
  );
}
