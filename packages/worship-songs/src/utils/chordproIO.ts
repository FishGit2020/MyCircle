/**
 * ChordPro format import/export utilities.
 *
 * Import:  Reads a .cho/.chordpro file and extracts metadata + content.
 * Export:  Wraps internal content with ChordPro metadata headers.
 *
 * ChordPro metadata directives we handle:
 *   {title: ...} or {t: ...}
 *   {artist: ...} or {a: ...}
 *   {key: ...}
 *   {tempo: ...}
 *   {comment: ...} or {c: ...}
 */

export interface ChordProParseResult {
  title: string;
  artist: string;
  key: string;
  bpm: number | undefined;
  content: string;
  notes: string;
}

/**
 * Parse a ChordPro (.cho / .chordpro) file string into structured data.
 * Strips metadata directives from the body and returns them separately.
 */
export function parseChordPro(raw: string): ChordProParseResult {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');

  let title = '';
  let artist = '';
  let key = '';
  let bpm: number | undefined;
  const comments: string[] = [];
  const bodyLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Match metadata directives: {directive: value}
    const directiveMatch = trimmed.match(
      /^\{(title|t|artist|a|subtitle|st|key|tempo|capo|comment|c|ci)\s*[:=]\s*(.*?)\}$/i,
    );

    if (directiveMatch) {
      const [, directive, value] = directiveMatch;
      const val = value.trim();
      const d = directive.toLowerCase();

      if (d === 'title' || d === 't') {
        title = val;
      } else if (d === 'artist' || d === 'a' || d === 'subtitle' || d === 'st') {
        artist = val;
      } else if (d === 'key') {
        key = val;
      } else if (d === 'tempo') {
        const n = parseInt(val, 10);
        if (n >= 30 && n <= 240) bpm = n;
      } else if (d === 'comment' || d === 'c' || d === 'ci') {
        comments.push(val);
      }
      continue;
    }

    // Section labels: {Verse 1}, {Chorus}, etc. — keep in body
    if (trimmed.match(/^\{[A-Z]/)) {
      bodyLines.push(trimmed);
      continue;
    }

    // Skip other directives we don't handle (e.g., {soc}, {eoc})
    if (trimmed.match(/^\{.*\}$/)) {
      continue;
    }

    bodyLines.push(line);
  }

  // Trim leading/trailing blank lines from body
  while (bodyLines.length > 0 && bodyLines[0].trim() === '') bodyLines.shift();
  while (bodyLines.length > 0 && bodyLines[bodyLines.length - 1].trim() === '') bodyLines.pop();

  return {
    title,
    artist,
    key: key || 'G',
    bpm,
    content: bodyLines.join('\n'),
    notes: comments.join('. '),
  };
}

/**
 * Read a File object as a ChordPro file.
 */
export async function readChordProFile(file: File): Promise<ChordProParseResult> {
  const text = await file.text();
  return parseChordPro(text);
}

/**
 * Export a song as a ChordPro string with metadata headers.
 */
export function toChordProString(song: {
  title: string;
  artist: string;
  originalKey: string;
  content: string;
  bpm?: number;
  notes?: string;
}): string {
  const lines: string[] = [];
  lines.push(`{title: ${song.title}}`);
  if (song.artist) lines.push(`{artist: ${song.artist}}`);
  lines.push(`{key: ${song.originalKey}}`);
  if (song.bpm) lines.push(`{tempo: ${song.bpm}}`);
  if (song.notes) lines.push(`{comment: ${song.notes}}`);
  lines.push('');
  lines.push(song.content);
  return lines.join('\n');
}
