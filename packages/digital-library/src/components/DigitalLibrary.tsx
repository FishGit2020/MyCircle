import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation, WindowEvents, createLogger } from '@mycircle/shared';
import BookReader from './BookReader';
import { useParams, useNavigate } from 'react-router';

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
  audioStatus: 'none' | 'processing' | 'complete' | 'error';
  audioProgress: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function BookCard({ book, onSelect, onDelete, currentUid }: {
  book: Book;
  onSelect: (book: Book) => void;
  onDelete: (bookId: string) => void;
  currentUid: string | null;
}) {
  const { t } = useTranslation();
  const isOwner = currentUid === book.uploadedBy?.uid;

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
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
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
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
              {t('library.audioAvailable')}
            </span>
          )}
          {book.audioStatus === 'processing' && (
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
      {isOwner && (
        <div className="px-4 pb-3">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(book.id); }}
            className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors min-h-[44px] flex items-center"
            aria-label={`${t('library.deleteBook')}: ${book.title}`}
          >
            {t('library.delete')}
          </button>
        </div>
      )}
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

      // Convert file to base64 and upload in one step (same pattern as cloudFiles)
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
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const pendingBookIdRef = useRef<string | undefined>(urlBookId);

  const fetchBooks = useCallback(async () => {
    try {
      const token = await window.__getFirebaseIdToken?.();
      if (!token) {
        setLoading(false);
        return;
      }
      const apiBase = window.__digitalLibraryApiBase?.() || '';
      const res = await fetch(`${apiBase}/digital-library-api/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch books');
      const data = await res.json();
      setBooks(data.books || []);
    } catch (err) {
      logger.error('Failed to fetch books', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Listen for auth state and book changes
  useEffect(() => {
    const handleAuth = () => {
      window.__getFirebaseIdToken?.().then(token => {
        setCurrentUid(token ? (window as Record<string, unknown>).__currentUid as string || null : null);
      });
    };
    const handleBooksChanged = () => fetchBooks();

    window.addEventListener(WindowEvents.AUTH_STATE_CHANGED, handleAuth);
    window.addEventListener(WindowEvents.BOOKS_CHANGED, handleBooksChanged);
    handleAuth();
    return () => {
      window.removeEventListener(WindowEvents.AUTH_STATE_CHANGED, handleAuth);
      window.removeEventListener(WindowEvents.BOOKS_CHANGED, handleBooksChanged);
    };
  }, [fetchBooks]);

  const handleDelete = useCallback(async (bookId: string) => {
    if (!confirm(t('library.confirmDelete'))) return;
    try {
      const token = await window.__getFirebaseIdToken?.();
      if (!token) return;
      const apiBase = window.__digitalLibraryApiBase?.() || '';
      const res = await fetch(`${apiBase}/digital-library-api/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookId }),
      });
      if (!res.ok) throw new Error('Delete failed');
      logger.info('Book deleted', { bookId });
      window.dispatchEvent(new Event(WindowEvents.BOOKS_CHANGED));
    } catch (err) {
      logger.error('Failed to delete book', err);
    }
  }, [t]);

  const handleSelect = useCallback(async (book: Book) => {
    try {
      const token = await window.__getFirebaseIdToken?.();
      if (!token) return;
      const apiBase = window.__digitalLibraryApiBase?.() || '';
      const res = await fetch(`${apiBase}/digital-library-api/chapters/${book.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setChapters(data.chapters || []);
      }
    } catch (err) {
      logger.error('Failed to fetch chapters', err);
    }
    setSelectedBook(book);
    // Update URL to /library/:bookId
    navigate(`/library/${book.id}`, { replace: true });
    // Broadcast book title for breadcrumb
    window.dispatchEvent(new CustomEvent(WindowEvents.BREADCRUMB_DETAIL, { detail: book.title }));
  }, [navigate]);

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
      handleSelect(book);
    }
  }, [books, selectedBook, handleSelect]);

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
      <BookReader
        bookId={selectedBook.id}
        epubUrl={selectedBook.epubUrl}
        title={selectedBook.title}
        chapters={chapters}
        language={selectedBook.language || 'en'}
        audioStatus={selectedBook.audioStatus}
        audioProgress={selectedBook.audioProgress}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="pb-20 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('library.title')}</h2>
      </div>

      <BookUpload onUploadComplete={fetchBooks} />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
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
              onDelete={handleDelete}
              currentUid={currentUid}
            />
          ))}
        </div>
      )}
    </div>
  );
}
