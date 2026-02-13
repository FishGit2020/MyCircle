import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '@weather/shared';
import type { WorshipSong } from '../types';
import { transposeContent, transposeChord } from '../utils/transpose';
import ChordLine from './ChordLine';

function getKeyName(originalKey: string, semitones: number): string {
  if (semitones === 0) return originalKey;
  return transposeChord(originalKey, semitones);
}

interface SongViewerProps {
  song: WorshipSong;
  isAuthenticated: boolean;
  onEdit: () => void;
  onBack: () => void;
}

export default function SongViewer({ song, isAuthenticated, onEdit, onBack }: SongViewerProps) {
  const { t } = useTranslation();
  const [semitones, setSemitones] = useState(0);
  const [notesOpen, setNotesOpen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isChordPro = song.format === 'chordpro';
  const transposedContent = isChordPro ? transposeContent(song.content, semitones) : song.content;
  const currentKey = isChordPro ? getKeyName(song.originalKey, semitones) : song.originalKey;

  // Auto-scroll
  useEffect(() => {
    if (autoScroll) {
      scrollIntervalRef.current = setInterval(() => {
        window.scrollBy({ top: 1, behavior: 'auto' });
      }, 50);
    } else if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    return () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    };
  }, [autoScroll]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
          title={t('worship.back')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm text-gray-500 dark:text-gray-400">{t('worship.back')}</span>
      </div>

      {/* Song header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{song.title}</h2>
            {song.artist && (
              <p className="text-gray-500 dark:text-gray-400 mt-1">{song.artist}</p>
            )}
          </div>
          {isAuthenticated && (
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t('worship.editSong')}
            </button>
          )}
        </div>

        {/* Meta badges */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
            {t('worship.currentKey')}: {currentKey}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isChordPro
              ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}>
            {isChordPro ? t('worship.formatChordpro') : t('worship.formatText')}
          </span>
          {song.tags?.map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        {/* Transpose controls — only for ChordPro */}
        {isChordPro ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('worship.transpose')}:</span>
            <button
              onClick={() => setSemitones(s => s - 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm font-bold"
              title={t('worship.semitoneDown')}
            >
              -
            </button>
            <span className="text-sm font-mono w-8 text-center text-gray-700 dark:text-gray-300">
              {semitones > 0 ? `+${semitones}` : semitones}
            </span>
            <button
              onClick={() => setSemitones(s => s + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm font-bold"
              title={t('worship.semitoneUp')}
            >
              +
            </button>
            {semitones !== 0 && (
              <button
                onClick={() => setSemitones(0)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline ml-1"
              >
                {t('worship.resetKey')}
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">
            {t('worship.noTransposeText')}
          </p>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              autoScroll
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            {t('worship.autoScroll')}
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            {t('worship.print')}
          </button>
        </div>
      </div>

      {/* Song content */}
      <div ref={contentRef} className="mb-8">
        {isChordPro ? (
          <div className="space-y-1">
            {transposedContent.split('\n').map((line, i) => (
              <ChordLine key={i} line={line} />
            ))}
          </div>
        ) : (
          <pre className="font-mono text-sm leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap overflow-x-auto">
            {song.content}
          </pre>
        )}
      </div>

      {/* Notes section (collapsible) */}
      {song.notes && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <button
            onClick={() => setNotesOpen(!notesOpen)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
          >
            <svg
              className={`w-4 h-4 transition-transform ${notesOpen ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {t('worship.notes')}
          </button>
          {notesOpen && (
            <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800/30">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{song.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
