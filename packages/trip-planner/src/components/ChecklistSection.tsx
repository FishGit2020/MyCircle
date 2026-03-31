import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { Trip, ChecklistItem } from '../types';

interface ChecklistSectionProps {
  trip: Trip;
  onUpdate: (id: string, data: Partial<Trip>) => void;
}

export default function ChecklistSection({ trip, onUpdate }: ChecklistSectionProps) {
  const { t } = useTranslation();
  const [newItemText, setNewItemText] = useState('');

  const checklist = useMemo(() => trip.checklist || [], [trip.checklist]);
  const remaining = checklist.filter(item => !item.checked).length;

  const handleAdd = useCallback(() => {
    const text = newItemText.trim();
    if (!text) return;
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text,
      checked: false,
    };
    onUpdate(trip.id, { checklist: [...checklist, newItem] });
    setNewItemText('');
  }, [newItemText, checklist, trip.id, onUpdate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }, [handleAdd]);

  const handleToggle = useCallback((id: string) => {
    const updated = checklist.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item,
    );
    onUpdate(trip.id, { checklist: updated });
  }, [checklist, trip.id, onUpdate]);

  const handleDelete = useCallback((id: string) => {
    const updated = checklist.filter(item => item.id !== id);
    onUpdate(trip.id, { checklist: updated });
  }, [checklist, trip.id, onUpdate]);

  const headerLabel = checklist.length === 0 || remaining === 0
    ? t('tripPlanner.checklist')
    : `${t('tripPlanner.checklist')} — ${t('tripPlanner.checklistRemaining').replace('{count}', String(remaining))}`;

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">{headerLabel}</h3>

      {/* Add item */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newItemText}
          onChange={e => setNewItemText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('tripPlanner.checklistPlaceholder')}
          className="flex-1 px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
          aria-label={t('tripPlanner.addChecklistItem')}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newItemText.trim()}
          className="px-3 py-1.5 text-sm bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-400 disabled:cursor-not-allowed text-white rounded transition min-w-[44px]"
          aria-label={t('tripPlanner.addChecklistItem')}
        >
          +
        </button>
      </div>

      {/* Items */}
      {checklist.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">{t('tripPlanner.checklistEmpty')}</p>
      ) : (
        <ul className="space-y-1">
          {checklist.map(item => (
            <li key={item.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => handleToggle(item.id)}
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-cyan-500 focus:ring-cyan-500 flex-shrink-0 cursor-pointer"
                aria-label={item.text}
              />
              <span className={`flex-1 text-sm min-w-0 ${item.checked ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-white'}`}>
                {item.text}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="p-2 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition flex-shrink-0"
                aria-label={`Remove ${item.text}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
