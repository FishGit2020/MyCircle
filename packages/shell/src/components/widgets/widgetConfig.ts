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
import TripPlannerWidget from './TripPlannerWidget';
import YouthTrackerWidget from './YouthTrackerWidget';

// ─── Types ───────────────────────────────────────────────────────────────────

export type WidgetType = 'weather' | 'stocks' | 'verse' | 'nowPlaying' | 'notebook' | 'babyTracker' | 'childDev' | 'worship' | 'flashcards' | 'dailyLog' | 'cloudFiles' | 'benchmark' | 'immigration' | 'digitalLibrary' | 'familyGames' | 'docScanner' | 'hikingMap' | 'tripPlanner' | 'youthTracker';

export type WidgetSize = 'comfortable' | 'tight';

/** Persisted widget preferences: ordered pin list + global size. */
export interface WidgetLayout {
  /** Ordered list of pinned widget IDs — order = pin order. */
  pinned: WidgetType[];
  size: WidgetSize;
}

// ─── Persistence ─────────────────────────────────────────────────────────────

const DEFAULT_WIDGET_LAYOUT: WidgetLayout = { pinned: [], size: 'comfortable' };

const ALL_WIDGET_IDS = new Set<string>([
  'weather', 'stocks', 'verse', 'nowPlaying', 'notebook', 'babyTracker',
  'childDev', 'worship', 'flashcards', 'dailyLog', 'cloudFiles', 'benchmark',
  'immigration', 'digitalLibrary', 'familyGames', 'docScanner', 'hikingMap', 'tripPlanner', 'youthTracker',
]);

export function loadWidgetLayout(): WidgetLayout {
  try {
    const stored = localStorage.getItem(StorageKeys.WIDGET_LAYOUT);
    if (!stored) return DEFAULT_WIDGET_LAYOUT;
    const parsed = JSON.parse(stored);
    // New format: { pinned: string[], size: string }
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Array.isArray(parsed.pinned)) {
      return {
        pinned: (parsed.pinned as string[]).filter(id => ALL_WIDGET_IDS.has(id)) as WidgetType[],
        size: (['comfortable', 'tight'] as const).includes(parsed.size) ? parsed.size as WidgetSize : 'comfortable',
      };
    }
    // Old array format → ignore, start fresh (user clears old data manually)
  } catch { /* ignore */ }
  return DEFAULT_WIDGET_LAYOUT;
}

export function saveWidgetLayout(layout: WidgetLayout) {
  try {
    localStorage.setItem(StorageKeys.WIDGET_LAYOUT, JSON.stringify(layout));
    window.dispatchEvent(new Event(WindowEvents.WIDGET_LAYOUT_CHANGED));
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
  tripPlanner: TripPlannerWidget,
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
  tripPlanner: '/trips',
  youthTracker: '/youth-tracker',
};

/** Reverse map: first path segment → WidgetType (for pin button lookup by route) */
export const ROUTE_SEGMENT_TO_WIDGET: Record<string, WidgetType> = Object.fromEntries(
  (Object.entries(WIDGET_ROUTES) as [WidgetType, string | ((...args: unknown[]) => unknown)][])
    .filter(([, route]) => typeof route === 'string')
    .map(([widgetId, route]) => [(route as string).replace(/^\//, ''), widgetId])
);
