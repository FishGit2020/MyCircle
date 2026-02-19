import { describe, it, expect, afterEach } from 'vitest';
import { isNativePlatform, getPlatform, isPluginAvailable } from './platform';

describe('platform utilities', () => {
  const originalCapacitor = window.Capacitor;

  afterEach(() => {
    // Restore original state
    if (originalCapacitor === undefined) {
      delete (window as any).Capacitor;
    } else {
      window.Capacitor = originalCapacitor;
    }
  });

  describe('isNativePlatform', () => {
    it('returns false when window.Capacitor is absent', () => {
      delete (window as any).Capacitor;
      expect(isNativePlatform()).toBe(false);
    });

    it('returns true when Capacitor reports native', () => {
      window.Capacitor = {
        isNativePlatform: () => true,
        getPlatform: () => 'ios',
        isPluginAvailable: () => true,
      };
      expect(isNativePlatform()).toBe(true);
    });

    it('returns false when Capacitor reports web', () => {
      window.Capacitor = {
        isNativePlatform: () => false,
        getPlatform: () => 'web',
        isPluginAvailable: () => false,
      };
      expect(isNativePlatform()).toBe(false);
    });
  });

  describe('getPlatform', () => {
    it('returns "web" when window.Capacitor is absent', () => {
      delete (window as any).Capacitor;
      expect(getPlatform()).toBe('web');
    });

    it('returns "ios" on iOS native', () => {
      window.Capacitor = {
        isNativePlatform: () => true,
        getPlatform: () => 'ios',
        isPluginAvailable: () => true,
      };
      expect(getPlatform()).toBe('ios');
    });

    it('returns "android" on Android native', () => {
      window.Capacitor = {
        isNativePlatform: () => true,
        getPlatform: () => 'android',
        isPluginAvailable: () => true,
      };
      expect(getPlatform()).toBe('android');
    });

    it('returns "web" for unrecognised platform strings', () => {
      window.Capacitor = {
        isNativePlatform: () => false,
        getPlatform: () => 'electron',
        isPluginAvailable: () => false,
      };
      expect(getPlatform()).toBe('web');
    });
  });

  describe('isPluginAvailable', () => {
    it('returns false when window.Capacitor is absent', () => {
      delete (window as any).Capacitor;
      expect(isPluginAvailable('StatusBar')).toBe(false);
    });

    it('delegates to Capacitor.isPluginAvailable', () => {
      window.Capacitor = {
        isNativePlatform: () => true,
        getPlatform: () => 'ios',
        isPluginAvailable: (name: string) => name === 'StatusBar',
      };
      expect(isPluginAvailable('StatusBar')).toBe(true);
      expect(isPluginAvailable('Camera')).toBe(false);
    });
  });
});
