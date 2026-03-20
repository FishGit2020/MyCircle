import type { Setlist, WorshipSong } from '../types';
import ChordLine from './ChordLine';

interface SetlistPrintViewProps {
  setlist: Setlist;
  songs: Record<string, WorshipSong | null>;
}

export default function SetlistPrintView({ setlist, songs }: SetlistPrintViewProps) {
  return (
    <div data-print-show>
      <h1 className="text-2xl font-bold mb-1">{setlist.name}</h1>
      {setlist.serviceDate && (
        <p className="text-sm text-gray-500 mb-6">{setlist.serviceDate}</p>
      )}
      {setlist.entries.map((entry, index) => {
        const song = songs[entry.songId];
        return (
          <section key={`${entry.songId}-${index}`} className="mb-10 break-inside-avoid">
            <div className="border-b border-gray-300 pb-2 mb-3">
              <h2 className="text-lg font-bold">
                {index + 1}. {song ? song.title : entry.snapshotTitle}
              </h2>
              {song?.artist && <p className="text-sm text-gray-600">{song.artist}</p>}
              <span className="text-xs font-medium text-blue-600">
                Key: {song ? song.originalKey : entry.snapshotKey}
              </span>
            </div>
            {!song ? (
              <p className="text-sm text-gray-400 italic">Song not found</p>
            ) : song.format === 'chordpro' ? (
              <div className="space-y-0.5 text-sm font-mono">
                {song.content.split('\n').map((line, i) => (
                  <ChordLine key={i} line={line} />
                ))}
              </div>
            ) : (
              <pre className="text-sm font-mono whitespace-pre-wrap">{song.content}</pre>
            )}
          </section>
        );
      })}
    </div>
  );
}
