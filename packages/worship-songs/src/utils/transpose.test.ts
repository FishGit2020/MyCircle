import { describe, it, expect } from 'vitest';
import { transposeChord, transposeContent } from './transpose';

describe('transposeChord', () => {
  it('returns the same chord when semitones is 0', () => {
    expect(transposeChord('G', 0)).toBe('G');
  });

  it('transposes up by 1 semitone', () => {
    expect(transposeChord('C', 1)).toBe('C#');
    expect(transposeChord('E', 1)).toBe('F');
    expect(transposeChord('B', 1)).toBe('C');
  });

  it('transposes down by 1 semitone', () => {
    expect(transposeChord('C', -1)).toBe('B');
    expect(transposeChord('F', -1)).toBe('E');
  });

  it('preserves chord quality', () => {
    expect(transposeChord('Am', 2)).toBe('Bm');
    expect(transposeChord('G7', 1)).toBe('G#7');
    expect(transposeChord('Dm7', 2)).toBe('Em7');
  });

  it('handles slash chords', () => {
    expect(transposeChord('G/B', 2)).toBe('A/C#');
    expect(transposeChord('C/E', 1)).toBe('C#/F');
  });

  it('uses flats for flat keys', () => {
    expect(transposeChord('C', 5)).toBe('F');
    expect(transposeChord('C', 1)).toBe('C#');
  });

  it('wraps around the chromatic scale', () => {
    expect(transposeChord('G', 12)).toBe('G');
    expect(transposeChord('G', -12)).toBe('G');
  });
});

describe('transposeContent', () => {
  it('transposes all chords in ChordPro content', () => {
    const input = '[G]Amazing [C]grace';
    const result = transposeContent(input, 2);
    expect(result).toBe('[A]Amazing [D]grace');
  });

  it('returns unchanged content when semitones is 0', () => {
    const input = '[G]Amazing [C]grace';
    expect(transposeContent(input, 0)).toBe(input);
  });

  it('handles lines without chords', () => {
    const input = 'Just plain text';
    expect(transposeContent(input, 2)).toBe(input);
  });
});
