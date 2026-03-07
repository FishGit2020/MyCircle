import React from 'react';
import { StorageKeys, WindowEvents } from '@mycircle/shared';
import WeatherWidget from './WeatherWidget';
import StockWidget from './StockWidget';
import VerseWidget from './VerseWidget';
import NowPlayingWidget from './NowPlayingWidget';
import NotebookWidget from './NotebookWidget';
import BabyTrackerWidget from './BabyTrackerWidget';
import ChildDevWidget from './ChildDevWidget';
import WorshipWidget from './WorshipWidget';
import FlashcardsWidget from './FlashcardsWidget';
import DailyLogWidget from './DailyLogWidget';
import CloudFilesWidget from './CloudFilesWidget';
import BenchmarkWidget from './BenchmarkWidget';
import ImmigrationWidget from './ImmigrationWidget';
import DigitalLibraryWidget from './DigitalLibraryWidget';
import FamilyGamesWidget from './FamilyGamesWidget';
import DocScannerWidget from './DocScannerWidget';
import HikingMapWidget from './HikingMapWidget';
import YouthTrackerWidget from './YouthTrackerWidget';

// ─── Types ───────────────────────────────────────────────────────────────────

export type WidgetType = 'weather' | 'stocks' | 'verse' | 'nowPlaying' | 'notebook' | 'babyTracker' | 'childDev' | 'worship' | 'flashcards' | 'dailyLog' | 'cloudFiles' | 'benchmark' | 'immigration' | 'digitalLibrary' | 'familyGames' | 'docScanner' | 'hikingMap' | 'youthTracker';

export type WidgetSize = 'small' | 'medium' | 'large';

export interface WidgetConfig {
  id: WidgetType;
  visible: boolean;
}

export const DEFAULT_LAYOUT: WidgetConfig[] = [
  { id: 'weather', visible: true },
  { id: 'stocks', visible: true },
  { id: 'verse', visible: true },
  { id: 'nowPlaying', visible: true },
  { id: 'notebook', visible: true },
  { id: 'babyTracker', visible: true },
  { id: 'childDev', visible: true },
  { id: 'worship', visible: true },
  { id: 'flashcards', visible: true },
  { id: 'dailyLog', visible: true },
  { id: 'cloudFiles', visible: true },
  { id: 'benchmark', visible: true },
  { id: 'immigration', visible: true },
  { id: 'digitalLibrary', visible: true },
  { id: 'familyGames', visible: true },
  { id: 'docScanner', visible: true },
  { id: 'hikingMap', visible: true },
  { id: 'youthTracker', visible: true },
];

// ─── Persistence ─────────────────────────────────────────────────────────────

export const VALID_IDS = new Set<string>(DEFAULT_LAYOUT.map(w => w.id));

export function loadLayout(): WidgetConfig[] {
  try {
    const stored = localStorage.getItem(StorageKeys.WIDGET_LAYOUT);
    if (stored) {
      const parsed: WidgetConfig[] = JSON.parse(stored);
      // Remove stale widget IDs that no longer exist (e.g. removed features)
      const filtered = parsed.filter(w => VALID_IDS.has(w.id));
      // Ensure all current widget types exist (forward-compat)
      const ids = new Set(filtered.map(w => w.id));
      for (const def of DEFAULT_LAYOUT) {
        if (!ids.has(def.id)) filtered.push(def);
      }
      // Strip legacy per-widget size field if present
      return filtered.map(({ size: _, ...rest }: any) => rest);
    }
  } catch { /* ignore */ }
  return DEFAULT_LAYOUT;
}

export function saveLayout(layout: WidgetConfig[]) {
  try {
    localStorage.setItem(StorageKeys.WIDGET_LAYOUT, JSON.stringify(layout));
    window.dispatchEvent(new Event(WindowEvents.WIDGET_LAYOUT_CHANGED));
  } catch { /* ignore */ }
}

// ─── Global Widget Size ───────────────────────────────────────────────────────

const VALID_SIZES: WidgetSize[] = ['small', 'medium', 'large'];

export function loadWidgetSize(): WidgetSize {
  try {
    const stored = localStorage.getItem(StorageKeys.WIDGET_SIZE);
    if (stored && VALID_SIZES.includes(stored as WidgetSize)) return stored as WidgetSize;
  } catch { /* ignore */ }
  return 'medium';
}

export function saveWidgetSize(size: WidgetSize) {
  try {
    localStorage.setItem(StorageKeys.WIDGET_SIZE, size);
    window.dispatchEvent(new Event(WindowEvents.WIDGET_SIZE_CHANGED));
  } catch { /* ignore */ }
}

// ─── Widget Registry ─────────────────────────────────────────────────────────

export const WIDGET_COMPONENTS: Record<WidgetType, React.FC> = {
  weather: WeatherWidget,
  stocks: StockWidget,
  verse: VerseWidget,
  nowPlaying: NowPlayingWidget,
  notebook: NotebookWidget,
  babyTracker: BabyTrackerWidget,
  childDev: ChildDevWidget,
  worship: WorshipWidget,
  flashcards: FlashcardsWidget,
  dailyLog: DailyLogWidget,
  cloudFiles: CloudFilesWidget,
  benchmark: BenchmarkWidget,
  immigration: ImmigrationWidget,
  digitalLibrary: DigitalLibraryWidget,
  familyGames: FamilyGamesWidget,
  docScanner: DocScannerWidget,
  hikingMap: HikingMapWidget,
  youthTracker: YouthTrackerWidget,
};

export const WIDGET_ROUTES: Record<WidgetType, string | ((ctx: { favoriteCities: Array<{ lat: number; lon: number; id: string; name: string }> }) => string)> = {
  weather: '/weather',
  stocks: '/stocks',
  verse: '/bible',
  nowPlaying: '/podcasts',
  notebook: '/notebook',
  babyTracker: '/baby',
  childDev: '/child-dev',
  worship: '/worship',
  flashcards: '/flashcards',
  dailyLog: '/daily-log',
  cloudFiles: '/files',
  benchmark: '/benchmark',
  immigration: '/immigration',
  digitalLibrary: '/library',
  familyGames: '/family-games',
  docScanner: '/doc-scanner',
  hikingMap: '/hiking',
  youthTracker: '/youth-tracker',
};
