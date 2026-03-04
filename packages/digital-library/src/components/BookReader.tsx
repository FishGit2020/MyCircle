import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation, createLogger, StorageKeys, WindowEvents } from '@mycircle/shared';
import TableOfContents from './TableOfContents';
import ReaderControls from './ReaderControls';
import BrowserTTS from './BrowserTTS';
import ConversionStatus from './ConversionStatus';
import AudioPlayer from './AudioPlayer';

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
  language: string;
  audioStatus: 'none' | 'processing' | 'complete' | 'error';
  audioProgress: number;
  onBack: () => void;
}

export default function BookReader({ bookId, epubUrl, title, chapters, language, audioStatus, audioProgress, onBack }: BookReaderProps) {
  const { t } = useTranslation();
  const viewerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<any>(null);
  const bookRef = useRef<any>(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [tocOpen, setTocOpen] = useState(false);
  const [ttsText, setTtsText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAudioPlayer, setShowAudioPlayer] = useState(audioStatus === 'complete');
  const [readerExpanded, setReaderExpanded] = useState(audioStatus !== 'complete');
  const [bookmarks, setBookmarks] = useState<BookBookmark[]>([]);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const spineItemsRef = useRef<Array<{ href: string; index: number }>>([]);

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
          spread: 'none',
          flow: 'scrolled-doc',
        });

        renditionRef.current = rendition;

        rendition.themes.fontSize(`${fontSize}px`);
        rendition.themes.default({
          body: {
            'font-family': 'Georgia, serif',
            'line-height': '1.8',
            'max-width': '800px',
            margin: '0 auto',
            padding: '1rem',
          },
        });

        // Apply dark mode if active
        if (document.documentElement.classList.contains('dark')) {
          rendition.themes.default({
            body: {
              color: '#e5e7eb',
              background: '#1f2937',
              'font-family': 'Georgia, serif',
              'line-height': '1.8',
              'max-width': '800px',
              margin: '0 auto',
              padding: '1rem',
            },
            a: { color: '#60a5fa' },
          });
        }

        await rendition.display();
        if (cancelled) return;
        setLoading(false);

        // Build spine mapping for TOC navigation
        try {
          if (book.spine && book.spine.spineItems) {
            spineItemsRef.current = book.spine.spineItems.map((item: any, idx: number) => ({
              href: item.href,
              index: idx,
            }));
          }
        } catch { /* ignore */ }

        // Extract text for TTS
        rendition.on('relocated', async (location: any) => {
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

          // Find current chapter index
          if (location?.start?.href) {
            const idx = chapters.findIndex(ch => location.start.href.includes(ch.href.split('#')[0]));
            if (idx >= 0) setCurrentChapter(idx);
          }
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
  }, [epubUrl, chapters]);

  // Update font size
  useEffect(() => {
    if (renditionRef.current) {
      renditionRef.current.themes.fontSize(`${fontSize}px`);
    }
  }, [fontSize]);

  const goToChapter = useCallback((index: number) => {
    if (!renditionRef.current || !chapters[index]) return;
    // Try epubjs spine item first (more reliable than Firestore chapter href)
    const spineItem = spineItemsRef.current[index];
    if (spineItem) {
      renditionRef.current.display(spineItem.href);
    } else {
      // Fallback to Firestore chapter href
      renditionRef.current.display(chapters[index].href);
    }
    setCurrentChapter(index);
    setTocOpen(false);
  }, [chapters]);

  const goNext = useCallback(() => {
    if (renditionRef.current) renditionRef.current.next();
  }, []);

  const goPrev = useCallback(() => {
    if (renditionRef.current) renditionRef.current.prev();
  }, []);

  const increaseFontSize = useCallback(() => {
    setFontSize(prev => Math.min(prev + 2, 32));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize(prev => Math.max(prev - 2, 10));
  }, []);

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
      renditionRef.current.display(cfi);
      setBookmarksOpen(false);
    }
  }, []);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div ref={containerRef} className={`flex flex-col pb-20 md:pb-8 ${isFullscreen ? 'fixed inset-0 z-[100] bg-white dark:bg-gray-800 p-4 overflow-auto' : 'h-[calc(100vh-8rem)]'}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        <button
          type="button"
          onClick={isFullscreen ? toggleFullscreen : onBack}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={isFullscreen ? t('library.exitFullscreen') : t('library.backToLibrary')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate flex-1">{title}</h2>

        {/* Bookmark button */}
        <div className="relative">
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
      </div>

      {/* Collapsible reader section */}
      {showAudioPlayer && (
        <button
          type="button"
          onClick={() => setReaderExpanded(!readerExpanded)}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition mb-2 min-h-[44px]"
        >
          <svg className={`w-4 h-4 transition-transform ${readerExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          {readerExpanded ? t('library.tableOfContents') : t('library.readNow')}
        </button>
      )}

      {readerExpanded && (
        <>
          <div className="flex flex-1 gap-4 overflow-hidden relative">
            {/* TOC Sidebar */}
            {tocOpen && (
              <TableOfContents
                chapters={chapters}
                currentChapter={currentChapter}
                onSelect={goToChapter}
                onClose={() => setTocOpen(false)}
              />
            )}

            {/* Reader */}
            <div className="flex-1 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 relative">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
              )}
              <div ref={viewerRef} className="w-full h-full overflow-auto" />
            </div>
          </div>

          {/* Reader Controls */}
          <div className="flex-shrink-0 mt-4 space-y-3">
            <ReaderControls
              onPrev={goPrev}
              onNext={goNext}
              onFontIncrease={increaseFontSize}
              onFontDecrease={decreaseFontSize}
              fontSize={fontSize}
              currentChapter={currentChapter}
              totalChapters={chapters.length}
            />
            <BrowserTTS text={ttsText} />
          </div>
        </>
      )}

      {/* Audio controls (always visible) */}
      <div className="flex-shrink-0 mt-4 space-y-3">
        <ConversionStatus
          bookId={bookId}
          language={language}
          initialStatus={audioStatus}
          initialProgress={audioProgress}
          onComplete={() => setShowAudioPlayer(true)}
          onConvert={async (voiceName: string) => {
            const token = await window.__getFirebaseIdToken?.();
            if (!token) return undefined;
            const apiBase = window.__digitalLibraryApiBase?.() || '';
            return fetch(`${apiBase}/digital-library-api/convert-to-audio`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ bookId, voiceName }),
            });
          }}
        />
        {showAudioPlayer && (
          <AudioPlayer chapters={chapters} bookTitle={title} bookId={bookId} />
        )}
      </div>
    </div>
  );
}
