import { describe, it, expect } from 'vitest';
import { getErrorMessage } from './getErrorMessage';

describe('getErrorMessage', () => {
  it('extracts message from Error instances', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('extracts message from TypeError', () => {
    expect(getErrorMessage(new TypeError('type fail'))).toBe('type fail');
  });

  it('returns string errors as-is', () => {
    expect(getErrorMessage('something went wrong')).toBe('something went wrong');
  });

  it('extracts message from plain objects with message property', () => {
    expect(getErrorMessage({ message: 'obj error' })).toBe('obj error');
  });

  it('returns fallback for null', () => {
    expect(getErrorMessage(null)).toBe('An unknown error occurred');
  });

  it('returns fallback for undefined', () => {
    expect(getErrorMessage(undefined)).toBe('An unknown error occurred');
  });

  it('returns fallback for numbers', () => {
    expect(getErrorMessage(42)).toBe('An unknown error occurred');
  });

  it('returns fallback for objects without message', () => {
    expect(getErrorMessage({ code: 404 })).toBe('An unknown error occurred');
  });

  it('returns fallback for objects with non-string message', () => {
    expect(getErrorMessage({ message: 123 })).toBe('An unknown error occurred');
  });
});
