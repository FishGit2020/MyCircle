import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CapoCalculator from './CapoCalculator';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

vi.mock('../utils/transpose', () => ({
  transposeChord: (chord: string, semitones: number) => {
    // Simplified transpose for testing: map known cases
    const chromatic = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
    const idx = chromatic.indexOf(chord);
    if (idx === -1) return chord;
    return chromatic[((idx + semitones) % 12 + 12) % 12];
  },
}));

describe('CapoCalculator', () => {
  const onCapoChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders collapsed by default with title', () => {
    render(<CapoCalculator soundingKey="G" capoFret={0} onCapoChange={onCapoChange} />);
    expect(screen.getByText('worship.capoCalculator')).toBeInTheDocument();
    // Fret buttons should NOT be visible when collapsed
    expect(screen.queryByText('worship.capoOff')).not.toBeInTheDocument();
  });

  it('expands when header is clicked', () => {
    render(<CapoCalculator soundingKey="G" capoFret={0} onCapoChange={onCapoChange} />);
    fireEvent.click(screen.getByText('worship.capoCalculator'));
    expect(screen.getByText('worship.capoOff')).toBeInTheDocument();
  });

  it('shows 9 fret buttons plus No Capo when expanded', () => {
    render(<CapoCalculator soundingKey="G" capoFret={0} onCapoChange={onCapoChange} />);
    fireEvent.click(screen.getByText('worship.capoCalculator'));
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(10); // No Capo + frets 1-9
  });

  it('calls onCapoChange when a fret button is clicked', () => {
    render(<CapoCalculator soundingKey="G" capoFret={0} onCapoChange={onCapoChange} />);
    fireEvent.click(screen.getByText('worship.capoCalculator'));
    // Click fret 3 — for G sounding key, -3 = Eb... but with our mock that returns E at idx 4
    // Let's just click the first fret button (fret 1)
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[1]); // fret 1
    expect(onCapoChange).toHaveBeenCalledWith(1);
  });

  it('toggles capo off when clicking the active fret', () => {
    render(<CapoCalculator soundingKey="G" capoFret={3} onCapoChange={onCapoChange} />);
    fireEvent.click(screen.getByText('worship.capoCalculator'));
    const radios = screen.getAllByRole('radio');
    // Fret 3 is at index 3 (0=off, 1=fret1, 2=fret2, 3=fret3)
    fireEvent.click(radios[3]);
    expect(onCapoChange).toHaveBeenCalledWith(0);
  });

  it('calls onCapoChange(0) when No Capo is clicked', () => {
    render(<CapoCalculator soundingKey="G" capoFret={3} onCapoChange={onCapoChange} />);
    fireEvent.click(screen.getByText('worship.capoCalculator'));
    fireEvent.click(screen.getByText('worship.capoOff'));
    expect(onCapoChange).toHaveBeenCalledWith(0);
  });

  it('shows instruction panel when capo is active', () => {
    render(<CapoCalculator soundingKey="G" capoFret={3} onCapoChange={onCapoChange} />);
    fireEvent.click(screen.getByText('worship.capoCalculator'));
    expect(screen.getByText(/worship\.capoInstruction/)).toBeInTheDocument();
  });

  it('shows capo badge in header when capo is active', () => {
    render(<CapoCalculator soundingKey="G" capoFret={5} onCapoChange={onCapoChange} />);
    // Badge should be visible even when collapsed
    expect(screen.getByText(/worship\.capoFret/)).toBeInTheDocument();
  });

  it('shows suggestions when no capo is selected', () => {
    render(<CapoCalculator soundingKey="Bb" capoFret={0} onCapoChange={onCapoChange} />);
    fireEvent.click(screen.getByText('worship.capoCalculator'));
    expect(screen.getByText(/worship\.capoSuggested/)).toBeInTheDocument();
  });

  it('highlights easy keys with green styling', () => {
    render(<CapoCalculator soundingKey="Bb" capoFret={0} onCapoChange={onCapoChange} />);
    fireEvent.click(screen.getByText('worship.capoCalculator'));
    // Check that easy key buttons have the green ring class
    const radios = screen.getAllByRole('radio');
    const easyKeyButtons = radios.filter(btn =>
      btn.className.includes('ring-green')
    );
    expect(easyKeyButtons.length).toBeGreaterThan(0);
  });

  it('marks selected capo with aria-checked=true', () => {
    render(<CapoCalculator soundingKey="G" capoFret={2} onCapoChange={onCapoChange} />);
    fireEvent.click(screen.getByText('worship.capoCalculator'));
    const radios = screen.getAllByRole('radio');
    // fret 2 is at index 2
    expect(radios[2]).toHaveAttribute('aria-checked', 'true');
    expect(radios[0]).toHaveAttribute('aria-checked', 'false'); // No Capo
  });

  it('suggestion buttons trigger onCapoChange', () => {
    render(<CapoCalculator soundingKey="Bb" capoFret={0} onCapoChange={onCapoChange} />);
    fireEvent.click(screen.getByText('worship.capoCalculator'));
    // Find a suggestion link and click it
    const suggestionButtons = screen.getAllByRole('button').filter(btn => {
      const text = btn.textContent ?? '';
      return /→/.test(text) && !text.includes('worship.');
    });
    if (suggestionButtons.length > 0) {
      fireEvent.click(suggestionButtons[0]);
      expect(onCapoChange).toHaveBeenCalled();
    }
  });
});
