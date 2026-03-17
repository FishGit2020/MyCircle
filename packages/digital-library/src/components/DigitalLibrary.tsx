import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation, WindowEvents, createLogger, PageContent, useQuery, useMutation, useLazyQuery, GET_BOOKS, GET_BOOK_CHAPTERS, DELETE_BOOK } from '@mycircle/shared';
import BookReader from './BookReader';
import { useParams, useNavigate, useSearchParams } from 'react-router';

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
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function BookCard({ book, onSelect, onSelectListen, onDelete }: {
  book: Book;
  onSelect: (book: Book) => void;
  onSelectListen: (book: Book) => void;
  onDelete: (bookId: string) => void;
}) {
  const { t } = useTranslation();

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
          {book.audioStatus === 'complete' && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onSelectListen(book); }}
              className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-medium bg-green-500 dark:bg-green-600 text-white hover:bg-green-600 dark:hover:bg-green-500 transition-colors active:scale-95 min-h-[36px]"
              aria-label={`${t('library.listenNow')}: ${book.title}`}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              {t('library.audioAvailable')}
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
      <div className="px-4 pb-3 flex items-center justify-between">
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
      const token = await window.__getFirebaseIdToken?.();
      if (!token) {
        setError(t('library.authRequired'));
        return;
      }

      const apiBase = window.__digitalLibraryApiBase?.() || '';

      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const fileBase64 = btoa(binary);

      const res = await fetch(`${apiBase}/digital-library-api/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fileBase64 }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { bookId } = await res.json();

      logger.info('Book uploaded successfully', { bookId });
      window.dispatchEvent(new Event(WindowEvents.BOOKS_CHANGED));
      onUploadComplete();
    } catch (err) {
      logger.error('Upload failed', err);
      setError(t('library.uploadFailed'));
    } finally {
      setUploading(false);
    }
  }, [t, onUploadComplete]);

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

export default function DigitalLibrary() {
  const { t } = useTranslation();
  const { bookId: urlBookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const pendingBookIdRef = useRef<string | undefined>(urlBookId);

  const { data, loading, refetch } = useQuery(GET_BOOKS);
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

  const handleDelete = useCallback(async (bookId: string) => {
    if (!confirm(t('library.confirmDelete'))) return;
    try {
      await deleteBookMutation({ variables: { id: bookId } });
      logger.info('Book deleted', { bookId });
    } catch (err) {
      logger.error('Failed to delete book', err);
    }
  }, [t, deleteBookMutation]);

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
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {books.map(book => (
            <BookCard
              key={book.id}
              book={book}
              onSelect={handleSelect}
              onSelectListen={handleSelectListen}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </PageContent>
  );
}
