import type { TranslationKey } from '@mycircle/shared';

// --- Nav group data model ---
export interface NavItem { path: string; labelKey: TranslationKey; icon: string }
export interface NavGroup { labelKey: TranslationKey; items: NavItem[] }

// Prefetch MFE remote modules on hover/focus to reduce perceived load time
const prefetched = new Set<string>();
const ROUTE_MODULE_MAP: Record<string, () => Promise<unknown>> = {
  '/weather': () => import('weatherDisplay/WeatherDisplay'),
  '/stocks': () => import('stockTracker/StockTracker'),
  '/podcasts': () => import('podcastPlayer/PodcastPlayer'),
  '/ai': () => import('aiAssistant/AiAssistant'),
  '/bible': () => import('bibleReader/BibleReader'),
  '/worship': () => import('worshipSongs/WorshipSongs'),
  '/notebook': () => import('notebook/Notebook'),
  '/baby': () => import('babyTracker/BabyTracker'),
  '/child-dev': () => import('childDevelopment/ChildDevelopment'),
  '/flashcards': () => import('flashcards/FlashCards'),
  '/daily-log': () => import('dailyLog/DailyLog'),
  '/files': () => import('cloudFiles/CloudFiles'),
  '/library': () => import('digitalLibrary/DigitalLibrary'),
  '/family-games': () => import('familyGames/FamilyGames'),
  '/doc-scanner': () => import('docScanner/DocScanner'),
  '/hiking': () => import('hikingMap/HikingMap'),
  '/trips': () => import('tripPlanner/TripPlanner'),
  '/polls': () => import('pollSystem/PollSystem'),
  '/radio': () => import('radioStation/RadioStation'),
  '/interview': () => import('aiInterviewer/AiInterviewer'),
  '/transit': () => import('transitTracker/TransitTracker'),
  '/travel-map': () => import('travelMap/TravelMap'),
  '/deals': () => import('dealFinder/DealFinder'),
  '/web-crawler': () => import('webCrawler/WebCrawler'),
  '/resume': () => import('resumeTailor/ResumeTailor'),
  '/hsa-expenses': () => import('hsaExpenses/HsaExpenses'),
  '/anniversary': () => import('anniversary/Anniversary'),
};

export { ROUTE_MODULE_MAP };

export function prefetchRoute(path: string) {
  if (prefetched.has(path)) return;
  const loader = ROUTE_MODULE_MAP[path];
  if (loader) {
    prefetched.add(path);
    loader().catch(() => {});
  }
}

export const NAV_GROUPS: NavGroup[] = [
  { labelKey: 'nav.group.daily', items: [
    { path: '/weather', labelKey: 'dashboard.weather', icon: 'weather' },
    { path: '/stocks',  labelKey: 'nav.stocks',        icon: 'stocks' },
    { path: '/podcasts', labelKey: 'nav.podcasts',     icon: 'podcasts' },
    { path: '/radio', labelKey: 'nav.radio', icon: 'radio' },
    { path: '/transit', labelKey: 'nav.transit' as any, icon: 'transit' }, // eslint-disable-line @typescript-eslint/no-explicit-any
    { path: '/deals', labelKey: 'nav.dealFinder' as any, icon: 'deals' }, // eslint-disable-line @typescript-eslint/no-explicit-any
  ]},
  { labelKey: 'nav.group.faith', items: [
    { path: '/bible',   labelKey: 'nav.bible',   icon: 'bible' },
    { path: '/worship', labelKey: 'nav.worship', icon: 'worship' },
  ]},
  { labelKey: 'nav.group.family', items: [
    { path: '/baby',      labelKey: 'nav.baby',     icon: 'baby' },
    { path: '/child-dev', labelKey: 'nav.childDev', icon: 'child-dev' },
    { path: '/immigration', labelKey: 'nav.immigration', icon: 'immigration' },
    { path: '/family-games', labelKey: 'nav.familyGames', icon: 'family-games' },
    { path: '/polls', labelKey: 'nav.pollSystem' as any, icon: 'poll-system' }, // eslint-disable-line @typescript-eslint/no-explicit-any
    { path: '/hsa-expenses', labelKey: 'nav.hsaExpenses' as any, icon: 'hsa-expenses' }, // eslint-disable-line @typescript-eslint/no-explicit-any
    { path: '/anniversary', labelKey: 'nav.anniversary' as any, icon: 'anniversary' }, // eslint-disable-line @typescript-eslint/no-explicit-any
  ]},
  { labelKey: 'nav.group.learning', items: [
    { path: '/flashcards', labelKey: 'nav.flashcards', icon: 'flashcards' },
    { path: '/ai',       labelKey: 'nav.ai',      icon: 'ai' },
    { path: '/interview', labelKey: 'nav.interview' as any, icon: 'interview' }, // eslint-disable-line @typescript-eslint/no-explicit-any
    { path: '/benchmark', labelKey: 'nav.benchmark', icon: 'benchmark' },
  ]},
  { labelKey: 'nav.group.workspace', items: [
    { path: '/notebook', labelKey: 'nav.notebook', icon: 'notebook' },
    { path: '/files', labelKey: 'nav.cloudFiles', icon: 'cloud-files' },
    { path: '/library', labelKey: 'nav.digitalLibrary', icon: 'digital-library' },
    { path: '/daily-log', labelKey: 'nav.dailyLog', icon: 'daily-log' },
    { path: '/doc-scanner', labelKey: 'nav.docScanner', icon: 'doc-scanner' },
    { path: '/trips', labelKey: 'nav.tripPlanner' as any, icon: 'trip-planner' }, // eslint-disable-line @typescript-eslint/no-explicit-any
    { path: '/web-crawler', labelKey: 'nav.webCrawler' as any, icon: 'web-crawler' }, // eslint-disable-line @typescript-eslint/no-explicit-any
    { path: '/resume', labelKey: 'nav.resumeTailor' as any, icon: 'resume' }, // eslint-disable-line @typescript-eslint/no-explicit-any
  ]},
  { labelKey: 'nav.group.outdoor', items: [
    { path: '/hiking', labelKey: 'nav.hikingMap', icon: 'hiking' },
    { path: '/travel-map', labelKey: 'nav.travelMap' as any, icon: 'travel-map' }, // eslint-disable-line @typescript-eslint/no-explicit-any
  ]},
];

export const ALL_NAV_ITEMS: NavItem[] = [
  { path: '/', labelKey: 'bottomNav.home', icon: 'home' },
  { path: '/weather', labelKey: 'bottomNav.weather', icon: 'weather' },
  { path: '/stocks', labelKey: 'bottomNav.stocks', icon: 'stocks' },
  { path: '/podcasts', labelKey: 'bottomNav.podcasts', icon: 'podcasts' },
  { path: '/bible', labelKey: 'nav.bible', icon: 'bible' },
  { path: '/worship', labelKey: 'nav.worship', icon: 'worship' },
  { path: '/notebook', labelKey: 'nav.notebook', icon: 'notebook' },
  { path: '/baby', labelKey: 'nav.baby', icon: 'baby' },
  { path: '/child-dev', labelKey: 'nav.childDev', icon: 'child-dev' },
  { path: '/flashcards', labelKey: 'nav.flashcards', icon: 'flashcards' },
  { path: '/daily-log', labelKey: 'nav.dailyLog', icon: 'daily-log' },
  { path: '/files', labelKey: 'nav.cloudFiles', icon: 'cloud-files' },
  { path: '/ai', labelKey: 'nav.ai', icon: 'ai' },
  { path: '/benchmark', labelKey: 'nav.benchmark', icon: 'benchmark' },
  { path: '/immigration', labelKey: 'nav.immigration', icon: 'immigration' },
  { path: '/library', labelKey: 'nav.digitalLibrary', icon: 'digital-library' },
  { path: '/family-games', labelKey: 'nav.familyGames', icon: 'family-games' },
  { path: '/doc-scanner', labelKey: 'nav.docScanner', icon: 'doc-scanner' },
  { path: '/hiking', labelKey: 'nav.hikingMap', icon: 'hiking' },
  { path: '/trips', labelKey: 'nav.tripPlanner' as any, icon: 'trip-planner' }, // eslint-disable-line @typescript-eslint/no-explicit-any
  { path: '/polls', labelKey: 'nav.pollSystem' as any, icon: 'poll-system' }, // eslint-disable-line @typescript-eslint/no-explicit-any
  { path: '/radio', labelKey: 'nav.radio', icon: 'radio' },
  { path: '/interview', labelKey: 'nav.interview' as any, icon: 'interview' }, // eslint-disable-line @typescript-eslint/no-explicit-any
  { path: '/transit', labelKey: 'nav.transit' as any, icon: 'transit' }, // eslint-disable-line @typescript-eslint/no-explicit-any
  { path: '/travel-map', labelKey: 'nav.travelMap' as any, icon: 'travel-map' }, // eslint-disable-line @typescript-eslint/no-explicit-any
  { path: '/deals', labelKey: 'nav.dealFinder' as any, icon: 'deals' }, // eslint-disable-line @typescript-eslint/no-explicit-any
  { path: '/web-crawler', labelKey: 'nav.webCrawler' as any, icon: 'web-crawler' }, // eslint-disable-line @typescript-eslint/no-explicit-any
  { path: '/resume', labelKey: 'nav.resumeTailor' as any, icon: 'resume' }, // eslint-disable-line @typescript-eslint/no-explicit-any
  { path: '/hsa-expenses', labelKey: 'nav.hsaExpenses' as any, icon: 'hsa-expenses' }, // eslint-disable-line @typescript-eslint/no-explicit-any
  { path: '/anniversary', labelKey: 'nav.anniversary' as any, icon: 'anniversary' }, // eslint-disable-line @typescript-eslint/no-explicit-any
];
