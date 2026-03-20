import { useState, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { Setlist, SetlistEntry, WorshipSongListItem } from '../types';

interface SetlistSaveData {
  name: string;
  serviceDate?: string;
  entries: SetlistEntry[];
}

interface SetlistEditorProps {
  setlist?: Setlist;
  allSongs: WorshipSongListItem[];
  songsLoading: boolean;
  onSave: (data: SetlistSaveData) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel: () => void;
}

export default function SetlistEditor({ setlist, allSongs, songsLoading, onSave, onDelete, onCancel }: SetlistEditorProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(setlist?.name ?? '');
  const [serviceDate, setServiceDate] = useState(setlist?.serviceDate ?? '');
  const [entries, setEntries] = useState<SetlistEntry[]>(setlist?.entries ?? []);
  const [songSearch, setSongSearch] = useState('');
  const [nameError, setNameError] = useState(false);
  const [saving, setSaving] = useState(false);

  const filteredSongs = allSongs.filter(s => {
    const q = songSearch.toLowerCase();
    return !q || s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q);
  });

  const handleAddSong = useCallback((song: WorshipSongListItem) => {
    setEntries(prev => [
      ...prev,
      {
        songId: song.id,
        position: prev.length,
        snapshotTitle: song.title,
        snapshotKey: song.originalKey,
      },
    ]);
  }, []);

  const handleRemove = useCallback((index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index).map((e, i) => ({ ...e, position: i })));
  }, []);

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    setEntries(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next.map((e, i) => ({ ...e, position: i }));
    });
  }, []);

  const handleMoveDown = useCallback((index: number) => {
    setEntries(prev => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next.map((e, i) => ({ ...e, position: i }));
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    setSaving(true);
    try {
      await onSave({ name: name.trim(), serviceDate: serviceDate || undefined, entries });
    } finally {
      setSaving(false);
    }
  }, [name, serviceDate, entries, onSave]);

  const handleDelete = useCallback(async () => {
    if (!onDelete) return;
    if (!window.confirm(t('worship.deleteSetlistConfirm'))) return;
    await onDelete();
  }, [onDelete, t]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {setlist ? t('worship.editSetlist') : t('worship.newSetlist')}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition min-h-[44px] px-3"
        >
          {t('worship.cancel')}
        </button>
      </div>

      {/* Name field */}
      <div>
        <label htmlFor="setlist-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('worship.setlistName')} <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <input
          id="setlist-name"
          type="text"
          value={name}
          onChange={e => { setName(e.target.value); if (e.target.value.trim()) setNameError(false); }}
          className={`w-full px-3 py-2 rounded-lg border ${nameError ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none`}
          aria-label={t('worship.setlistName')}
          aria-required="true"
          aria-invalid={nameError}
        />
        {nameError && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">{t('worship.setlistNameRequired')}</p>
        )}
      </div>

      {/* Service date */}
      <div>
        <label htmlFor="setlist-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('worship.serviceDate')}
        </label>
        <input
          id="setlist-date"
          type="date"
          value={serviceDate}
          onChange={e => setServiceDate(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          aria-label={t('worship.serviceDate')}
        />
      </div>

      {/* Song entries */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('worship.setlistSongs')}</h3>
        {entries.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic mb-3">{t('worship.emptySetlist')}</p>
        ) : (
          <ol className="space-y-2 mb-3">
            {entries.map((entry, index) => (
              <li key={`${entry.songId}-${index}`} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <span className="text-xs text-gray-400 dark:text-gray-500 w-5 text-right flex-shrink-0">{index + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{entry.snapshotTitle}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{entry.snapshotKey}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    aria-label="Move up"
                    className="w-7 h-7 flex items-center justify-center rounded text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === entries.length - 1}
                    aria-label="Move down"
                    className="w-7 h-7 flex items-center justify-center rounded text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    aria-label="Remove from setlist"
                    className="w-7 h-7 flex items-center justify-center rounded text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}

        {/* Song search panel */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <input
            type="text"
            value={songSearch}
            onChange={e => setSongSearch(e.target.value)}
            placeholder={t('worship.search')}
            aria-label={t('worship.search')}
            className="w-full px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none mb-2"
          />
          {songsLoading ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">{t('worship.loading')}</p>
          ) : (
            <ul className="max-h-48 overflow-y-auto space-y-1" role="list">
              {filteredSongs.map(song => (
                <li key={song.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-750">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">{song.title}</p>
                    {song.artist && <p className="text-xs text-gray-500 dark:text-gray-400">{song.artist}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddSong(song)}
                    className="flex-shrink-0 text-xs px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition min-h-[32px]"
                  >
                    {t('worship.addSongToSetlist')}
                  </button>
                </li>
              ))}
              {filteredSongs.length === 0 && (
                <li className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">{t('worship.noSongsFound')}</li>
              )}
            </ul>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 flex-wrap border-t border-gray-200 dark:border-gray-700 pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-60 transition min-h-[44px]"
        >
          {saving ? t('worship.saving') : t('worship.save')}
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition min-h-[44px]"
          >
            {t('worship.deleteSetlist')}
          </button>
        )}
      </div>

      {/* Export buttons (US3) — shown only when editing an existing setlist with songs */}
      {setlist && entries.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap border-t border-gray-200 dark:border-gray-700 pt-3">
          <span className="text-xs text-gray-500 dark:text-gray-400">{t('worship.exportSetlist')}:</span>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition min-h-[36px]"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            {t('worship.exportPrint')}
          </button>
          <button
            type="button"
            onClick={() => {
              const lines = [
                setlist.name,
                setlist.serviceDate ?? '',
                '',
                ...entries.map((e, i) => `${i + 1}. ${e.snapshotTitle} — Key: ${e.snapshotKey}`),
              ].filter((line, idx) => idx !== 1 || line);
              const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${setlist.name}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition min-h-[36px]"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t('worship.exportText')}
          </button>
        </div>
      )}
    </div>
  );
}
