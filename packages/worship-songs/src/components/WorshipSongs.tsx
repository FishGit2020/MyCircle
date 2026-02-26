import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
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
  const { songId } = useParams<{ songId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { songs, loading, isAuthenticated, addSong, updateSong, deleteSong, getSong, refresh } = useWorshipSongs();
  const [selectedSong, setSelectedSong] = useState<WorshipSong | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [songLoading, setSongLoading] = useState(false);

  // Derive view from URL
  const isNewRoute = location.pathname === '/worship/new';
  const isEditRoute = songId != null && location.pathname.endsWith('/edit');
  const view: View = isNewRoute ? 'new' : isEditRoute ? 'edit' : songId ? 'view' : 'list';

  // Fetch song data when URL changes to a song detail/edit route
  useEffect(() => {
    if (!songId || isNewRoute) {
      setSelectedSong(null);
      return;
    }
    let cancelled = false;
    setSongLoading(true);
    setErrorMsg(null);
    getSong(songId).then(song => {
      if (cancelled) return;
      setSongLoading(false);
      if (song) {
        setSelectedSong(song);
      } else {
        setErrorMsg(t('worship.loadError' as any));
        navigate('/worship', { replace: true });
      }
    }).catch(() => {
      if (cancelled) return;
      setSongLoading(false);
      setErrorMsg(t('worship.loadError' as any));
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songId, isNewRoute]);

  const handleSelectSong = useCallback((id: string) => {
    navigate(`/worship/${id}`);
  }, [navigate]);

  const handleNewSong = useCallback(() => {
    navigate('/worship/new');
  }, [navigate]);

  const handleEdit = useCallback(() => {
    if (selectedSong) navigate(`/worship/${selectedSong.id}/edit`);
  }, [selectedSong, navigate]);

  const handleBack = useCallback(() => {
    navigate('/worship');
  }, [navigate]);

  const handleSaveNew = useCallback(async (data: Omit<WorshipSong, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = await addSong(data);
    navigate(`/worship/${id}`);
  }, [addSong, navigate]);

  const handleSaveEdit = useCallback(async (data: Omit<WorshipSong, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!selectedSong) return;
    await updateSong(selectedSong.id, data);
    const updated = await getSong(selectedSong.id);
    if (updated) setSelectedSong(updated);
    navigate(`/worship/${selectedSong.id}`);
  }, [selectedSong, updateSong, getSong, navigate]);

  const handleDelete = useCallback(async () => {
    if (!selectedSong) return;
    await deleteSong(selectedSong.id);
    navigate('/worship');
  }, [selectedSong, deleteSong, navigate]);

  if (songLoading && (view === 'view' || view === 'edit')) {
    return (
      <div className="flex items-center justify-center py-16" role="status">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  switch (view) {
    case 'view':
      return selectedSong ? (
        <SongViewer
          song={selectedSong}
          isAuthenticated={isAuthenticated}
          onEdit={handleEdit}
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
          onCancel={() => navigate(`/worship/${selectedSong.id}`)}
        />
      ) : null;

    default:
      return (
        <>
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={() => refresh()}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={t('worship.refresh')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
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
