import { useState, useEffect } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { WorshipSong, SongFormat } from '../types';

const KEYS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];

interface SongEditorProps {
  song?: WorshipSong | null;
  onSave: (data: Omit<WorshipSong, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel: () => void;
}

export default function SongEditor({ song, onSave, onDelete, onCancel }: SongEditorProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [originalKey, setOriginalKey] = useState('G');
  const [format, setFormat] = useState<SongFormat>('chordpro');
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (song) {
      setTitle(song.title);
      setArtist(song.artist);
      setOriginalKey(song.originalKey);
      setFormat(song.format);
      setContent(song.content);
      setNotes(song.notes);
      setYoutubeUrl(song.youtubeUrl || '');
      setTagsInput(song.tags?.join(', ') || '');
    }
  }, [song]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    try {
      const tags = tagsInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      await onSave({
        title: title.trim(),
        artist: artist.trim(),
        originalKey,
        format,
        content,
        notes: notes.trim(),
        youtubeUrl: youtubeUrl.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
    } catch (err) {
      console.error('Failed to save song:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setSaving(true);
    try {
      await onDelete();
    } catch (err) {
      console.error('Failed to delete song:', err);
    } finally {
      setSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onCancel}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {song ? t('worship.editSong') : t('worship.addSong')}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
        {/* Title */}
        <div>
          <label htmlFor="song-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('worship.songTitle')} *
          </label>
          <input
            id="song-title"
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Artist */}
        <div>
          <label htmlFor="song-artist" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('worship.artist')}
          </label>
          <input
            id="song-artist"
            type="text"
            value={artist}
            onChange={e => setArtist(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Key & Format row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="song-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('worship.originalKey')}
            </label>
            <select
              id="song-key"
              value={originalKey}
              onChange={e => setOriginalKey(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {KEYS.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('worship.format')}
            </label>
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button
                type="button"
                onClick={() => setFormat('chordpro')}
                className={`flex-1 px-3 py-2 text-sm font-medium transition ${
                  format === 'chordpro'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {t('worship.formatChordpro')}
              </button>
              <button
                type="button"
                onClick={() => setFormat('text')}
                className={`flex-1 px-3 py-2 text-sm font-medium transition ${
                  format === 'text'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {t('worship.formatText')}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          <label htmlFor="song-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('worship.content')} *
          </label>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
            {format === 'chordpro' ? t('worship.contentHintChordpro') : t('worship.contentHintText')}
          </p>
          <textarea
            id="song-content"
            required
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={12}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm leading-relaxed resize-y"
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="song-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('worship.notes')}
          </label>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
            {t('worship.notesHint')}
          </p>
          <textarea
            id="song-notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-y"
          />
        </div>

        {/* YouTube URL */}
        <div>
          <label htmlFor="song-youtube" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('worship.youtubeUrl')}
          </label>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
            {t('worship.youtubeUrlHint')}
          </p>
          <input
            id="song-youtube"
            type="url"
            value={youtubeUrl}
            onChange={e => setYoutubeUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          />
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="song-tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('worship.tags')}
          </label>
          <input
            id="song-tags"
            type="text"
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
            placeholder="praise, hymn, christmas..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || !title.trim() || !content.trim()}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? t('worship.saving') : t('worship.save')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm font-medium"
          >
            {t('worship.cancel')}
          </button>

          {song && onDelete && (
            <div className="ml-auto">
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600 dark:text-red-400">
                    {t('worship.deleteConfirm')}
                  </span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={saving}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium disabled:opacity-50"
                  >
                    {t('worship.deleteSong')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 text-gray-600 dark:text-gray-400 text-sm"
                  >
                    {t('worship.cancel')}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition text-sm font-medium"
                >
                  {t('worship.deleteSong')}
                </button>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
