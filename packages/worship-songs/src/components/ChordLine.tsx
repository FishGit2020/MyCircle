
interface ChordLineProps {
  line: string;
}

interface ChordSegment {
  chord: string;
  lyric: string;
}

function parseChordProLine(line: string): ChordSegment[] {
  const segments: ChordSegment[] = [];
  const regex = /\[([^\]]+)\]([^[]*)/g;
  let match: RegExpExecArray | null;
  let lastIndex = 0;

  // Text before the first chord
  const preMatch = line.match(/^([^[]*)\[/);
  if (preMatch && preMatch[1]) {
    segments.push({ chord: '', lyric: preMatch[1] });
  } else if (!line.includes('[')) {
    // No chords in this line — return as plain lyric
    return [{ chord: '', lyric: line }];
  }

  while ((match = regex.exec(line)) !== null) {
    segments.push({ chord: match[1], lyric: match[2] });
    lastIndex = regex.lastIndex;
  }

  // Trailing text after last chord match (shouldn't happen with valid ChordPro)
  if (lastIndex < line.length && lastIndex > 0 && segments.length === 0) {
    segments.push({ chord: '', lyric: line.slice(lastIndex) });
  }

  return segments;
}

export default function ChordLine({ line }: ChordLineProps) {
  const segments = parseChordProLine(line);

  if (segments.length === 0) {
    return <div className="h-4" />;
  }

  // If no chords at all, render as plain text
  const hasChords = segments.some(s => s.chord);
  if (!hasChords) {
    return (
      <div className="font-mono text-sm leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre">
        {segments.map(s => s.lyric).join('')}
      </div>
    );
  }

  return (
    <div className="font-mono text-sm leading-none">
      {/* Chord row */}
      <div className="text-blue-600 dark:text-blue-400 font-bold whitespace-pre h-5">
        {segments.map((seg, i) => {
          const lyricLen = Math.max(seg.lyric.length, seg.chord.length);
          const padding = lyricLen - seg.chord.length;
          return (
            <span key={i}>
              {seg.chord}{padding > 0 ? ' '.repeat(padding) : ' '}
            </span>
          );
        })}
      </div>
      {/* Lyric row */}
      <div className="text-gray-800 dark:text-gray-200 whitespace-pre">
        {segments.map((seg, i) => {
          const chordLen = seg.chord.length;
          const padding = Math.max(0, chordLen - seg.lyric.length);
          return (
            <span key={i}>
              {seg.lyric}{padding > 0 ? ' '.repeat(padding) : chordLen > 0 && !seg.lyric ? ' ' : ''}
            </span>
          );
        })}
      </div>
    </div>
  );
}
