import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router';
import { useTranslation, PageContent } from '@mycircle/shared';
import { useWorshipSongs } from '../hooks/useWorshipSongs';
import { useWorshipSetlists } from '../hooks/useWorshipSetlists';
import type { WorshipSong, Setlist, SetlistEntry } from '../types';
import SongList from './SongList';
import SongViewer from './SongViewer';
import SongEditor from './SongEditor';
import SetlistList from './SetlistList';
import SetlistEditor from './SetlistEditor';
import SetlistPresenter from './SetlistPresenter';
import { toChordProString } from '../utils/chordproIO';
import '../index.css';

type View = 'list' | 'view' | 'edit' | 'new' | 'setlist-list' | 'setlist-new' | 'setlist-edit' | 'setlist-present';

export default function WorshipSongs() {
  const { t } = useTranslation();
  const { songId, setlistId } = useParams<{ songId: string; setlistId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const {
    songs, totalCount, totalPages, page, allArtists, allTags, loading, isAuthenticated,
    search, setSearch: setSearchRaw,
    filterArtist, setFilterArtist, filterTag, setFilterTag, filterFormat, setFilterFormat,
    favoriteIds, setShowFavoritesOnly,
    addSong, updateSong, deleteSong, getSong, goToPage, resetFilters: resetFiltersRaw,
  } = useWorshipSongs(initialQuery);

  const {
    setlists, loading: setlistsLoading, isAuthenticated: setlistsAuth,
    addSetlist, updateSetlist, deleteSetlist, getSetlist,
  } = useWorshipSetlists();

  // Sync search state to URL ?q= param
  const setSearch = useCallback((query: string) => {
    setSearchRaw(query);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (query.trim()) {
        next.set('q', query);
      } else {
        next.delete('q');
      }
      return next;
    }, { replace: true });
  }, [setSearchRaw, setSearchParams]);

  const resetFilters = useCallback(() => {
    resetFiltersRaw();
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('q');
      return next;
    }, { replace: true });
  }, [resetFiltersRaw, setSearchParams]);

  const [selectedSong, setSelectedSong] = useState<WorshipSong | null>(null);
  const [selectedSetlist, setSelectedSetlist] = useState<Setlist | null>(null);
  const [presenterSongs, setPresenterSongs] = useState<Record<string, WorshipSong | null>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [songLoading, setSongLoading] = useState(false);
  const [setlistLoading, setSetlistLoading] = useState(false);
  const [presenterLoading, setPresenterLoading] = useState(false);

  // Derive view from URL
  const path = location.pathname;
  const isSetlistsRoot = path === '/worship/setlists';
  const isSetlistNew = path === '/worship/setlists/new';
  const isSetlistPresent = setlistId != null && path.endsWith('/present');
  const isSetlistEdit = setlistId != null && !path.endsWith('/present');
  const isNewRoute = path === '/worship/new';
  const isEditRoute = songId != null && path.endsWith('/edit');

  const view: View = isSetlistsRoot ? 'setlist-list'
    : isSetlistNew ? 'setlist-new'
    : isSetlistPresent ? 'setlist-present'
    : isSetlistEdit ? 'setlist-edit'
    : isNewRoute ? 'new'
    : isEditRoute ? 'edit'
    : songId ? 'view'
    : 'list';

  // Fetch song when navigating to song detail/edit
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
        setErrorMsg(t('worship.loadError' as any)); // eslint-disable-line @typescript-eslint/no-explicit-any
        navigate('/worship', { replace: true });
      }
    }).catch(() => {
      if (cancelled) return;
      setSongLoading(false);
      setErrorMsg(t('worship.loadError' as any)); // eslint-disable-line @typescript-eslint/no-explicit-any
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songId, isNewRoute]);

  // Fetch setlist when navigating to setlist edit/present
  useEffect(() => {
    if (!setlistId) {
      setSelectedSetlist(null);
      return;
    }
    let cancelled = false;
    setSetlistLoading(true);
    getSetlist(setlistId).then(sl => {
      if (cancelled) return;
      setSetlistLoading(false);
      if (sl) {
        setSelectedSetlist(sl);
      } else {
        navigate('/worship/setlists', { replace: true });
      }
    }).catch(() => {
      if (cancelled) return;
      setSetlistLoading(false);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setlistId]);

  // Pre-load all songs for presenter when entering present mode
  useEffect(() => {
    if (view !== 'setlist-present' || !selectedSetlist) return;
    let cancelled = false;
    setPresenterLoading(true);
    const entries = selectedSetlist.entries;
    Promise.all(entries.map(e => getSong(e.songId))).then(results => {
      if (cancelled) return;
      const map: Record<string, WorshipSong | null> = {};
      entries.forEach((e, i) => { map[e.songId] = results[i]; });
      setPresenterSongs(map);
      setPresenterLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setPresenterLoading(false);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedSetlist?.id]);

  // Song handlers
  const handleSelectSong = useCallback((id: string) => { navigate(`/worship/${id}`); }, [navigate]);
  const handleNewSong = useCallback(() => { navigate('/worship/new'); }, [navigate]);
  const handleEdit = useCallback(() => { if (selectedSong) navigate(`/worship/${selectedSong.id}/edit`); }, [selectedSong, navigate]);
  const handleBack = useCallback(() => { navigate('/worship'); }, [navigate]);

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

  const handleDeleteSong = useCallback(async () => {
    if (!selectedSong) return;
    await deleteSong(selectedSong.id);
    navigate('/worship');
  }, [selectedSong, deleteSong, navigate]);

  const handleDownloadSong = useCallback(async (id: string) => {
    try {
      const song = await getSong(id);
      if (!song) return;
      const choString = toChordProString({
        title: song.title, artist: song.artist, originalKey: song.originalKey,
        content: song.content, bpm: song.bpm, notes: song.notes,
      });
      const blob = new Blob([choString], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${song.title}.cho`; a.click();
      URL.revokeObjectURL(url);
    } catch { /* silently fail */ }
  }, [getSong]);

  // Setlist handlers
  const handleSelectSetlist = useCallback((id: string) => { navigate(`/worship/setlists/${id}`); }, [navigate]);
  const handleNewSetlist = useCallback(() => { navigate('/worship/setlists/new'); }, [navigate]);

  const handleSaveNewSetlist = useCallback(async (data: { name: string; serviceDate?: string; entries: SetlistEntry[] }) => {
    const id = await addSetlist({ name: data.name, serviceDate: data.serviceDate });
    if (data.entries.length > 0) {
      await updateSetlist(id, { entries: data.entries });
    }
    navigate(`/worship/setlists/${id}`);
  }, [addSetlist, updateSetlist, navigate]);

  const handleSaveEditSetlist = useCallback(async (data: { name: string; serviceDate?: string; entries: SetlistEntry[] }) => {
    if (!selectedSetlist) return;
    await updateSetlist(selectedSetlist.id, { name: data.name, serviceDate: data.serviceDate, entries: data.entries });
    const updated = await getSetlist(selectedSetlist.id);
    if (updated) setSelectedSetlist(updated);
  }, [selectedSetlist, updateSetlist, getSetlist]);

  const handleDeleteSetlist = useCallback(async () => {
    if (!selectedSetlist) return;
    await deleteSetlist(selectedSetlist.id);
    navigate('/worship/setlists');
  }, [selectedSetlist, deleteSetlist, navigate]);

  // Loading states
  if (songLoading && (view === 'view' || view === 'edit')) {
    return (
      <div className="flex items-center justify-center py-16" role="status">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (setlistLoading && (view === 'setlist-edit' || view === 'setlist-present')) {
    return (
      <div className="flex items-center justify-center py-16" role="status">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (presenterLoading && view === 'setlist-present') {
    return (
      <div className="flex items-center justify-center py-16" role="status">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  switch (view) {
    case 'setlist-list':
      return (
        <PageContent>
          <SetlistList
            setlists={setlists}
            loading={setlistsLoading}
            isAuthenticated={setlistsAuth}
            onSelectSetlist={handleSelectSetlist}
            onNewSetlist={handleNewSetlist}
          />
        </PageContent>
      );

    case 'setlist-new':
      return (
        <PageContent>
          <SetlistEditor
            allSongs={songs}
            songsLoading={loading}
            onSave={handleSaveNewSetlist}
            onCancel={() => navigate('/worship/setlists')}
          />
        </PageContent>
      );

    case 'setlist-edit':
      return selectedSetlist ? (
        <PageContent>
          <SetlistEditor
            setlist={selectedSetlist}
            allSongs={songs}
            songsLoading={loading}
            onSave={handleSaveEditSetlist}
            onDelete={handleDeleteSetlist}
            onCancel={() => navigate('/worship/setlists')}
          />
          {selectedSetlist.entries.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => navigate(`/worship/setlists/${selectedSetlist.id}/present`)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition min-h-[44px]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('worship.startService')}
              </button>
            </div>
          )}
        </PageContent>
      ) : null;

    case 'setlist-present':
      return selectedSetlist ? (
        <PageContent>
          <SetlistPresenter
            setlist={selectedSetlist}
            songs={presenterSongs}
            onExit={() => navigate(`/worship/setlists/${selectedSetlist.id}`)}
          />
        </PageContent>
      ) : null;

    case 'view':
      return selectedSong ? (
        <PageContent>
          <SongViewer song={selectedSong} isAuthenticated={isAuthenticated} onEdit={handleEdit} />
        </PageContent>
      ) : null;

    case 'new':
      return (
        <PageContent>
          <SongEditor onSave={handleSaveNew} onCancel={handleBack} />
        </PageContent>
      );

    case 'edit':
      return selectedSong ? (
        <PageContent>
          <SongEditor
            song={selectedSong}
            onSave={handleSaveEdit}
            onDelete={handleDeleteSong}
            onCancel={() => navigate(`/worship/${selectedSong.id}`)}
          />
        </PageContent>
      ) : null;

    default:
      return (
        <PageContent>
          {errorMsg && (
            <div role="alert" className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300 flex items-center justify-between">
              <span>{errorMsg}</span>
              <button type="button" onClick={() => setErrorMsg(null)} className="ml-2 text-red-400 hover:text-red-600 dark:hover:text-red-200" aria-label="Dismiss">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => navigate('/worship/setlists')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition min-h-[36px]"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {t('worship.setlists')}
            </button>
          </div>
          <SongList
            songs={songs}
            totalCount={totalCount}
            totalPages={totalPages}
            page={page}
            allArtists={allArtists}
            allTags={allTags}
            loading={loading}
            isAuthenticated={isAuthenticated}
            search={search}
            filterArtist={filterArtist}
            filterTag={filterTag}
            filterFormat={filterFormat}
            showFavoritesOnly={favoriteIds !== null}
            onSearchChange={setSearch}
            onFilterArtistChange={setFilterArtist}
            onFilterTagChange={setFilterTag}
            onFilterFormatChange={setFilterFormat}
            onFavoritesToggle={setShowFavoritesOnly}
            onSelectSong={handleSelectSong}
            onNewSong={handleNewSong}
            onPageChange={goToPage}
            onResetFilters={resetFilters}
            onDownloadSong={handleDownloadSong}
            onDeleteSong={async (id: string) => {
              if (!window.confirm(t('worship.deleteConfirm'))) return;
              try {
                await deleteSong(id);
              } catch {
                setErrorMsg(t('worship.deleteFailed'));
              }
            }}
          />
        </PageContent>
      );
  }
}
