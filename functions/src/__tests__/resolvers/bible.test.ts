import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import {
  convertToUsfmRef,
  bibleCache,
  createBibleQueryResolvers,
  DAILY_VERSES,
  DEFAULT_YOUVERSION_BIBLE_ID,
} from '../../resolvers/bible.js';

vi.mock('axios', () => {
  const mockCreate = vi.fn(() => ({ get: vi.fn() }));
  return {
    default: { get: vi.fn(), create: mockCreate },
  };
});

describe('bible resolvers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bibleCache.flushAll();
  });

  // ─── convertToUsfmRef ─────────────────────────────────────────

  it('converts "John 3" to "JHN.3"', () => {
    expect(convertToUsfmRef('John 3')).toBe('JHN.3');
  });

  it('converts "Genesis 1:1-10" to "GEN.1.1-10"', () => {
    expect(convertToUsfmRef('Genesis 1:1-10')).toBe('GEN.1.1-10');
  });

  it('converts "Psalms 23" to "PSA.23"', () => {
    expect(convertToUsfmRef('Psalms 23')).toBe('PSA.23');
  });

  it('converts single verse reference "Romans 8:28"', () => {
    expect(convertToUsfmRef('Romans 8:28')).toBe('ROM.8.28');
  });

  it('returns original string for unrecognized books', () => {
    expect(convertToUsfmRef('UnknownBook 1')).toBe('UnknownBook 1');
  });

  it('returns original string for unparseable input', () => {
    expect(convertToUsfmRef('hello')).toBe('hello');
  });

  // ─── DAILY_VERSES ─────────────────────────────────────────────

  it('DAILY_VERSES has 90 entries', () => {
    expect(DAILY_VERSES).toHaveLength(90);
  });

  // ─── createBibleQueryResolvers ────────────────────────────────

  describe('bibleVotd resolver', () => {
    it('returns curated verse reference based on day index (wrapping)', async () => {
      const resolvers = createBibleQueryResolvers(() => 'test-key');

      const result1 = await resolvers.bibleVotd(null, { day: 1 });
      expect(result1.reference).toBe(DAILY_VERSES[0].reference);

      // Day 91 should wrap to index 0
      const result91 = await resolvers.bibleVotd(null, { day: 91 });
      expect(result91.reference).toBe(DAILY_VERSES[0].reference);
    });
  });

  describe('bibleVersions resolver', () => {
    it('throws when API key is not configured', async () => {
      const resolvers = createBibleQueryResolvers(() => '');
      await expect(resolvers.bibleVersions()).rejects.toThrow('YOUVERSION_APP_KEY not configured');
    });
  });

  describe('biblePassage resolver', () => {
    it('uses default bible ID when translation is not provided', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: {
          content: '<span class="yv-v" v="1"></span><span class="yv-vlbl">1</span>In the beginning...',
          reference: 'Genesis 1',
          bible_abbreviation: 'NIV',
          copyright: 'NIV copyright',
        },
      });

      const resolvers = createBibleQueryResolvers(() => 'test-key');
      const result = await resolvers.biblePassage(null, { reference: 'Genesis 1' });

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/bibles/${DEFAULT_YOUVERSION_BIBLE_ID}/passages/`),
        expect.any(Object),
      );
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('reference');
      expect(result).toHaveProperty('translation');
      expect(result).toHaveProperty('verses');
    });
  });
});
