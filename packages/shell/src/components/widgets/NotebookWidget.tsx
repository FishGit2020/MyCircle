import React, { useEffect } from 'react';
import { useTranslation, StorageKeys, WindowEvents } from '@mycircle/shared';

const NotebookWidget = React.memo(function NotebookWidget() {
  const { t } = useTranslation();
  const [noteCount, setNoteCount] = React.useState<number | null>(null);
  const [publicCount, setPublicCount] = React.useState<number | null>(null);

  useEffect(() => {
    function loadFromCache() {
      try {
        const stored = localStorage.getItem(StorageKeys.NOTEBOOK_CACHE);
        if (stored) setNoteCount(JSON.parse(stored));
        else setNoteCount(null);
      } catch { /* ignore */ }
    }

    function fetchDirect() {
      const api = window.__notebook;
      if (api?.getAll) {
        api.getAll().then((notes: any[]) => {
          setNoteCount(notes.length);
          try { localStorage.setItem(StorageKeys.NOTEBOOK_CACHE, JSON.stringify(notes.length)); } catch { /* ignore */ }
        }).catch(() => { /* ignore */ });
      }
    }

    loadFromCache();

    // On NOTEBOOK_CHANGED (fired by restoreUserData after getUserNotes resolves):
    // read cache AND fetch directly to ensure count is accurate
    const handleNotebookChanged = () => {
      loadFromCache();
      fetchDirect();
    };
    window.addEventListener(WindowEvents.NOTEBOOK_CHANGED, handleNotebookChanged);

    // On auth change: fetch with a short delay to ensure window.__notebook
    // has a valid auth.currentUser (it's set asynchronously by the shell)
    const handleAuth = () => {
      loadFromCache();
      fetchDirect();
      // Retry after 500ms in case the first call raced with auth init
      const timer = setTimeout(fetchDirect, 500);
      return () => clearTimeout(timer);
    };
    window.addEventListener(WindowEvents.AUTH_STATE_CHANGED, handleAuth);
    return () => {
      window.removeEventListener(WindowEvents.NOTEBOOK_CHANGED, handleNotebookChanged);
      window.removeEventListener(WindowEvents.AUTH_STATE_CHANGED, handleAuth);
    };
  }, []);

  // Fetch public notes count (lightweight — cached by Firestore persistence)
  useEffect(() => {
    function loadPublic() {
      const api = window.__notebook;
      if (api?.getAllPublic) {
        api.getAllPublic().then((notes: any[]) => {
          setPublicCount(notes.length);
        }).catch(() => { /* ignore */ });
      }
    }
    loadPublic();
    window.addEventListener(WindowEvents.AUTH_STATE_CHANGED, loadPublic);
    window.addEventListener(WindowEvents.PUBLIC_NOTES_CHANGED, loadPublic);
    return () => {
      window.removeEventListener(WindowEvents.AUTH_STATE_CHANGED, loadPublic);
      window.removeEventListener(WindowEvents.PUBLIC_NOTES_CHANGED, loadPublic);
    };
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.notebook')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.notebookDesc')}</p>
        </div>
      </div>
      <div className="space-y-1">
        {noteCount !== null && noteCount > 0 ? (
          <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
            {t('notebook.noteCount').replace('{count}', String(noteCount))}
          </p>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.noNotes')}</p>
        )}
        {publicCount !== null && publicCount > 0 && (
          <p className="text-xs text-indigo-500 dark:text-indigo-400/70">
            {t('widgets.publicNoteCount').replace('{count}', String(publicCount))}
          </p>
        )}
      </div>
    </div>
  );
});

export default NotebookWidget;
