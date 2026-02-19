import React, { useState } from 'react';
import { useTranslation } from '@mycircle/shared';

interface VersePickerProps {
  passageText: string;
  reference: string;
  book: string;
  chapter: number;
  onAddCards: (cards: Array<{ front: string; back: string; reference: string; verseRange: string }>) => void;
  onBack: () => void;
}

function splitVerses(text: string): Array<{ num: number; text: string }> {
  const verses: Array<{ num: number; text: string }> = [];
  // Split by verse numbers like "[1]" or "1 " at start of lines
  const parts = text.split(/\[(\d+)\]\s*/);
  for (let i = 1; i < parts.length; i += 2) {
    const num = parseInt(parts[i], 10);
    const content = (parts[i + 1] || '').trim();
    if (content) {
      verses.push({ num, text: content });
    }
  }
  // Fallback: split by newlines if no verse markers found
  if (verses.length === 0) {
    text.split('\n').forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed) {
        verses.push({ num: idx + 1, text: trimmed });
      }
    });
  }
  return verses;
}

function getFirstLetters(text: string): string {
  return text
    .split(/\s+/)
    .map(word => word.charAt(0))
    .join(' ');
}

export default function VersePicker({ passageText, reference, book, chapter, onAddCards, onBack }: VersePickerProps) {
  const { t } = useTranslation();
  const verses = splitVerses(passageText);
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());

  const toggleVerse = (num: number) => {
    setSelectedVerses(prev => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedVerses(new Set(verses.map(v => v.num)));
  };

  const handleAdd = () => {
    if (selectedVerses.size === 0) return;
    const sorted = [...selectedVerses].sort((a, b) => a - b);
    const selectedText = verses
      .filter(v => selectedVerses.has(v.num))
      .map(v => v.text)
      .join(' ');

    const verseRange = sorted.length === 1
      ? String(sorted[0])
      : `${sorted[0]}-${sorted[sorted.length - 1]}`;
    const ref = `${book} ${chapter}:${verseRange}`;

    onAddCards([
      {
        front: getFirstLetters(selectedText),
        back: selectedText,
        reference: ref,
        verseRange,
      },
      {
        front: ref,
        back: selectedText,
        reference: ref,
        verseRange,
      },
    ]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← {t('flashcards.selectChapter')}
        </button>
        <button
          type="button"
          onClick={selectAll}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Select All
        </button>
      </div>

      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
        {reference} — {t('flashcards.selectVerses')}
      </h3>

      <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
        {verses.map(verse => (
          <label
            key={verse.num}
            className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition ${
              selectedVerses.has(verse.num)
                ? 'bg-blue-50 dark:bg-blue-900/30'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedVerses.has(verse.num)}
              onChange={() => toggleVerse(verse.num)}
              className="mt-1 accent-blue-500"
            />
            <span className="text-sm text-gray-800 dark:text-white">
              <strong className="text-gray-500 dark:text-gray-400">{verse.num}</strong>{' '}
              {verse.text}
            </span>
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={selectedVerses.size === 0}
        className="w-full py-2 rounded-lg text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 transition"
      >
        {t('flashcards.addAsCards')} ({selectedVerses.size * 2})
      </button>
    </div>
  );
}
