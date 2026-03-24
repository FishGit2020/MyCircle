import React, { useState, useMemo } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { FlashCard, DeckCard } from '../types';

interface Props {
  deckId: string;
  allCards: FlashCard[];
  existingDeckCards: DeckCard[];
  onAdd: (cardId: string) => Promise<void>;
  onClose: () => void;
}

export default function DeckCardManager({ allCards, existingDeckCards, onAdd, onClose }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  const existingIds = useMemo(() => new Set(existingDeckCards.map(c => c.cardId)), [existingDeckCards]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return allCards;
    return allCards.filter(c =>
      c.front.toLowerCase().includes(q) ||
      c.back.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  }, [allCards, query]);

  const toggleSelect = (id: string) => {
    if (existingIds.has(id)) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddSelected = async () => {
    if (selected.size === 0) return;
    setAdding(true);
    try {
      for (const cardId of selected) {
        await onAdd(cardId);
      }
      onClose();
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-900" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <button type="button" onClick={onClose} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition min-h-[44px] px-2">
          {t('flashcards.cancel' as any)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </button>
        <h2 className="text-base font-semibold text-gray-800 dark:text-white">
          {t('flashcards.deck.addCards' as any)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </h2>
        <button
          type="button"
          onClick={handleAddSelected}
          disabled={selected.size === 0 || adding}
          className="text-sm font-medium text-blue-500 hover:text-blue-600 disabled:opacity-40 transition min-h-[44px] px-2"
        >
          {adding ? '…' : `${t('flashcards.deck.addSelected' as any)} (${selected.size})`}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('flashcards.deck.searchCards' as any) as string} /* eslint-disable-line @typescript-eslint/no-explicit-any */
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      </div>

      {/* Card list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 dark:text-gray-500 py-12 text-sm">
            {t('flashcards.noCards' as any)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </p>
        )}
        {filtered.map(card => {
          const inDeck = existingIds.has(card.id);
          const isSelected = selected.has(card.id);
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => toggleSelect(card.id)}
              disabled={inDeck}
              className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 text-left transition ${
                inDeck ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700'
              }`}
            >
              {/* Checkbox */}
              <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition ${
                inDeck ? 'bg-green-500 border-green-500' : isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'
              }`}>
                {(inDeck || isSelected) && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              {/* Card content */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{card.front}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{card.back}</p>
              </div>
              {inDeck && (
                <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                  {t('flashcards.deck.alreadyInDeck' as any)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
