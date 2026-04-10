import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation, WindowEvents, createLogger, PageContent, useQuery, useMutation, useLazyQuery, GET_BOOKS, GET_BOOK_CHAPTERS, DELETE_BOOK, UPLOAD_BOOK, GET_NAS_CONNECTION_STATUS, ARCHIVE_EPUB_TO_NAS, RESTORE_EPUB_FROM_NAS, StorageKeys } from '@mycircle/shared';
import BookReader from './BookReader';
import LibrarySearchSort, { SortOption } from './LibrarySearchSort';
import TtsQuotaBar from './TtsQuotaBar';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { useReadingProgress } from '../hooks/useReadingProgress';

const logger = createLogger('DigitalLibrary');

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  language: string;
  coverUrl: string;
  epubUrl: string;
  fileSize: number;
  chapterCount: number;
  totalCharacters: number;
  uploadedBy: { uid: string; displayName: string };
  uploadedAt: string;
  audioStatus: 'none' | 'processing' | 'paused' | 'complete' | 'error';
  audioProgress: number;
  audioError?: string;
  zipStatus?: 'none' | 'processing' | 'ready' | 'error';
  zipUrl?: string;
  zipSize?: number;
  zipGeneratedAt?: string;
  zipError?: string;
  epubNasArchived?: boolean;
  epubNasPath?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function BookCard({ book, onSelect, onSelectListen, onDelete, readPercent, nasConnected, onRefresh }: {
  book: Book;
  onSelect: (book: Book) => void;
  onSelectListen: (book: Book) => void;
  onDelete: (bookId: string) => void;
  readPercent?: number; // 0–100 or undefined if never opened
  nasConnected?: boolean;
  onRefresh?: () => void;
}) {
  const { t } = useTranslation();
  const [archiveEpubMutation] = useMutation(ARCHIVE_EPUB_TO_NAS);
  const [restoreEpubMutation] = useMutation(RESTORE_EPUB_FROM_NAS);
  const [epubOffloading, setEpubOffloading] = useState(false);
  const [epubRestoring, setEpubRestoring] = useState(false);
  const isComplete = readPercent != null && readPercent >= 98;
  const showProgress = readPercent != null && readPercent >= 1 && !isComplete;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
      <button
        type="button"
        onClick={() => onSelect(book)}
        className="w-full text-left"
        aria-label={`${t('library.openBook')}: ${book.title}`}
      >
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-48 object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
            <svg className="w-16 h-16 text-blue-300 dark:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
        )}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 min-h-[2.5rem]">{book.title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{book.author}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 dark:text-gray-500">
            <span>{book.chapterCount} {t('library.chapters')}</span>
            <span aria-hidden="true">&middot;</span>
            <span>{formatFileSize(book.fileSize)}</span>
          </div>
          {isComplete && (
            <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
              {t('library.complete' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </span>
          )}
          {showProgress && (
            <div className="mt-2" aria-label={`${t('library.readingProgress' as any)}: ${readPercent}%`}> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${readPercent}%` }} />
              </div>
            </div>
          )}
          {(book.audioStatus === 'complete' || book.audioProgress > 0) && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onSelectListen(book); }}
              className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-medium transition-colors active:scale-95 min-h-[36px] ${
                book.audioStatus === 'complete'
                  ? 'bg-green-500 dark:bg-green-600 text-white hover:bg-green-600 dark:hover:bg-green-500'
                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50'
              }`}
              aria-label={`${t('library.listenNow')}: ${book.title}`}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              {book.audioStatus === 'complete' ? t('library.audioAvailable') : `${book.audioProgress}% ${t('library.audioAvailable')}`}
            </button>
          )}
          {(book.audioStatus === 'processing' || book.audioStatus === 'paused') && (
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${book.audioProgress}%` }} />
                </div>
                <span className="text-xs text-blue-500">{book.audioProgress}%</span>
              </div>
            </div>
          )}
        </div>
      </button>
      <div className="px-4 pb-3 flex items-center justify-between flex-wrap gap-1">
        <div className="flex items-center gap-2">
          {book.epubUrl ? (
            <>
              <a
                href={book.epubUrl}
                download={`${book.title}.epub`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors min-h-[44px] flex items-center gap-1"
                aria-label={`${t('library.downloadEpub')}: ${book.title}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t('library.downloadEpub')}
              </a>
              {nasConnected && !book.epubNasArchived && (
                epubOffloading ? (
                  <span className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                    <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    {t('library.nas.offloadingEpub')}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      setEpubOffloading(true);
                      try {
                        await archiveEpubMutation({ variables: { bookId: book.id } });
                        onRefresh?.();
                      } catch (err) { logger.error('Failed to offload EPUB to NAS', err); }
                      finally { setEpubOffloading(false); }
                    }}
                    className="text-xs text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 transition-colors min-h-[44px] flex items-center gap-1"
                    aria-label={`${t('library.nas.offloadEpub')}: ${book.title}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    {t('library.nas.offloadEpub')}
                  </button>
                )
              )}
              {book.epubNasArchived && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-medium">
                  NAS
                </span>
              )}
            </>
          ) : book.epubNasArchived ? (
            <div className="flex items-center gap-1">
              <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-medium">
                {t('library.nas.epubArchived')}
              </span>
              {nasConnected && (
                epubRestoring ? (
                  <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    {t('library.nas.restoringEpub')}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      setEpubRestoring(true);
                      try {
                        await restoreEpubMutation({ variables: { bookId: book.id } });
                        onRefresh?.();
                      } catch (err) { logger.error('Failed to restore EPUB from NAS', err); }
                      finally { setEpubRestoring(false); }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors min-h-[44px] flex items-center gap-1"
                    aria-label={`${t('library.nas.restoreEpub')}: ${book.title}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 3v13.5m0 0l-4.5-4.5M12 16.5l4.5-4.5" />
                    </svg>
                    {t('library.nas.restoreEpub')}
                  </button>
                )
              )}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(book.id); }}
          className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors min-h-[44px] flex items-center"
          aria-label={`${t('library.deleteBook')}: ${book.title}`}
        >
          {t('library.delete')}
        </button>
      </div>
    </div>
  );
}

function BookUpload({ onUploadComplete }: { onUploadComplete: () => void }) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadBookMutation] = useMutation(UPLOAD_BOOK, { refetchQueries: [{ query: GET_BOOKS }] });

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.epub')) {
      setError(t('library.epubOnly'));
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError(t('library.fileTooLarge'));
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const fileBase64 = btoa(binary);

      const { data: uploadData } = await uploadBookMutation({ variables: { fileBase64 } });
      const bookId = uploadData?.uploadBook?.id;

      logger.info('Book uploaded successfully', { bookId });
      window.dispatchEvent(new Event(WindowEvents.BOOKS_CHANGED));
      onUploadComplete();
    } catch (err) {
      logger.error('Upload failed', err);
      setError(t('library.uploadFailed'));
    } finally {
      setUploading(false);
    }
  }, [t, onUploadComplete, uploadBookMutation]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="mb-6">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
        }`}
      >
        <input
          type="file"
          accept=".epub"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
          aria-label={t('library.uploadEpub')}
        />
        <svg className="w-10 h-10 mx-auto text-gray-400 dark:text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {uploading ? t('library.uploading') : t('library.dropEpub')}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('library.maxSize')}</p>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>
      )}
    </div>
  );
}

interface Chapter {
  index: number;
  title: string;
  href: string;
  characterCount: number;
  audioUrl?: string;
}

function loadSort(): SortOption {
  try {
    const stored = localStorage.getItem(StorageKeys.LIBRARY_SORT);
    if (stored === 'recentlyAdded' || stored === 'recentlyRead' || stored === 'titleAZ') return stored;
  } catch { /* ignore */ }
  return 'recentlyAdded';
}

export default function DigitalLibrary() {
  const { t } = useTranslation();
  const { bookId: urlBookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const pendingBookIdRef = useRef<string | undefined>(urlBookId);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>(loadSort);
  const { getAllProgress, clearProgress } = useReadingProgress();

  const { data, loading, refetch } = useQuery(GET_BOOKS);
  const { data: nasData } = useQuery(GET_NAS_CONNECTION_STATUS);
  const nasConnected = nasData?.nasConnectionStatus?.status === 'connected';
  const [fetchChapters] = useLazyQuery(GET_BOOK_CHAPTERS, { fetchPolicy: 'network-only' });
  const [deleteBookMutation] = useMutation(DELETE_BOOK, {
    refetchQueries: [{ query: GET_BOOKS }],
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const books: Book[] = (data?.books ?? []) as Book[];

  // Refetch when BOOKS_CHANGED event fires (after upload)
  useEffect(() => {
    const handleBooksChanged = () => refetch();
    window.addEventListener(WindowEvents.BOOKS_CHANGED, handleBooksChanged);
    return () => window.removeEventListener(WindowEvents.BOOKS_CHANGED, handleBooksChanged);
  }, [refetch]);

  const progressMap = useMemo(() => getAllProgress(), [getAllProgress, books]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSortChange = useCallback((value: SortOption) => {
    setSort(value);
    try { localStorage.setItem(StorageKeys.LIBRARY_SORT, value); } catch { /* ignore */ }
  }, []);

  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? books.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
      : [...books];

    if (sort === 'titleAZ') {
      return filtered.sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sort === 'recentlyRead') {
      return filtered.sort((a, b) => {
        const pa = progressMap[a.id]?.readAt ?? 0;
        const pb = progressMap[b.id]?.readAt ?? 0;
        return pb - pa;
      });
    }
    // recentlyAdded — keep server order (uploadedAt desc from GraphQL)
    return filtered;
  }, [books, search, sort, progressMap]);

  const handleDelete = useCallback(async (bookId: string) => {
    if (!confirm(t('library.confirmDelete'))) return;
    try {
      await deleteBookMutation({ variables: { id: bookId } });
      clearProgress(bookId);
      logger.info('Book deleted', { bookId });
    } catch (err) {
      logger.error('Failed to delete book', err);
    }
  }, [t, deleteBookMutation, clearProgress]);

  const handleSelect = useCallback(async (book: Book, tab?: 'read' | 'listen') => {
    try {
      const result = await fetchChapters({ variables: { bookId: book.id } });
      const rawChapters = result.data?.bookChapters ?? [];
      setChapters(rawChapters as Chapter[]);
    } catch (err) {
      logger.error('Failed to fetch chapters', err);
    }
    setSelectedBook(book);
    window.dispatchEvent(new CustomEvent(WindowEvents.BREADCRUMB_DETAIL, { detail: book.title }));
    // Preserve chapter + autoPlay params from original URL when auto-selecting from widget nav
    const currentParams = new URLSearchParams(window.location.search);
    const chapterParam = currentParams.get('chapter');
    const autoPlayParam = currentParams.get('autoPlay');
    let url: string;
    if (tab) {
      const params = new URLSearchParams({ tab });
      if (tab === 'listen') {
        params.set('autoPlay', autoPlayParam || '1');
        if (chapterParam) params.set('chapter', chapterParam);
      }
      url = `/library/${book.id}?${params.toString()}`;
    } else {
      url = `/library/${book.id}`;
    }
    navigate(url, { replace: true });
  }, [navigate, fetchChapters]);

  const handleSelectListen = useCallback((book: Book) => {
    handleSelect(book, 'listen');
  }, [handleSelect]);

  const handleBack = useCallback(() => {
    setSelectedBook(null);
    setChapters([]);
    navigate('/library', { replace: true });
  }, [navigate]);

  // Auto-select book from URL param after books load
  useEffect(() => {
    const targetId = pendingBookIdRef.current;
    if (!targetId || books.length === 0 || selectedBook) return;
    const book = books.find(b => b.id === targetId);
    if (book) {
      pendingBookIdRef.current = undefined;
      const tab = searchParams.get('tab') === 'listen' ? 'listen' as const : undefined;
      handleSelect(book, tab);
    }
  }, [books, selectedBook, handleSelect, searchParams]);

  // Listen for breadcrumb "Library" click to navigate back to book list
  useEffect(() => {
    const handler = () => {
      setSelectedBook(null);
      setChapters([]);
      navigate('/library', { replace: true });
    };
    window.addEventListener('breadcrumb-navigate-parent', handler);
    return () => window.removeEventListener('breadcrumb-navigate-parent', handler);
  }, [navigate]);

  if (selectedBook) {
    return (
      <PageContent fill>
      <BookReader
        bookId={selectedBook.id}
        epubUrl={selectedBook.epubUrl}
        title={selectedBook.title}
        chapters={chapters}
        coverUrl={selectedBook.coverUrl}
        language={selectedBook.language || 'en'}
        audioStatus={selectedBook.audioStatus}
        audioProgress={selectedBook.audioProgress}
        epubNasArchived={selectedBook.epubNasArchived}
        onBack={handleBack}
        onRefreshChapters={async () => {
          const result = await fetchChapters({ variables: { bookId: selectedBook.id } });
          const rawChapters = result.data?.bookChapters ?? [];
          setChapters(rawChapters as Chapter[]);
        }}
      />
      </PageContent>
    );
  }

  return (
    <PageContent>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('library.title')}</h2>
      </div>

      <BookUpload onUploadComplete={refetch} />

      <TtsQuotaBar />

      {!loading && books.length > 0 && (
        <LibrarySearchSort
          search={search}
          sort={sort}
          onSearch={setSearch}
          onSort={handleSortChange}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">{t('library.emptyLibrary')}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('library.uploadFirst')}</p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">{t('library.noResults' as any)}</p> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredBooks.map(book => (
            <BookCard
              key={book.id}
              book={book}
              onSelect={handleSelect}
              onSelectListen={handleSelectListen}
              onDelete={handleDelete}
              readPercent={progressMap[book.id]?.percent}
              nasConnected={nasConnected}
              onRefresh={refetch}
            />
          ))}
        </div>
      )}
    </PageContent>
  );
}
