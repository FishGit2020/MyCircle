import { useState, useEffect, useCallback } from 'react';
import { useTranslation, StorageKeys, WindowEvents, type TranslationKey } from '@mycircle/shared';
import { characters, categoryOrder, type ChineseCharacter, type CharacterCategory } from '../data/characters';
import FlashcardView from './FlashcardView';
import PracticeCanvas from './PracticeCanvas';
import CharacterGrid from './CharacterGrid';

type View = 'grid' | 'flashcards' | 'practice';

const categoryKeyMap: Record<CharacterCategory, TranslationKey> = {
  family: 'chinese.category.family',
  feelings: 'chinese.category.feelings',
  food: 'chinese.category.food',
  body: 'chinese.category.body',
  house: 'chinese.category.house',
  nature: 'chinese.category.nature',
  numbers: 'chinese.category.numbers',
  phrases: 'chinese.category.phrases',
};

interface Progress {
  masteredIds: string[];
  lastDate: string;
}

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(StorageKeys.CHINESE_LEARNING_PROGRESS);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { masteredIds: [], lastDate: '' };
}

function saveProgress(progress: Progress) {
  localStorage.setItem(StorageKeys.CHINESE_LEARNING_PROGRESS, JSON.stringify(progress));
  window.dispatchEvent(new Event(WindowEvents.CHINESE_PROGRESS_CHANGED));
}

export default function ChineseLearning() {
  const { t } = useTranslation();
  const [view, setView] = useState<View>('grid');
  const [selectedCategory, setSelectedCategory] = useState<CharacterCategory | null>(null);
  const [practiceChar, setPracticeChar] = useState<ChineseCharacter | null>(null);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(() => new Set(loadProgress().masteredIds));

  const filteredChars = selectedCategory
    ? characters.filter((c) => c.category === selectedCategory)
    : characters;

  const toggleMastered = useCallback((id: string) => {
    setMasteredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      saveProgress({ masteredIds: Array.from(next), lastDate: new Date().toISOString().slice(0, 10) });
      return next;
    });
  }, []);

  const handlePractice = useCallback((char: ChineseCharacter) => {
    setPracticeChar(char);
    setView('practice');
  }, []);

  const handleSelectFromGrid = useCallback((char: ChineseCharacter) => {
    setSelectedCategory(char.category);
    // Find index in filtered list
    const idx = characters.filter((c) => c.category === char.category).indexOf(char);
    setPracticeChar(char);
    setView('flashcards');
  }, []);

  const handleReset = useCallback(() => {
    setMasteredIds(new Set());
    saveProgress({ masteredIds: [], lastDate: '' });
  }, []);

  // Listen for external progress changes (e.g. Firestore restore)
  useEffect(() => {
    function handleProgressChanged() {
      const progress = loadProgress();
      setMasteredIds(new Set(progress.masteredIds));
    }
    window.addEventListener(WindowEvents.CHINESE_PROGRESS_CHANGED, handleProgressChanged);
    return () => window.removeEventListener(WindowEvents.CHINESE_PROGRESS_CHANGED, handleProgressChanged);
  }, []);

  return (
    <div className="max-w-2xl mx-auto" data-testid="chinese-learning">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('chinese.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('chinese.subtitle')}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-green-600 dark:text-green-400 font-medium">
            {t('chinese.mastered')}: {masteredIds.size} / {characters.length}
          </span>
          {masteredIds.size > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 transition"
            >
              {t('chinese.reset')}
            </button>
          )}
        </div>
      </div>

      {/* View tabs */}
      <div className="flex gap-2 mb-4">
        {(['grid', 'flashcards'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              view === v
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            {v === 'grid' ? t('chinese.grid') : t('chinese.flashcards')}
          </button>
        ))}
      </div>

      {/* Category filter (for flashcard view) */}
      {view === 'flashcards' && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
              !selectedCategory
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            All
          </button>
          {categoryOrder.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                selectedCategory === cat
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              {t(categoryKeyMap[cat])}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {view === 'grid' && (
        <CharacterGrid
          characters={characters}
          masteredIds={masteredIds}
          onSelect={handleSelectFromGrid}
        />
      )}

      {view === 'flashcards' && (
        <FlashcardView
          characters={filteredChars}
          masteredIds={masteredIds}
          onToggleMastered={toggleMastered}
          onPractice={handlePractice}
        />
      )}

      {view === 'practice' && practiceChar && (
        <PracticeCanvas
          character={practiceChar}
          onBack={() => setView('flashcards')}
        />
      )}
    </div>
  );
}
