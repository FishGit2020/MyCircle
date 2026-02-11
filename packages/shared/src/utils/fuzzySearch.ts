import type { StaticCity } from '../data/cities';

export interface FuzzyMatch {
  city: StaticCity;
  score: number;
}

/**
 * Normalize a string for comparison: lowercase, strip diacritics, trim.
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Score how well a query matches a city name.
 * Higher score = better match.
 *
 * Scoring strategy:
 * - Exact match: 100
 * - Starts with query: 80 + length bonus
 * - All query words match the start of city words: 60 + word bonus
 * - City name contains the full query: 40
 * - Partial word-start matches: 20 + partial bonus
 * - No match: 0
 */
function scoreMatch(cityName: string, query: string): number {
  const name = normalize(cityName);
  const q = normalize(query);

  if (!q) return 0;

  // Exact match
  if (name === q) return 100;

  // Name starts with query
  if (name.startsWith(q)) {
    return 80 + Math.min(20, (q.length / name.length) * 20);
  }

  // Multi-word matching: each query word must match the start of a city word
  const queryWords = q.split(/\s+/).filter(Boolean);
  const nameWords = name.split(/\s+/).filter(Boolean);

  if (queryWords.length > 1) {
    let allMatch = true;
    let matchCount = 0;

    for (const qw of queryWords) {
      const found = nameWords.some(nw => nw.startsWith(qw));
      if (found) {
        matchCount++;
      } else {
        allMatch = false;
      }
    }

    if (allMatch) {
      return 60 + Math.min(20, (matchCount / nameWords.length) * 20);
    }

    // Partial: at least the first word matches fully and the last is a prefix
    if (queryWords.length >= 2) {
      const lastQW = queryWords[queryWords.length - 1];
      const allButLast = queryWords.slice(0, -1);

      const prefixMatch = allButLast.every(qw =>
        nameWords.some(nw => nw.startsWith(qw))
      );
      const lastPartial = nameWords.some(nw => nw.startsWith(lastQW));

      if (prefixMatch && lastPartial) {
        return 50 + Math.min(15, (q.length / name.length) * 15);
      }
    }
  }

  // Single word: matches start of any word in the city name
  if (queryWords.length === 1) {
    for (const nw of nameWords) {
      if (nw.startsWith(q)) {
        return 40 + Math.min(15, (q.length / nw.length) * 15);
      }
    }
  }

  // Contains the query as a substring
  if (name.includes(q)) {
    return 30 + Math.min(10, (q.length / name.length) * 10);
  }

  return 0;
}

/**
 * Also score against state and country for broader matching.
 */
function scoreCityMatch(city: StaticCity, query: string): number {
  const nameScore = scoreMatch(city.name, query);
  if (nameScore > 0) return nameScore;

  // Try matching "name, country" or "name, state"
  const q = normalize(query);
  if (city.state) {
    const fullWithState = normalize(`${city.name} ${city.state}`);
    if (fullWithState.includes(q)) return 25;
  }
  const fullWithCountry = normalize(`${city.name} ${city.country}`);
  if (fullWithCountry.includes(q)) return 20;

  return 0;
}

/**
 * Search the static city list with fuzzy matching.
 * Returns up to `limit` results sorted by relevance.
 */
export function fuzzySearchCities(
  cities: StaticCity[],
  query: string,
  limit: number = 5
): StaticCity[] {
  const q = normalize(query);
  if (q.length < 2) return [];

  const matches: FuzzyMatch[] = [];

  for (const city of cities) {
    const score = scoreCityMatch(city, query);
    if (score > 0) {
      matches.push({ city, score });
    }
  }

  matches.sort((a, b) => b.score - a.score);

  return matches.slice(0, limit).map(m => m.city);
}
