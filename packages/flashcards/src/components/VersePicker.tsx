import React, { useState, useMemo } from 'react';
import { useTranslation } from '@mycircle/shared';

interface VerseItem {
  number: number;
  text: string;
}

interface VersePickerProps {
  passageText: string;
  verses?: VerseItem[];
  reference: string;
  book: string;
  chapter: number;
  onAddCards: (cards: Array<{ front: string; back: string; reference: string; verseRange: string; type: 'bible-first-letter' | 'bible-full' }>) => void;
  onBack: () => void;
}

/** Fallback: split plain text into verses using common markers */
function splitVerses(text: string): Array<{ number: number; text: string }> {
  // Strategy 1: [N] markers (e.g., "[1] In the beginning... [2] Now...")
  const bracketParts = text.split(/\[(\d+)\]\s*/);
  if (bracketParts.length > 2) {
    const verses: Array<{ number: number; text: string }> = [];
    for (let i = 1; i < bracketParts.length; i += 2) {
      const num = parseInt(bracketParts[i], 10);
      const content = (bracketParts[i + 1] || '').trim();
      if (content) verses.push({ number: num, text: content });
    }
    if (verses.length > 1) return verses;
  }

  // Strategy 2: Newline-separated lines
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length > 1) {
    return lines.map((line, idx) => ({ number: idx + 1, text: line.trim() }));
  }

  // Fallback: entire text as one entry
  return [{ number: 1, text: text.trim() }];
}

function getFirstLetters(text: string): string {
  return text
    .split(/\s+/)
    .map(word => word.charAt(0))
    .join(' ');
}

type CardTypeOption = 'both' | 'first-letter' | 'full';

export default function VersePicker({ passageText, verses: apiVerses, reference, book, chapter, onAddCards, onBack }: VersePickerProps) {
  const { t } = useTranslation();

  // Use structured verses from API if available, otherwise fall back to text parsing
  const verses = useMemo(() => {
    if (apiVerses && apiVerses.length > 0) return apiVerses;
    return splitVerses(passageText);
  }, [apiVerses, passageText]);

  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const [cardType, setCardType] = useState<CardTypeOption>('both');

  const toggleVerse = (num: number) => {
    setSelectedVerses(prev => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedVerses(new Set(verses.map(v => v.number)));
  };

  const handleAdd = () => {
    if (selectedVerses.size === 0) return;
    const sorted = [...selectedVerses].sort((a, b) => a - b);
    const cards: Array<{ front: string; back: string; reference: string; verseRange: string; type: 'bible-first-letter' | 'bible-full' }> = [];

    for (const verseNum of sorted) {
      const verse = verses.find(v => v.number === verseNum);
      if (!verse) continue;
      const ref = `${book} ${chapter}:${verseNum}`;

      if (cardType === 'both' || cardType === 'first-letter') {
        cards.push({
          front: getFirstLetters(verse.text),
          back: verse.text,
          reference: ref,
          verseRange: String(verseNum),
          type: 'bible-first-letter',
        });
      }
      if (cardType === 'both' || cardType === 'full') {
        cards.push({
          front: ref,
          back: verse.text,
          reference: ref,
          verseRange: String(verseNum),
          type: 'bible-full',
        });
      }
    }

    onAddCards(cards);
  };

  const cardCount = selectedVerses.size * (cardType === 'both' ? 2 : 1);

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
          {t('flashcards.selectAll')}
        </button>
      </div>

      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
        {reference} — {t('flashcards.selectVerses')}
      </h3>

      {/* Card type selector */}
      <div className="flex gap-2 mb-3">
        {(['both', 'first-letter', 'full'] as const).map(option => (
          <button
            key={option}
            type="button"
            onClick={() => setCardType(option)}
            className={`px-3 py-1.5 text-xs rounded-full transition ${
              cardType === option
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {option === 'both'
              ? t('flashcards.cardTypeBoth')
              : option === 'first-letter'
                ? t('flashcards.firstLetterCard')
                : t('flashcards.fullTextCard')}
          </button>
        ))}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
        {verses.map(verse => (
          <label
            key={verse.number}
            className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition ${
              selectedVerses.has(verse.number)
                ? 'bg-blue-50 dark:bg-blue-900/30'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedVerses.has(verse.number)}
              onChange={() => toggleVerse(verse.number)}
              className="mt-1 accent-blue-500"
            />
            <span className="text-sm text-gray-800 dark:text-white">
              <strong className="text-gray-500 dark:text-gray-400">{verse.number}</strong>{' '}
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
        {t('flashcards.addAsCards')} ({cardCount})
      </button>
    </div>
  );
}
