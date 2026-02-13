import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation, StorageKeys } from '@mycircle/shared';
import type { WorshipSong } from '../types';
import { transposeContent, transposeChord } from '../utils/transpose';
import ChordLine from './ChordLine';
import Metronome from './Metronome';

const ALL_KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const SCROLL_SPEEDS = [20, 30, 40, 50, 70, 100]; // ms per 1px — lower = faster
const DEFAULT_SCROLL_SPEED = 50;

function getKeyName(originalKey: string, semitones: number): string {
  if (semitones === 0) return originalKey;
  return transposeChord(originalKey, semitones);
}

function semitonesToKey(originalKey: string, targetKey: string): number {
  const normalize: Record<string, string> = { 'Db': 'C#', 'D#': 'Eb', 'Gb': 'F#', 'G#': 'Ab', 'A#': 'Bb' };
  const orig = normalize[originalKey] ?? originalKey;
  const tgt = normalize[targetKey] ?? targetKey;
  const fromIdx = ALL_KEYS.indexOf(orig);
  const toIdx = ALL_KEYS.indexOf(tgt);
  if (fromIdx === -1 || toIdx === -1) return 0;
  return ((toIdx - fromIdx) + 12) % 12;
}

function loadScrollSpeed(): number {
  try {
    const stored = localStorage.getItem(StorageKeys.WORSHIP_SCROLL_SPEED);
    if (stored) { const n = parseInt(stored, 10); if (SCROLL_SPEEDS.includes(n)) return n; }
  } catch { /* */ }
  return DEFAULT_SCROLL_SPEED;
}

function saveScrollSpeed(speed: number) {
  try { localStorage.setItem(StorageKeys.WORSHIP_SCROLL_SPEED, String(speed)); } catch { /* */ }
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
  const [scrollSpeed, setScrollSpeed] = useState(loadScrollSpeed);
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isChordPro = song.format === 'chordpro';
  const transposedContent = isChordPro ? transposeContent(song.content, semitones) : song.content;
  const currentKey = isChordPro ? getKeyName(song.originalKey, semitones) : song.originalKey;

  // Auto-scroll with adjustable speed
  useEffect(() => {
    if (autoScroll) {
      scrollIntervalRef.current = setInterval(() => {
        window.scrollBy({ top: 1, behavior: 'auto' });
      }, scrollSpeed);
    } else if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    return () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    };
  }, [autoScroll, scrollSpeed]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleCopyLyrics = useCallback(async () => {
    try {
      // Strip ChordPro bracket notation for clean lyrics
      const clean = isChordPro
        ? transposedContent.replace(/\[([^\]]+)\]/g, '').replace(/\n{3,}/g, '\n\n')
        : song.content;
      await navigator.clipboard.writeText(`${song.title}\n${song.artist ? `${song.artist}\n` : ''}\n${clean}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* */ }
  }, [song, transposedContent, isChordPro]);

  const handleTargetKeyChange = useCallback((targetKey: string) => {
    setSemitones(semitonesToKey(song.originalKey, targetKey));
  }, [song.originalKey]);

  const handleScrollSpeedChange = useCallback((speed: number) => {
    setScrollSpeed(speed);
    saveScrollSpeed(speed);
  }, []);

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-4" data-print-hide>
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
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700" data-print-hide>
        {/* Transpose controls — only for ChordPro */}
        {isChordPro ? (
          <div className="flex items-center gap-2 flex-wrap">
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

            {/* Direct key picker */}
            <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-gray-200 dark:border-gray-700">
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('worship.targetKey')}:</span>
              <select
                value={currentKey}
                onChange={e => handleTargetKeyChange(e.target.value)}
                className="px-1.5 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                {ALL_KEYS.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">
            {t('worship.noTransposeText')}
          </p>
        )}

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {/* Copy lyrics */}
          <button
            onClick={handleCopyLyrics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t('worship.copied')}
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {t('worship.copyLyrics')}
              </>
            )}
          </button>

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

          {/* Scroll speed (visible when auto-scroll is active) */}
          {autoScroll && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('worship.scrollSpeed')}:</span>
              <input
                type="range"
                min={0}
                max={SCROLL_SPEEDS.length - 1}
                value={SCROLL_SPEEDS.indexOf(scrollSpeed)}
                onChange={e => handleScrollSpeedChange(SCROLL_SPEEDS[parseInt(e.target.value)])}
                className="w-16 h-1.5 accent-green-500"
                aria-label={t('worship.scrollSpeed')}
              />
            </div>
          )}

          {/* YouTube link */}
          {song.youtubeUrl && (
            <a
              href={song.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              {t('worship.watchOnYoutube')}
            </a>
          )}

          {/* Print */}
          <button
            onClick={handlePrint}
            aria-label={t('worship.print')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            {t('worship.print')}
          </button>
        </div>
      </div>

      {/* Metronome */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700" data-print-hide>
        <Metronome initialBpm={song.bpm} />
      </div>

      {/* Song content */}
      <div ref={contentRef} className="mb-8" data-print-show>
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
