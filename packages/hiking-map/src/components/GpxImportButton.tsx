import { useRef, useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import { parseGpx } from '../services/gpxService';
import type { GpxTrack } from '../services/gpxService';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

interface Props {
  onImport: (track: GpxTrack) => void;
}

export default function GpxImportButton({ onImport }: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [tracks, setTracks] = useState<GpxTrack[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!inputRef.current) return;
    inputRef.current.value = '';
    if (!file) return;

    setError('');
    setTracks([]);
    setShowPicker(false);

    if (file.size > MAX_FILE_BYTES) {
      setError(t('hiking.importFileTooLarge'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const parsed = parseGpx(text);
      if (parsed.length === 0) {
        setError(t('hiking.importNoTracks'));
        return;
      }
      if (parsed.length === 1) {
        onImport(parsed[0]);
      } else {
        setTracks(parsed);
        setShowPicker(true);
      }
    };
    reader.onerror = () => setError(t('hiking.importError'));
    reader.readAsText(file);
  };

  const handleSelectTrack = (track: GpxTrack) => {
    setShowPicker(false);
    setTracks([]);
    onImport(track);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".gpx,application/gpx+xml"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={handleFileChange}
      />
      <button
        type="button"
        aria-label={t('hiking.importGpx')}
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition min-h-[44px]"
      >
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 12V4m0 8l-3-3m3 3l3-3" />
        </svg>
        {t('hiking.importGpx')}
      </button>

      {error && (
        <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>
      )}

      {showPicker && tracks.length > 0 && (
        <div className="mt-2 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
          <p className="px-2 py-1.5 text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
            {t('hiking.importTrackCount').replace('{count}', String(tracks.length))}
          </p>
          {tracks.map((track, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelectTrack(track)}
              className="w-full text-left px-2 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 transition border-b last:border-b-0 border-gray-100 dark:border-gray-700"
            >
              <span className="font-medium text-gray-900 dark:text-white block truncate">{track.name}</span>
              <span className="text-gray-400">{(track.distanceM / 1000).toFixed(1)} km</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
