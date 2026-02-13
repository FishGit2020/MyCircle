import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Metronome from './Metronome';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

// Mock AudioContext as a real class (vi.fn arrow functions can't be used with `new`)
class MockAudioContext {
  destination = {};
  currentTime = 0;
  close = vi.fn();
  createOscillator() {
    return {
      connect: vi.fn(),
      frequency: { value: 0 },
      type: 'sine' as OscillatorType,
      start: vi.fn(),
      stop: vi.fn(),
    };
  }
  createGain() {
    return {
      connect: vi.fn(),
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
    };
  }
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  (globalThis as any).AudioContext = MockAudioContext;
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('Metronome', () => {
  it('renders with default BPM of 120', () => {
    render(<Metronome />);
    const bpmInput = screen.getByRole('spinbutton', { name: 'worship.bpm' });
    expect(bpmInput).toHaveValue(120);
  });

  it('renders with initialBpm from song metadata', () => {
    render(<Metronome initialBpm={95} />);
    const bpmInput = screen.getByRole('spinbutton', { name: 'worship.bpm' });
    expect(bpmInput).toHaveValue(95);
  });

  it('clamps BPM to valid range (30-240)', () => {
    render(<Metronome initialBpm={10} />);
    expect(screen.getByRole('spinbutton', { name: 'worship.bpm' })).toHaveValue(30);
  });

  it('starts and stops metronome on toggle', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Metronome initialBpm={120} />);

    const toggleBtn = screen.getByLabelText('worship.metronomeStart');
    await user.click(toggleBtn);

    // After starting, button should show stop label
    expect(screen.getByLabelText('worship.metronomeStop')).toBeInTheDocument();

    // Click again to stop
    await user.click(screen.getByLabelText('worship.metronomeStop'));
    expect(screen.getByLabelText('worship.metronomeStart')).toBeInTheDocument();
  });

  it('increments and decrements BPM with +/- buttons', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Metronome initialBpm={100} />);

    const bpmInput = screen.getByRole('spinbutton', { name: 'worship.bpm' });
    expect(bpmInput).toHaveValue(100);

    await user.click(screen.getByLabelText('worship.bpm +1'));
    expect(bpmInput).toHaveValue(101);

    await user.click(screen.getByLabelText('worship.bpm -1'));
    expect(bpmInput).toHaveValue(100);
  });

  it('has tap tempo button', () => {
    render(<Metronome />);
    expect(screen.getByText('worship.tapTempo')).toBeInTheDocument();
  });

  it('has proper aria group label', () => {
    render(<Metronome />);
    expect(screen.getByRole('group', { name: 'worship.metronome' })).toBeInTheDocument();
  });
});
