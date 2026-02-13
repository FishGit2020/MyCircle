const CHROMATIC_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const CHROMATIC_FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Keys that are conventionally written with flats
const FLAT_KEYS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb']);

function noteIndex(note: string): number {
  const idx = CHROMATIC_SHARP.indexOf(note);
  if (idx !== -1) return idx;
  return CHROMATIC_FLAT.indexOf(note);
}

function useFlats(targetRoot: string): boolean {
  return FLAT_KEYS.has(targetRoot);
}

/**
 * Transpose a single chord (e.g. "G", "C#m", "G/B", "Dm7") by N semitones.
 */
export function transposeChord(chord: string, semitones: number): string {
  if (semitones === 0) return chord;

  // Match root note, optional quality, optional slash bass
  const match = chord.match(/^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/);
  if (!match) return chord;

  const [, root, quality, bass] = match;
  const rootIdx = noteIndex(root);
  if (rootIdx === -1) return chord;

  const newRootIdx = ((rootIdx + semitones) % 12 + 12) % 12;
  const scale = useFlats(CHROMATIC_SHARP[newRootIdx]) ? CHROMATIC_FLAT : CHROMATIC_SHARP;
  let result = scale[newRootIdx] + quality;

  if (bass) {
    const bassIdx = noteIndex(bass);
    if (bassIdx !== -1) {
      const newBassIdx = ((bassIdx + semitones) % 12 + 12) % 12;
      result += '/' + scale[newBassIdx];
    }
  }

  return result;
}

/**
 * Transpose all chords in ChordPro content (chords in [brackets]).
 */
export function transposeContent(content: string, semitones: number): string {
  if (semitones === 0) return content;
  return content.replace(/\[([^\]]+)\]/g, (_, chord) => `[${transposeChord(chord, semitones)}]`);
}
