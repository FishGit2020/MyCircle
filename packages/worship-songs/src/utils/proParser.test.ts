import { describe, it, expect } from 'vitest';
import { stripRtf, decodeRtfBase64, parseProFile } from './proParser';

describe('stripRtf', () => {
  it('returns empty string for empty input', () => {
    expect(stripRtf('')).toBe('');
    expect(stripRtf(null as unknown as string)).toBe('');
    expect(stripRtf(undefined as unknown as string)).toBe('');
  });

  it('extracts plain text from simple RTF', () => {
    const rtf = String.raw`{\rtf1\ansi Hello World}`;
    expect(stripRtf(rtf)).toBe('Hello World');
  });

  it('handles \\par as newlines', () => {
    const rtf = String.raw`{\rtf1\ansi Line one\par Line two}`;
    const result = stripRtf(rtf);
    expect(result).toContain('Line one');
    expect(result).toContain('Line two');
    expect(result).toMatch(/Line one\nLine two/);
  });

  it('handles \\line as newlines', () => {
    const rtf = String.raw`{\rtf1\ansi Line one\line Line two}`;
    const result = stripRtf(rtf);
    expect(result).toMatch(/Line one\nLine two/);
  });

  it('handles hex escapes', () => {
    // \'e9 is e-acute
    const rtf = String.raw`{\rtf1\ansi Caf\'e9}`;
    expect(stripRtf(rtf)).toBe('Caf\u00e9');
  });

  it('strips font tables and color tables', () => {
    const rtf = String.raw`{\rtf1\ansi{\fonttbl\f0\fswiss Arial;}{\colortbl\red0\green0\blue0;} Hello}`;
    expect(stripRtf(rtf)).toBe('Hello');
  });

  it('strips destination groups', () => {
    const rtf = String.raw`{\rtf1\ansi{\*\generator Riched20;} Hello}`;
    expect(stripRtf(rtf)).toBe('Hello');
  });
});

describe('decodeRtfBase64', () => {
  it('returns empty string for invalid input', () => {
    expect(decodeRtfBase64('')).toBe('');
    expect(decodeRtfBase64(null as unknown as string)).toBe('');
  });

  it('decodes base64-encoded RTF', () => {
    // Encode a simple RTF string
    const rtf = String.raw`{\rtf1\ansi Amazing Grace}`;
    const encoded = btoa(rtf);
    expect(decodeRtfBase64(encoded)).toBe('Amazing Grace');
  });

  it('returns empty string for invalid base64', () => {
    expect(decodeRtfBase64('not-valid-base64!!!')).toBe('');
  });
});

describe('parseProFile', () => {
  it('returns fallback title from filename when XML is empty', () => {
    const result = parseProFile('', 'Amazing Grace.pro');
    expect(result.title).toBe('Amazing Grace');
    expect(result.content).toBe('');
    expect(result.artist).toBe('');
  });

  it('strips .pro extension variants from filename', () => {
    expect(parseProFile('', 'My Song.pro5').title).toBe('My Song');
    expect(parseProFile('', 'My Song.pro6').title).toBe('My Song');
    expect(parseProFile('', 'My Song.pro7').title).toBe('My Song');
  });

  it('replaces underscores and hyphens in filename', () => {
    expect(parseProFile('', 'amazing_grace-2.pro').title).toBe('amazing grace 2');
  });

  it('returns Untitled when no filename provided', () => {
    expect(parseProFile('')).toEqual({ title: 'Untitled', content: '', artist: '' });
  });

  it('extracts title from CCLISongTitle attribute', () => {
    const xml = '<RVPresentationDocument CCLISongTitle="How Great Thou Art" label="HGTA"></RVPresentationDocument>';
    const result = parseProFile(xml, 'fallback.pro');
    expect(result.title).toBe('How Great Thou Art');
  });

  it('extracts title from label attribute as fallback', () => {
    const xml = '<RVPresentationDocument label="Amazing Grace"></RVPresentationDocument>';
    const result = parseProFile(xml, 'fallback.pro');
    expect(result.title).toBe('Amazing Grace');
  });

  it('extracts artist from CCLIArtistCredits', () => {
    const xml = '<RVPresentationDocument CCLIArtistCredits="John Newton" label="AG"></RVPresentationDocument>';
    const result = parseProFile(xml);
    expect(result.artist).toBe('John Newton');
  });

  it('extracts slides from RTFData attributes', () => {
    const verse1 = btoa(String.raw`{\rtf1\ansi Amazing grace how sweet the sound}`);
    const verse2 = btoa(String.raw`{\rtf1\ansi That saved a wretch like me}`);
    const xml = `<RVPresentationDocument label="Amazing Grace">
      <RVDisplaySlide><RVTextElement RTFData="${verse1}"/></RVDisplaySlide>
      <RVDisplaySlide><RVTextElement RTFData="${verse2}"/></RVDisplaySlide>
    </RVPresentationDocument>`;

    const result = parseProFile(xml);
    expect(result.title).toBe('Amazing Grace');
    expect(result.content).toContain('Amazing grace how sweet the sound');
    expect(result.content).toContain('That saved a wretch like me');
    // Slides separated by double newline
    expect(result.content).toContain('\n\n');
  });

  it('deduplicates identical slides', () => {
    const verse = btoa(String.raw`{\rtf1\ansi Same verse}`);
    const xml = `<RVPresentationDocument label="Test">
      <RVTextElement RTFData="${verse}"/>
      <RVTextElement RTFData="${verse}"/>
    </RVPresentationDocument>`;

    const result = parseProFile(xml);
    expect(result.content).toBe('Same verse');
  });

  it('skips empty RTFData', () => {
    const empty = btoa(String.raw`{\rtf1\ansi }`);
    const verse = btoa(String.raw`{\rtf1\ansi Real content}`);
    const xml = `<RVPresentationDocument label="Test">
      <RVTextElement RTFData="${empty}"/>
      <RVTextElement RTFData="${verse}"/>
    </RVPresentationDocument>`;

    const result = parseProFile(xml);
    expect(result.content).toBe('Real content');
  });

  it('falls back to NSString elements for Pro7 format', () => {
    const verse = btoa(String.raw`{\rtf1\ansi Pro7 lyrics}`);
    const xml = `<RVPresentationDocument label="Test">
      <NSString rvXMLIvarName="RTFData">${verse}</NSString>
    </RVPresentationDocument>`;

    const result = parseProFile(xml);
    expect(result.content).toBe('Pro7 lyrics');
  });

  it('handles null/undefined xml gracefully', () => {
    expect(parseProFile(null as unknown as string).title).toBe('Untitled');
    expect(parseProFile(undefined as unknown as string).title).toBe('Untitled');
  });
});
