import { useState, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import { useWorshipSongs } from '../hooks/useWorshipSongs';
import type { WorshipSong } from '../types';
import SongList from './SongList';
import SongViewer from './SongViewer';
import SongEditor from './SongEditor';
import '../index.css';

type View = 'list' | 'view' | 'edit' | 'new';

export default function WorshipSongs() {
  const { t } = useTranslation();
  const { songs, loading, isAuthenticated, addSong, updateSong, deleteSong, getSong } = useWorshipSongs();
  const [view, setView] = useState<View>('list');
  const [selectedSong, setSelectedSong] = useState<WorshipSong | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelectSong = useCallback(async (id: string) => {
    setErrorMsg(null);
    try {
      const song = await getSong(id);
      if (song) {
        setSelectedSong(song);
        setView('view');
      } else {
        setErrorMsg(t('worship.loadError' as any));
      }
    } catch {
      setErrorMsg(t('worship.loadError' as any));
    }
  }, [getSong, t]);

  const handleNewSong = useCallback(() => {
    setSelectedSong(null);
    setView('new');
  }, []);

  const handleEdit = useCallback(() => {
    setView('edit');
  }, []);

  const handleBack = useCallback(() => {
    setView('list');
    setSelectedSong(null);
  }, []);

  const handleSaveNew = useCallback(async (data: Omit<WorshipSong, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = await addSong(data);
    const song = await getSong(id);
    if (song) {
      setSelectedSong(song);
      setView('view');
    } else {
      setView('list');
    }
  }, [addSong, getSong]);

  const handleSaveEdit = useCallback(async (data: Omit<WorshipSong, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!selectedSong) return;
    await updateSong(selectedSong.id, data);
    const updated = await getSong(selectedSong.id);
    if (updated) {
      setSelectedSong(updated);
    }
    setView('view');
  }, [selectedSong, updateSong, getSong]);

  const handleDelete = useCallback(async () => {
    if (!selectedSong) return;
    await deleteSong(selectedSong.id);
    setSelectedSong(null);
    setView('list');
  }, [selectedSong, deleteSong]);

  switch (view) {
    case 'view':
      return selectedSong ? (
        <SongViewer
          song={selectedSong}
          isAuthenticated={isAuthenticated}
          onEdit={handleEdit}
          onBack={handleBack}
        />
      ) : null;

    case 'new':
      return (
        <SongEditor
          onSave={handleSaveNew}
          onCancel={handleBack}
        />
      );

    case 'edit':
      return selectedSong ? (
        <SongEditor
          song={selectedSong}
          onSave={handleSaveEdit}
          onDelete={handleDelete}
          onCancel={() => setView('view')}
        />
      ) : null;

    default:
      return (
        <>
          {errorMsg && (
            <div role="alert" className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300 flex items-center justify-between">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} className="ml-2 text-red-400 hover:text-red-600 dark:hover:text-red-200" aria-label="Dismiss">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
          <SongList
            songs={songs}
            loading={loading}
            isAuthenticated={isAuthenticated}
            onSelectSong={handleSelectSong}
            onNewSong={handleNewSong}
          />
        </>
      );
  }
}
