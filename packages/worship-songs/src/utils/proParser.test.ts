import { describe, it, expect } from 'vitest';
import { stripRtf, decodeRtfBase64, parseProFile, extractEmbeddedRtf } from './proParser';

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

  it('handles backslash-newline as line break (Pro7 RTF)', () => {
    const rtf = '{\\rtf1\\ansi\\f0\\fs84 \\cf2 Grace upon grace\\\nMorning by morning}';
    const result = stripRtf(rtf);
    expect(result).toMatch(/Grace upon grace\nMorning by morning/);
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

  it('extracts lyrics from Pro7 binary with embedded RTF (Strategy 4)', () => {
    // Simulate Pro7 protobuf binary with raw RTF strings embedded
    const binary = [
      '\x00\x01\x02 some binary data ',
      String.raw`{\rtf1\ansi\ansicpg1252{\fonttbl\f0\fnil ITCAvantGardePro-Md;}` +
        String.raw`{\colortbl;\red255\green255\blue255;}` +
        String.raw`\f0\fs84 \cf2 Grace upon grace}`,
      ' \x00\x03 more binary ',
      String.raw`{\rtf1\ansi\ansicpg1252{\fonttbl\f0\fnil ITCAvantGardePro-Md;}` +
        String.raw`{\colortbl;\red255\green255\blue255;}` +
        String.raw`\f0\fs84 \cf2 Morning by morning}`,
    ].join('');

    const result = parseProFile(binary, 'On Repeat.pro');
    expect(result.title).toBe('On Repeat');
    expect(result.content).toContain('Grace upon grace');
    expect(result.content).toContain('Morning by morning');
  });

  it('deduplicates slides from Pro7 embedded RTF', () => {
    const rtfBlock = String.raw`{\rtf1\ansi\f0\fs84 Same verse}`;
    const binary = `\x00${rtfBlock}\x00${rtfBlock}\x00`;

    const result = parseProFile(binary, 'Test.pro');
    expect(result.content).toBe('Same verse');
  });
});

describe('extractEmbeddedRtf', () => {
  it('extracts RTF blocks from binary data', () => {
    const data = [
      '\x00binary\x00',
      String.raw`{\rtf1\ansi Hello World}`,
      '\x00more\x00',
      String.raw`{\rtf1\ansi Second Slide}`,
    ].join('');

    const results = extractEmbeddedRtf(data);
    expect(results).toEqual(['Hello World', 'Second Slide']);
  });

  it('returns empty array when no RTF found', () => {
    expect(extractEmbeddedRtf('no rtf here')).toEqual([]);
    expect(extractEmbeddedRtf('')).toEqual([]);
  });

  it('handles nested braces in RTF', () => {
    const rtf = String.raw`{\rtf1\ansi{\fonttbl\f0\fswiss Arial;} Hello}`;
    const data = `\x00${rtf}\x00`;
    const results = extractEmbeddedRtf(data);
    expect(results).toEqual(['Hello']);
  });
});
