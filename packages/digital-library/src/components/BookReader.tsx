import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation, createLogger, StorageKeys, WindowEvents, useMutation, SUBMIT_CHAPTER_CONVERSIONS } from '@mycircle/shared';
import { useSearchParams } from 'react-router';
import TableOfContents from './TableOfContents';
import ReaderControls from './ReaderControls';
import BrowserTTS from './BrowserTTS';
import ConversionStatus from './ConversionStatus';
import ChapterConvertList from './ChapterConvertList';
import TtsQuotaBar from './TtsQuotaBar';
import useSwipe from '../hooks/useSwipe';
import { useReaderTheme } from '../hooks/useReaderTheme';
import { useReadingProgress } from '../hooks/useReadingProgress';

interface BookBookmark {
  bookId: string;
  bookTitle: string;
  cfi: string;
  label: string;
  createdAt: number;
}

const logger = createLogger('BookReader');

interface Chapter {
  index: number;
  title: string;
  href: string;
  characterCount: number;
  audioUrl?: string;
}

interface BookReaderProps {
  bookId: string;
  epubUrl: string;
  title: string;
  chapters: Chapter[];
  coverUrl?: string;
  language: string;
  audioStatus: 'none' | 'processing' | 'paused' | 'complete' | 'error';
  audioProgress: number;
  epubNasArchived?: boolean;
  zipStatus?: 'none' | 'processing' | 'ready' | 'error';
  zipUrl?: string;
  zipSize?: number;
  zipGeneratedAt?: string;
  zipError?: string;
  onBack: () => void;
  onRefreshChapters?: () => Promise<void>;
  onRefreshBook?: () => Promise<void>;
}

export default function BookReader({ bookId, epubUrl, title, chapters, coverUrl, language, audioStatus, audioProgress, epubNasArchived, zipStatus, zipUrl, zipSize, zipGeneratedAt, zipError, onBack: _onBack, onRefreshChapters, onRefreshBook }: BookReaderProps) {
  const { t } = useTranslation();
  const [submitConversions] = useMutation(SUBMIT_CHAPTER_CONVERSIONS);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'listen' ? 'listen' : 'read';
  const autoPlayOnMount = searchParams.get('autoPlay') === '1';
  const viewerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const bookRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [currentChapter, setCurrentChapter] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [tocOpen, setTocOpen] = useState(false);
  const [ttsText, setTtsText] = useState('');
  const [loading, setLoading] = useState(true);
  const [_readerExpanded, _setReaderExpanded] = useState(true);
  const [bookmarks, setBookmarks] = useState<BookBookmark[]>([]);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'read' | 'listen'>(initialTab);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [pageInfo, setPageInfo] = useState<{ page: number; total: number } | undefined>();
  const { theme, setTheme, applyTheme } = useReaderTheme();
  const { saveProgress, getProgress } = useReadingProgress();
  const containerRef = useRef<HTMLDivElement>(null);
  const bookmarksRef = useRef<HTMLDivElement>(null);
  const tocButtonRef = useRef<HTMLButtonElement>(null);
  const tocPanelRef = useRef<HTMLDivElement>(null);

  // Sync activeTab when URL search params change (e.g. audio pill navigation)
  useEffect(() => {
    const tab = searchParams.get('tab') === 'listen' ? 'listen' : 'read';
    setActiveTab(tab);
  }, [searchParams]);

  // Close bookmark and TOC dropdowns on outside click.
  // Also listen on the EPUB iframe's contentDocument (clicks inside the
  // iframe don't bubble to the parent document).
  useEffect(() => {
    if (!bookmarksOpen && !tocOpen) return;
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (bookmarksOpen && bookmarksRef.current && !bookmarksRef.current.contains(target)) {
        setBookmarksOpen(false);
      }
      if (tocOpen &&
        tocButtonRef.current && !tocButtonRef.current.contains(target) &&
        tocPanelRef.current && !tocPanelRef.current.contains(target)) {
        setTocOpen(false);
      }
    }
    // Close unconditionally when the user clicks inside the EPUB iframe
    function handleIframeMouseDown() {
      if (bookmarksOpen) setBookmarksOpen(false);
      if (tocOpen) setTocOpen(false);
    }
    document.addEventListener('mousedown', handleMouseDown);
    // Attach to all iframes inside the viewer (epubjs creates them)
    const iframes = viewerRef.current?.querySelectorAll('iframe') ?? [];
    iframes.forEach(iframe => {
      try { iframe.contentDocument?.addEventListener('mousedown', handleIframeMouseDown); } catch { /* cross-origin */ }
    });
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      iframes.forEach(iframe => {
        try { iframe.contentDocument?.removeEventListener('mousedown', handleIframeMouseDown); } catch { /* cross-origin */ }
      });
    };
  }, [bookmarksOpen, tocOpen]);

  // Sync activeTab to URL search param
  const handleTabChange = useCallback((tab: 'read' | 'listen') => {
    setActiveTab(tab);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      next.delete('autoPlay');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Keep GlobalAudioPlayer visible on Listen tab — ChapterConvertList
  // triggers playback via eventBus, the global player handles the UI
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(WindowEvents.BOOK_LISTEN_TAB_ACTIVE, { detail: false }));
    return () => {
      window.dispatchEvent(new CustomEvent(WindowEvents.BOOK_LISTEN_TAB_ACTIVE, { detail: false }));
    };
  }, [activeTab]);
  const _spineItemsRef = useRef<Array<{ href: string; index: number }>>([]);

  // Initialize EPUB renderer
  useEffect(() => {
    let cancelled = false;

    async function initEpub() {
      if (!viewerRef.current || !epubUrl) return;

      try {
        const ePub = (await import('epubjs')).default;
        const book = ePub(epubUrl);
        bookRef.current = book;

        const rendition = book.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
          spread: 'auto',
          flow: 'paginated',
          minSpreadWidth: 900,
        });

        renditionRef.current = rendition;

        rendition.themes.fontSize(`${fontSize}px`);
        const isDark = document.documentElement.classList.contains('dark');
        applyTheme(rendition, isDark);

        // Restore saved reading position unless navigating to a specific chapter
        const hasChapterParam = new URLSearchParams(window.location.search).has('chapter');
        const savedProgress = !hasChapterParam ? getProgress(bookId) : null;
        await rendition.display(savedProgress?.cfi ?? undefined);
        if (cancelled) return;
        setLoading(false);

        // Wait for spine to be ready (needed for goToChapter)
        try { await book.loaded.spine; } catch { /* ignore */ }

        // Extract text for TTS + page info + save reading progress
        rendition.on('relocated', async (location: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          if (cancelled) return;
          try {
            const contents = rendition.getContents();
            if (contents && contents[0]) {
              const doc = contents[0].document;
              const text = doc?.body?.innerText || '';
              setTtsText(text);
            }
          } catch (err) {
            logger.error('Failed to extract text for TTS', err);
          }

          // Page info from epubjs
          try {
            const displayed = location?.start?.displayed;
            if (displayed) {
              setPageInfo({ page: displayed.page, total: displayed.total });
            }
          } catch { /* ignore */ }

          // Find current chapter index
          let chapterIdx = -1;
          if (location?.start?.href) {
            chapterIdx = chapters.findIndex(ch => location.start.href.includes(ch.href.split('#')[0]));
            if (chapterIdx >= 0) setCurrentChapter(chapterIdx);
          }

          // Save reading progress (CFI + percent)
          try {
            const cfi = location?.start?.cfi;
            const percent = location?.start?.percentage != null
              ? Math.round(location.start.percentage * 100)
              : 0;
            if (cfi) {
              saveProgress(bookId, cfi, chapterIdx >= 0 ? chapterIdx : 0, percent);
            }
          } catch { /* ignore */ }
        });
      } catch (err) {
        logger.error('Failed to initialize EPUB', err);
        if (!cancelled) setLoading(false);
      }
    }

    initEpub();
    return () => {
      cancelled = true;
      if (bookRef.current) {
        try { bookRef.current.destroy(); } catch { /* ignore */ }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epubUrl, bookId, chapters]);

  // ResizeObserver — re-fit rendition on container resize (fullscreen, window resize)
  useEffect(() => {
    const el = viewerRef.current;
    const rendition = renditionRef.current;
    if (!el || !rendition) return;

    const ro = new ResizeObserver(() => {
      try { rendition.resize(); } catch { /* ignore */ }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading]); // re-run after loading completes (rendition exists)

  // MutationObserver — watch <html> class for dark mode toggle
  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;

    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      applyTheme(rendition, isDark);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [loading, applyTheme]);

  // Re-apply theme when user switches theme
  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;
    const isDark = document.documentElement.classList.contains('dark');
    applyTheme(rendition, isDark);
  }, [theme, applyTheme]);

  // Update font size — inject !important CSS to override EPUB inline styles
  useEffect(() => {
    const r = renditionRef.current;
    if (!r) return;
    r.themes.fontSize(`${fontSize}px`);
    // Force CSS override on all text elements inside the EPUB iframe
    r.hooks?.content?.register((contents: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      contents.addStylesheetRules({ 'body, body *': { 'font-size': `${fontSize}px !important` } });
    });
    // Re-display current location to apply the new size
    const loc = r.location;
    if (loc?.start?.cfi) {
      r.display(loc.start.cfi).catch((err: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        logger.error('Failed to re-display after font change', err);
      });
    }
  }, [fontSize]);

  const goToChapter = useCallback((index: number) => {
    if (!renditionRef.current || !chapters[index]) return;
    // Try multiple strategies to navigate to the chapter:
    // 1. Spine section href (epubjs internal)
    // 2. Spine index as number (epubjs accepts numeric spine position)
    // 3. Firestore chapter href (from epub2 backend)
    const book = bookRef.current;
    const section = book?.spine?.get?.(index);
    const target = section?.href || index;
    renditionRef.current.display(target).then(() => {
      setCurrentChapter(index);
      setTocOpen(false);
    }).catch(() => {
      // Spine-based navigation failed, try chapter href from Firestore
      const chapterHref = chapters[index].href;
      if (chapterHref) {
        renditionRef.current!.display(chapterHref).then(() => {
          setCurrentChapter(index);
          setTocOpen(false);
        }).catch((err: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          logger.error('All chapter navigation methods failed', { index, target, chapterHref, err });
          // Still update UI even if display fails
          setCurrentChapter(index);
          setTocOpen(false);
        });
      } else {
        setCurrentChapter(index);
        setTocOpen(false);
      }
    });
  }, [chapters]);

  const goNext = useCallback(() => {
    if (!loading && renditionRef.current) renditionRef.current.next()?.catch?.(() => {});
  }, [loading]);

  const goPrev = useCallback(() => {
    if (!loading && renditionRef.current) renditionRef.current.prev()?.catch?.(() => {});
  }, [loading]);

  const increaseFontSize = useCallback(() => {
    setFontSize(prev => Math.min(prev + 2, 32));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize(prev => Math.max(prev - 2, 10));
  }, []);

  // Tap zones: left 25% = prev, right 25% = next, center = toggle controls
  const handleReaderClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;

    if (ratio < 0.25) {
      goPrev();
    } else if (ratio > 0.75) {
      goNext();
    } else {
      setControlsVisible(v => !v);
    }
  }, [goPrev, goNext]);

  // Swipe gestures for mobile
  useSwipe(viewerRef, { onSwipeLeft: goNext, onSwipeRight: goPrev });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'read') return;
      if (e.key === 'ArrowLeft') { goPrev(); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { goNext(); e.preventDefault(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, goPrev, goNext]);

  // Load bookmarks from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(StorageKeys.BOOK_BOOKMARKS);
      if (stored) {
        const all: BookBookmark[] = JSON.parse(stored);
        setBookmarks(all.filter(b => b.bookId === bookId));
      }
    } catch { /* ignore */ }
  }, [bookId]);

  const addBookmark = useCallback(() => {
    if (!renditionRef.current) return;
    try {
      const location = renditionRef.current.currentLocation();
      const cfi = location?.start?.cfi;
      if (!cfi) return;
      const label = chapters[currentChapter]?.title || `Page ${currentChapter + 1}`;
      const newBookmark: BookBookmark = { bookId, bookTitle: title, cfi, label, createdAt: Date.now() };
      const stored = localStorage.getItem(StorageKeys.BOOK_BOOKMARKS);
      const all: BookBookmark[] = stored ? JSON.parse(stored) : [];
      // Avoid duplicates by CFI
      if (all.some(b => b.cfi === cfi && b.bookId === bookId)) return;
      const updated = [...all, newBookmark];
      localStorage.setItem(StorageKeys.BOOK_BOOKMARKS, JSON.stringify(updated));
      setBookmarks(updated.filter(b => b.bookId === bookId));
      window.dispatchEvent(new Event(WindowEvents.BOOK_BOOKMARKS_CHANGED));
    } catch (err) {
      logger.error('Failed to add bookmark', err);
    }
  }, [bookId, title, chapters, currentChapter]);

  const removeBookmark = useCallback((cfi: string) => {
    try {
      const stored = localStorage.getItem(StorageKeys.BOOK_BOOKMARKS);
      const all: BookBookmark[] = stored ? JSON.parse(stored) : [];
      const updated = all.filter(b => !(b.bookId === bookId && b.cfi === cfi));
      localStorage.setItem(StorageKeys.BOOK_BOOKMARKS, JSON.stringify(updated));
      setBookmarks(updated.filter(b => b.bookId === bookId));
      window.dispatchEvent(new Event(WindowEvents.BOOK_BOOKMARKS_CHANGED));
    } catch { /* ignore */ }
  }, [bookId]);

  const goToBookmark = useCallback((cfi: string) => {
    if (renditionRef.current) {
      renditionRef.current.display(cfi).catch((err: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        logger.error('Failed to navigate to bookmark', err);
      });
      setBookmarksOpen(false);
    }
  }, []);

  // Fullscreen (with Safari webkit prefix fallback)
  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!el) return;
    const fsElement = document.fullscreenElement ?? (document as any).webkitFullscreenElement; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!fsElement) {
      const request = el.requestFullscreen ?? el.webkitRequestFullscreen;
      request?.call(el)?.catch?.(() => {});
    } else {
      const exit = document.exitFullscreen ?? (document as any).webkitExitFullscreen; // eslint-disable-line @typescript-eslint/no-explicit-any
      exit?.call(document)?.catch?.(() => {});
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!(document.fullscreenElement ?? (document as any).webkitFullscreenElement)); // eslint-disable-line @typescript-eslint/no-explicit-any
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Broadcast breadcrumb detail to shell
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(WindowEvents.BREADCRUMB_DETAIL, { detail: title }));
    return () => {
      window.dispatchEvent(new CustomEvent(WindowEvents.BREADCRUMB_DETAIL, { detail: null }));
    };
  }, [title]);

  return (
    <div ref={containerRef} className={`flex flex-col flex-grow min-h-0 ${isFullscreen ? 'fixed inset-0 z-[100] bg-white dark:bg-gray-800 p-4 overflow-auto' : ''}`}>
      {/* Header actions */}
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate flex-1">{title}</h2>

        {activeTab === 'read' && (<>
        {/* Bookmark button */}
        <div className="relative" ref={bookmarksRef}>
          <button
            type="button"
            onClick={() => setBookmarksOpen(!bookmarksOpen)}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={t('library.bookmarks')}
            aria-expanded={bookmarksOpen}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            {bookmarks.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-blue-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {bookmarks.length}
              </span>
            )}
          </button>

          {/* Bookmark dropdown */}
          {bookmarksOpen && (
            <div className="absolute right-0 top-12 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{t('library.bookmarks')}</span>
                <button
                  type="button"
                  onClick={addBookmark}
                  className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition min-h-[36px]"
                >
                  {t('library.addBookmark')}
                </button>
              </div>
              {bookmarks.length === 0 ? (
                <p className="p-3 text-xs text-gray-500 dark:text-gray-400">{t('library.noBookmarks')}</p>
              ) : (
                bookmarks.map((bm) => (
                  <div key={bm.cfi} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <button
                      type="button"
                      onClick={() => goToBookmark(bm.cfi)}
                      className="flex-1 text-left text-sm text-gray-800 dark:text-gray-200 truncate min-h-[36px] flex items-center"
                    >
                      {bm.label}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBookmark(bm.cfi)}
                      className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex-shrink-0 min-h-[36px] flex items-center px-1"
                      aria-label={t('library.removeBookmark')}
                    >
                      {t('library.removeBookmark')}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* TOC button */}
        <button
          ref={tocButtonRef}
          type="button"
          onClick={() => setTocOpen(!tocOpen)}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={t('library.tableOfContents')}
          aria-expanded={tocOpen}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>

        {/* Theme picker */}
        <div className="flex items-center gap-0.5" role="group" aria-label={t('library.readingTheme' as any)}> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          <button
            type="button"
            onClick={() => setTheme('default')}
            className={`w-6 h-6 rounded-full border-2 transition ${theme === 'default' ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-200`}
            aria-label={t('library.themeDefault' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
            aria-pressed={theme === 'default'}
          />
          <button
            type="button"
            onClick={() => setTheme('sepia')}
            className={`w-6 h-6 rounded-full border-2 transition ${theme === 'sepia' ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}
            style={{ background: '#f4ecd8' }}
            aria-label={t('library.themeSepia' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
            aria-pressed={theme === 'sepia'}
          />
          <button
            type="button"
            onClick={() => setTheme('night')}
            className={`w-6 h-6 rounded-full border-2 transition ${theme === 'night' ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}
            style={{ background: '#1a1a2e' }}
            aria-label={t('library.themeNight' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
            aria-pressed={theme === 'night'}
          />
        </div>

        {/* Fullscreen button */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={isFullscreen ? t('library.exitFullscreen') : t('library.fullscreen')}
        >
          {isFullscreen ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
          )}
        </button>
        </>)}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 flex-shrink-0 border-b border-gray-200 dark:border-gray-700" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'read'}
          onClick={() => handleTabChange('read')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === 'read'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {t('library.tabRead' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'listen'}
          onClick={() => handleTabChange('listen')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === 'listen'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {t('library.tabListen' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </button>
      </div>

      {/* Read tab — kept mounted so epubjs state persists */}
      <div className={activeTab === 'read' ? 'flex flex-col flex-1 min-h-0' : 'hidden'} role="tabpanel">
        {!epubUrl && epubNasArchived ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center px-4">
            <svg className="w-12 h-12 text-orange-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('library.nas.epubOffloadedNotice')}</p>
          </div>
        ) : (
        <>
        <div className="flex flex-1 min-h-0 gap-4 overflow-hidden relative">
          {/* TOC Sidebar */}
          {tocOpen && (
            <div ref={tocPanelRef}>
              <TableOfContents
                chapters={chapters}
                currentChapter={currentChapter}
                onSelect={goToChapter}
                onClose={() => setTocOpen(false)}
              />
            </div>
          )}

          {/* Reader */}
          <div className="flex-1 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            )}
            {/* Tap zone overlay */}
            <div
              className="absolute inset-0 z-10 cursor-pointer"
              onClick={handleReaderClick}
              aria-hidden="true"
            />
            <div ref={viewerRef} className="w-full h-full overflow-hidden" />

            {/* Controls overlay inside reader pane */}
            <ReaderControls
              onPrev={goPrev}
              onNext={goNext}
              onFontIncrease={increaseFontSize}
              onFontDecrease={decreaseFontSize}
              fontSize={fontSize}
              currentChapter={currentChapter}
              totalChapters={chapters.length}
              pageInfo={pageInfo}
              visible={controlsVisible}
            />
          </div>
        </div>

        {/* BrowserTTS below reader */}
        <div className="flex-shrink-0 mt-3">
          <BrowserTTS text={ttsText} />
        </div>
        </>
        )}
      </div>

      {/* Listen tab */}
      {activeTab === 'listen' && (
        <div className="flex-1 overflow-auto space-y-4" role="tabpanel">
          <TtsQuotaBar />
          <ConversionStatus
            bookId={bookId}
            language={language}
            initialStatus={audioStatus}
            initialProgress={audioProgress}
            epubOffloaded={epubNasArchived && !epubUrl}
            onComplete={() => { /* chapters refetch handles UI update */ }}
            onConvert={async (voiceName: string) => {
              // Submit all unconverted chapters to the conversion queue
              const unconverted = chapters.filter(ch => !ch.audioUrl).map(ch => ch.index);
              if (unconverted.length === 0) return;
              await submitConversions({ variables: { bookId, chapterIndices: unconverted, voiceName } });
            }}
          />

          {/* Per-chapter conversion list — always visible so users can convert individual chapters */}
          <ChapterConvertList
            bookId={bookId}
            bookTitle={title}
            coverUrl={coverUrl}
            chapters={chapters}
            autoPlay={autoPlayOnMount}
            initialChapter={searchParams.get('chapter') != null ? Number(searchParams.get('chapter')) : undefined}
            voiceName={(() => {
              const lc = (language || 'en').startsWith('zh') ? 'cmn-CN' : (language || 'en').startsWith('es') ? 'es-US' : 'en-US';
              return `${lc}-Wavenet-${lc === 'en-US' ? 'D' : 'A'}`;
            })()}
            zipStatus={zipStatus}
            zipUrl={zipUrl}
            zipSize={zipSize}
            zipGeneratedAt={zipGeneratedAt}
            zipError={zipError}
            onRefreshBook={onRefreshBook}
            epubOffloaded={epubNasArchived && !epubUrl}
            onChapterConverted={async () => {
              await onRefreshChapters?.();
            }}
          />

        </div>
      )}
    </div>
  );
}
