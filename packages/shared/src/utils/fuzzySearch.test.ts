import { describe, it, expect } from 'vitest';
import { fuzzySearchCities } from './fuzzySearch';
import type { StaticCity } from '../data/cities';

const mockCities: StaticCity[] = [
  { name: 'New York', country: 'US', state: 'New York', lat: 40.71, lon: -74.01 },
  { name: 'New Orleans', country: 'US', state: 'Louisiana', lat: 29.95, lon: -90.07 },
  { name: 'Newark', country: 'US', state: 'New Jersey', lat: 40.74, lon: -74.17 },
  { name: 'London', country: 'GB', lat: 51.51, lon: -0.13 },
  { name: 'Los Angeles', country: 'US', state: 'California', lat: 34.05, lon: -118.24 },
  { name: 'San Francisco', country: 'US', state: 'California', lat: 37.77, lon: -122.42 },
  { name: 'São Paulo', country: 'BR', lat: -23.55, lon: -46.63 },
  { name: 'Zürich', country: 'CH', lat: 47.37, lon: 8.54 },
];

describe('fuzzySearchCities', () => {
  it('returns empty array for queries shorter than 2 characters', () => {
    expect(fuzzySearchCities(mockCities, 'N')).toEqual([]);
    expect(fuzzySearchCities(mockCities, '')).toEqual([]);
  });

  it('finds exact matches with highest priority', () => {
    const results = fuzzySearchCities(mockCities, 'London');
    expect(results[0].name).toBe('London');
  });

  it('finds cities that start with the query', () => {
    const results = fuzzySearchCities(mockCities, 'New');
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results.map(r => r.name)).toContain('New York');
    expect(results.map(r => r.name)).toContain('New Orleans');
    expect(results.map(r => r.name)).toContain('Newark');
  });

  it('ranks exact prefix matches higher than substring matches', () => {
    const results = fuzzySearchCities(mockCities, 'New York');
    expect(results[0].name).toBe('New York');
  });

  it('handles multi-word queries', () => {
    const results = fuzzySearchCities(mockCities, 'San Fran');
    expect(results[0].name).toBe('San Francisco');
  });

  it('handles diacritics (normalizes accented characters)', () => {
    const results = fuzzySearchCities(mockCities, 'Sao Paulo');
    expect(results[0].name).toBe('São Paulo');
  });

  it('handles diacritics for Zürich', () => {
    const results = fuzzySearchCities(mockCities, 'Zurich');
    expect(results[0].name).toBe('Zürich');
  });

  it('is case insensitive', () => {
    const results = fuzzySearchCities(mockCities, 'london');
    expect(results[0].name).toBe('London');
  });

  it('respects the limit parameter', () => {
    const results = fuzzySearchCities(mockCities, 'Ne', 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('returns empty for non-matching queries', () => {
    const results = fuzzySearchCities(mockCities, 'XYZ');
    expect(results).toEqual([]);
  });

  it('matches against state when name does not match', () => {
    const results = fuzzySearchCities(mockCities, 'New York US');
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it('sorts results by relevance score (best first)', () => {
    const results = fuzzySearchCities(mockCities, 'Los');
    expect(results[0].name).toBe('Los Angeles');
  });
});
