import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation, createLogger } from '@mycircle/shared';
import TableOfContents from './TableOfContents';
import ReaderControls from './ReaderControls';
import BrowserTTS from './BrowserTTS';
import ConversionStatus from './ConversionStatus';
import AudioPlayer from './AudioPlayer';

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
    renditionRef.current.display(chapters[index].href);
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

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] pb-20 md:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={t('library.backToLibrary')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate flex-1">{title}</h2>
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
      </div>

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

      {/* Controls */}
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
          <AudioPlayer chapters={chapters} bookTitle={title} />
        )}
      </div>
    </div>
  );
}
