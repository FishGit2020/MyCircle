import { useTranslation, type TranslationKey } from '@mycircle/shared';
import { type ChineseCharacter, type CharacterCategory, categoryOrder } from '../data/characters';

interface CharacterGridProps {
  characters: ChineseCharacter[];
  masteredIds: Set<string>;
  onSelect: (character: ChineseCharacter) => void;
  onEdit?: (character: ChineseCharacter) => void;
  onDelete?: (id: string) => void;
}

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

export default function CharacterGrid({ characters, masteredIds, onSelect, onEdit, onDelete }: CharacterGridProps) {
  const { t } = useTranslation();

  const grouped = categoryOrder.map((cat) => ({
    category: cat,
    items: characters.filter((c) => c.category === cat),
  })).filter(({ items }) => items.length > 0);

  return (
    <div className="space-y-6">
      {grouped.map(({ category, items }) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            {t(categoryKeyMap[category])}
          </h3>
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {items.map((char) => {
              const mastered = masteredIds.has(char.id);
              return (
                <div key={char.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => onSelect(char)}
                    className={`relative w-full flex flex-col items-center p-2 rounded-lg border transition hover:shadow-md ${
                      mastered
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                    title={`${char.pinyin} — ${char.meaning}`}
                  >
                    <span className="text-2xl">{char.character}</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 truncate w-full text-center">
                      {char.pinyin}
                    </span>
                    {mastered && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </button>
                  {/* Edit button (auth-gated) */}
                  {onEdit && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onEdit(char); }}
                      className="absolute -top-1 -left-1 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      aria-label={t('chinese.editCharacter')}
                      data-testid={`edit-char-${char.id}`}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                  {/* Creator metadata tooltip */}
                  {char.createdBy && (
                    <span className="absolute -bottom-5 left-0 right-0 text-center text-[8px] text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                      {char.editedBy ? `${t('chinese.editedBy')} ${char.editedBy.displayName}` : `${t('chinese.createdBy')} ${char.createdBy.displayName}`}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
