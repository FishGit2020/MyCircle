import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChordLine from './ChordLine';

describe('ChordLine', () => {
  it('renders plain text when no chords are present', () => {
    render(<ChordLine line="Amazing grace how sweet the sound" />);
    expect(screen.getByText('Amazing grace how sweet the sound')).toBeInTheDocument();
  });

  it('renders chords and lyrics for ChordPro format', () => {
    const { container } = render(<ChordLine line="[G]Amazing [C]grace" />);
    // Should have chord text
    expect(container.textContent).toContain('G');
    expect(container.textContent).toContain('C');
    // Should have lyric text
    expect(container.textContent).toContain('Amazing');
    expect(container.textContent).toContain('grace');
  });

  it('renders an empty spacer for empty lines', () => {
    const { container } = render(<ChordLine line="" />);
    // Empty line, should render the plain lyric div (since parseChordProLine returns [{ chord: '', lyric: '' }])
    expect(container.firstChild).toBeInTheDocument();
  });

  it('handles leading text before first chord', () => {
    const { container } = render(<ChordLine line="Well [Am]hello [G]there" />);
    expect(container.textContent).toContain('Well');
    expect(container.textContent).toContain('Am');
    expect(container.textContent).toContain('hello');
    expect(container.textContent).toContain('G');
    expect(container.textContent).toContain('there');
  });

  it('handles chord-only segments (no lyrics after chord)', () => {
    const { container } = render(<ChordLine line="[Am][G][C]" />);
    expect(container.textContent).toContain('Am');
    expect(container.textContent).toContain('G');
    expect(container.textContent).toContain('C');
  });

  it('renders with monospace font class', () => {
    const { container } = render(<ChordLine line="[G]Amazing grace" />);
    expect(container.querySelector('.font-mono')).toBeInTheDocument();
  });

  it('renders chord text in blue for dark/light themes', () => {
    const { container } = render(<ChordLine line="[G]Amazing grace" />);
    const chordRow = container.querySelector('.text-blue-600');
    expect(chordRow).toBeInTheDocument();
  });
});
