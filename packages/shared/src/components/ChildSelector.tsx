import { useCallback } from 'react';
import type { Child } from '../types/child';
import { useTranslation } from '../i18n';

const AVATAR_COLORS = ['#f87171', '#fb923c', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'];

interface ChildSelectorProps {
  children: Child[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd?: () => void;
}

export function ChildSelector({ children: childList, selectedId, onSelect, onAdd }: ChildSelectorProps) {
  const { t } = useTranslation();

  const getColor = useCallback((child: Child, index: number) => {
    return child.avatarColor || AVATAR_COLORS[index % AVATAR_COLORS.length];
  }, []);

  if (childList.length === 0 && !onAdd) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {childList.map((child, i) => {
        const isSelected = child.id === selectedId;
        const color = getColor(child, i);
        const initial = child.name.charAt(0).toUpperCase();
        return (
          <button
            key={child.id}
            type="button"
            onClick={() => onSelect(child.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              isSelected
                ? 'ring-2 ring-offset-1 ring-blue-500 dark:ring-blue-400 shadow-sm'
                : 'opacity-60 hover:opacity-100'
            }`}
            aria-pressed={isSelected}
            aria-label={child.name}
          >
            <span
              className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: color }}
            >
              {initial}
            </span>
            <span className="text-gray-800 dark:text-gray-200 truncate max-w-[80px]">
              {child.name}
            </span>
          </button>
        );
      })}
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border border-dashed border-blue-300 dark:border-blue-700"
          aria-label={t('children.addChild' as any)}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t('children.add' as any)}
        </button>
      )}
    </div>
  );
}
