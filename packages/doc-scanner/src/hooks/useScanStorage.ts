import { useState, useCallback, useEffect } from 'react';

interface CloudFile {
  name: string;
  url: string;
  contentType: string;
  createdAt: string;
}

interface CloudFilesAPI {
  upload: (fileName: string, base64: string, contentType: string) => Promise<void>;
  getAll: () => Promise<CloudFile[]>;
  deleteFile: (fileName: string) => Promise<void>;
}

declare global {
  interface Window {
    __cloudFiles?: CloudFilesAPI;
  }
}

export interface ScanFile {
  name: string;
  url: string;
  createdAt: string;
}

interface UseScanStorageReturn {
  scans: ScanFile[];
  isLoading: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'failed';
  saveScan: (canvas: HTMLCanvasElement) => Promise<string | null>;
  deleteScan: (fileName: string) => Promise<void>;
  refreshScans: () => Promise<void>;
}

export function useScanStorage(): UseScanStorageReturn {
  const [scans, setScans] = useState<ScanFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');

  const refreshScans = useCallback(async () => {
    const api = window.__cloudFiles;
    if (!api) return;

    setIsLoading(true);
    try {
      const allFiles = await api.getAll();
      const scanFiles = allFiles
        .filter(f => f.name.startsWith('scan-'))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setScans(scanFiles);
    } catch {
      // Silently fail — user may not be logged in
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveScan = useCallback(async (canvas: HTMLCanvasElement): Promise<string | null> => {
    const api = window.__cloudFiles;
    if (!api) {
      setSaveStatus('failed');
      return null;
    }

    setSaveStatus('saving');
    try {
      const blob = await new Promise<Blob | null>(resolve =>
        canvas.toBlob(resolve, 'image/jpeg', 0.85)
      );
      if (!blob) {
        setSaveStatus('failed');
        return null;
      }

      const base64 = await blobToBase64(blob);
      const fileName = `scan-${Date.now()}.jpg`;
      await api.upload(fileName, base64, 'image/jpeg');
      setSaveStatus('saved');

      // Refresh the scan list
      await refreshScans();

      return fileName;
    } catch {
      setSaveStatus('failed');
      return null;
    }
  }, [refreshScans]);

  const deleteScan = useCallback(async (fileName: string) => {
    const api = window.__cloudFiles;
    if (!api) return;

    try {
      await api.deleteFile(fileName);
      setScans(prev => prev.filter(s => s.name !== fileName));
    } catch {
      // Silently fail
    }
  }, []);

  // Load scans on mount
  useEffect(() => {
    refreshScans();
  }, [refreshScans]);

  return { scans, isLoading, saveStatus, saveScan, deleteScan, refreshScans };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Strip the data:mime;base64, prefix
      resolve(dataUrl.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
