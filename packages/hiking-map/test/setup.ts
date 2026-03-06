import '@testing-library/jest-dom';
import { vi } from 'vitest';

// MapLibre must be mocked with classes since it's instantiated with `new`
class MockMap {
  constructor(_container: HTMLElement | string, _options: object) {}
  on(_event: string, _handler: () => void) { return this; }
  off(_event: string, _handler: () => void) { return this; }
  remove() {}
  flyTo(_options: object) {}
  setStyle(_style: string) {}
  addSource(_id: string, _source: object) {}
  addLayer(_layer: object) {}
  removeLayer(_id: string) {}
  removeSource(_id: string) {}
  getLayer(_id: string) { return null; }
  getSource(_id: string) { return null; }
  addControl(_control: object, _position?: string) {}
  loaded() { return true; }
}

class MockNavigationControl {
  constructor(_options?: object) {}
}

vi.mock('maplibre-gl', () => ({
  default: {
    Map: MockMap,
    NavigationControl: MockNavigationControl,
  },
  Map: MockMap,
  NavigationControl: MockNavigationControl,
}));

// Mock ResizeObserver
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock geolocation
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
  configurable: true,
});
