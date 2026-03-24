import { useCallback } from 'react';
import { StorageKeys } from '@mycircle/shared';

interface ReadingProgress {
  cfi: string;
  chapterIndex: number;
  percent: number; // 0–100
  readAt: number;  // epoch ms
}

type ProgressMap = Record<string, ReadingProgress>;

function loadMap(): ProgressMap {
  try {
    const raw = localStorage.getItem(StorageKeys.BOOK_READ_PROGRESS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMap(map: ProgressMap): void {
  try {
    localStorage.setItem(StorageKeys.BOOK_READ_PROGRESS, JSON.stringify(map));
  } catch { /* storage quota */ }
}

export function useReadingProgress() {
  const saveProgress = useCallback((bookId: string, cfi: string, chapterIndex: number, percent: number) => {
    const map = loadMap();
    map[bookId] = { cfi, chapterIndex, percent, readAt: Date.now() };
    saveMap(map);
  }, []);

  const getProgress = useCallback((bookId: string): ReadingProgress | null => {
    return loadMap()[bookId] ?? null;
  }, []);

  const clearProgress = useCallback((bookId: string) => {
    const map = loadMap();
    delete map[bookId];
    saveMap(map);
  }, []);

  const getAllProgress = useCallback((): ProgressMap => {
    return loadMap();
  }, []);

  return { saveProgress, getProgress, clearProgress, getAllProgress };
}
