import '@testing-library/jest-dom';

// Mock canvas getContext for jsdom
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  save: vi.fn(),
  restore: vi.fn(),
  scale: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  set lineWidth(_v: number) {},
  set strokeStyle(_v: string) {},
  set lineCap(_v: string) {},
  set lineJoin(_v: string) {},
  set globalAlpha(_v: number) {},
  set font(_v: string) {},
  set fillStyle(_v: string) {},
  set textAlign(_v: string) {},
  set textBaseline(_v: string) {},
})) as any;
