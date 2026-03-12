/**
 * Parser for ProPresenter (.pro) files.
 *
 * ProPresenter files are XML documents containing slides with RTF-encoded
 * lyrics text inside <RVTextElement> nodes. This parser extracts the plain
 * text lyrics from those RTF blobs and combines the slides into a single
 * song content string.
 */

export interface ProParseResult {
  title: string;
  content: string;
  artist: string;
}

/**
 * Strip RTF formatting and return plain text.
 *
 * RTF control words we handle:
 *  - \par / \line  → newline
 *  - \'XX          → hex-encoded character
 *  - \uN           → Unicode code-point (followed by replacement char we skip)
 *  - {\*...}       → destination groups (skip)
 *  - other \word   → strip silently
 *  - { / }         → group delimiters (strip)
 */
export function stripRtf(rtf: string): string {
  if (!rtf || typeof rtf !== 'string') return '';

  // Remove destination groups like {\*\...\...}
  let cleaned = rtf.replace(/\{\\\*[^}]*\}/g, '');

  // Remove \fonttbl, \colortbl, \stylesheet and similar header groups
  cleaned = cleaned.replace(/\{\\(fonttbl|colortbl|stylesheet|info|pict)[^}]*\}/g, '');

  let result = '';
  let i = 0;
  let depth = 0;
  // Track whether we are inside the RTF header (before first text)
  let pastHeader = false;

  while (i < cleaned.length) {
    const ch = cleaned[i];

    if (ch === '{') {
      depth++;
      i++;
      continue;
    }

    if (ch === '}') {
      depth = Math.max(0, depth - 1);
      i++;
      continue;
    }

    if (ch === '\\') {
      i++;
      if (i >= cleaned.length) break;

      const next = cleaned[i];

      // \'XX hex escape
      if (next === "'") {
        i++;
        const hex = cleaned.substring(i, i + 2);
        i += 2;
        const code = parseInt(hex, 16);
        if (!isNaN(code)) {
          pastHeader = true;
          result += String.fromCharCode(code);
        }
        continue;
      }

      // \uN Unicode escape
      if (next === 'u' && /\d/.test(cleaned[i + 1] || '')) {
        i++; // skip 'u'
        let numStr = '';
        while (i < cleaned.length && /[\d-]/.test(cleaned[i])) {
          numStr += cleaned[i];
          i++;
        }
        const codePoint = parseInt(numStr, 10);
        if (!isNaN(codePoint) && codePoint >= 0) {
          pastHeader = true;
          result += String.fromCharCode(codePoint);
        }
        // Skip replacement character (one non-backslash char or a \' sequence)
        if (i < cleaned.length && cleaned[i] === '?') i++;
        continue;
      }

      // Read control word
      let word = '';
      while (i < cleaned.length && /[a-zA-Z]/.test(cleaned[i])) {
        word += cleaned[i];
        i++;
      }

      // Consume optional numeric parameter
      let param = '';
      while (i < cleaned.length && /[\d-]/.test(cleaned[i])) {
        param += cleaned[i];
        i++;
      }

      // Consume optional trailing space after control word
      if (i < cleaned.length && cleaned[i] === ' ') i++;

      if (word === 'par' || word === 'line') {
        if (pastHeader) result += '\n';
        continue;
      }

      if (word === 'tab') {
        result += '\t';
        continue;
      }

      // Skip other control words
      continue;
    }

    // Skip \r \n in RTF source (they are meaningless in RTF)
    if (ch === '\r' || ch === '\n') {
      i++;
      continue;
    }

    pastHeader = true;
    result += ch;
    i++;
  }

  return result.trim();
}

/**
 * Decode a base64-encoded RTF blob into plain text.
 */
export function decodeRtfBase64(base64: string): string {
  if (!base64 || typeof base64 !== 'string') return '';
  try {
    const decoded = atob(base64.trim());
    return stripRtf(decoded);
  } catch {
    return '';
  }
}

/**
 * Parse a ProPresenter (.pro) XML string and extract song data.
 *
 * Works with ProPresenter 5/6 XML format where slides are
 * `<RVDisplaySlide>` elements containing `<RVTextElement>` children
 * whose `RTFData` attribute holds base64-encoded RTF.
 *
 * Also handles ProPresenter 7 format where text may be in
 * `<NSString>` elements with base64 RTF.
 */
export function parseProFile(xml: string, filename?: string): ProParseResult {
  const fallbackTitle = filename
    ? filename.replace(/\.pro[0-9]*$/i, '').replace(/[_-]/g, ' ').trim()
    : 'Untitled';

  if (!xml || typeof xml !== 'string') {
    return { title: fallbackTitle, content: '', artist: '' };
  }

  // Try to extract title from XML attributes
  let title = '';
  let artist = '';

  // CCLISongTitle or label attribute on root element
  const titleMatch = xml.match(/CCLISongTitle="([^"]*)"/) ||
    xml.match(/label="([^"]*)"/) ||
    xml.match(/<RVPresentationDocument[^>]+label="([^"]*)"/);
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].trim();
  }

  // CCLIArtistCredits or artist attribute
  const artistMatch = xml.match(/CCLIArtistCredits="([^"]*)"/) ||
    xml.match(/artist="([^"]*)"/);
  if (artistMatch && artistMatch[1]) {
    artist = artistMatch[1].trim();
  }

  // Extract slides text
  const slides: string[] = [];

  // Strategy 1: RTFData attributes (ProPresenter 5/6)
  const rtfDataPattern = /RTFData="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = rtfDataPattern.exec(xml)) !== null) {
    const text = decodeRtfBase64(match[1]);
    if (text) {
      slides.push(text);
    }
  }

  // Strategy 2: <NSString> elements with base64 (ProPresenter 7 variant)
  if (slides.length === 0) {
    const nsStringPattern = /<NSString[^>]*>([\s\S]*?)<\/NSString>/g;
    while ((match = nsStringPattern.exec(xml)) !== null) {
      const text = decodeRtfBase64(match[1]);
      if (text) {
        slides.push(text);
      }
    }
  }

  // Strategy 3: Plain text in <RVTextElement> PlainText attribute
  if (slides.length === 0) {
    const plainTextPattern = /PlainText="([^"]*)"/g;
    while ((match = plainTextPattern.exec(xml)) !== null) {
      const decoded = match[1].trim();
      if (decoded) {
        try {
          slides.push(atob(decoded));
        } catch {
          slides.push(decoded);
        }
      }
    }
  }

  // Combine slides with blank line separators, skipping empty/duplicate slides
  const seen = new Set<string>();
  const uniqueSlides = slides.filter(s => {
    const normalized = s.trim();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });

  const content = uniqueSlides.join('\n\n');

  return {
    title: title || fallbackTitle,
    content,
    artist,
  };
}

/**
 * Read a .pro File object and parse it into song data.
 */
export async function readProFile(file: File): Promise<ProParseResult> {
  const text = await file.text();
  return parseProFile(text, file.name);
}
