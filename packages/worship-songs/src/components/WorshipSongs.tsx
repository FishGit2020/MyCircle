import { useState, useCallback } from 'react';
import { useWorshipSongs } from '../hooks/useWorshipSongs';
import type { WorshipSong } from '../types';
import SongList from './SongList';
import SongViewer from './SongViewer';
import SongEditor from './SongEditor';
import '../index.css';

type View = 'list' | 'view' | 'edit' | 'new';

export default function WorshipSongs() {
  const { songs, loading, isAuthenticated, addSong, updateSong, deleteSong, getSong } = useWorshipSongs();
  const [view, setView] = useState<View>('list');
  const [selectedSong, setSelectedSong] = useState<WorshipSong | null>(null);

  const handleSelectSong = useCallback(async (id: string) => {
    const song = await getSong(id);
    if (song) {
      setSelectedSong(song);
      setView('view');
    }
  }, [getSong]);

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
        <SongList
          songs={songs}
          loading={loading}
          isAuthenticated={isAuthenticated}
          onSelectSong={handleSelectSong}
          onNewSong={handleNewSong}
        />
      );
  }
}
