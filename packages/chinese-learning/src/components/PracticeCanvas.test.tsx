import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PracticeCanvas from './PracticeCanvas';
import type { ChineseCharacter } from '../data/characters';

const mockChar: ChineseCharacter = {
  id: 'f01',
  character: '妈妈',
  pinyin: 'māma',
  meaning: 'mom',
  category: 'family',
};

describe('PracticeCanvas', () => {
  const defaultProps = {
    character: mockChar,
    onBack: vi.fn(),
  };

  it('renders canvas and character info', () => {
    render(<PracticeCanvas {...defaultProps} />);
    expect(screen.getByTestId('practice-canvas')).toBeInTheDocument();
    expect(screen.getByText('妈妈')).toBeInTheDocument();
    expect(screen.getByText('māma')).toBeInTheDocument();
    expect(screen.getByText('mom')).toBeInTheDocument();
  });

  it('renders practice hint text', () => {
    render(<PracticeCanvas {...defaultProps} />);
    expect(screen.getByText('Trace the character on the canvas')).toBeInTheDocument();
  });

  it('has undo and clear buttons', () => {
    render(<PracticeCanvas {...defaultProps} />);
    expect(screen.getByTestId('undo-btn')).toBeInTheDocument();
    expect(screen.getByTestId('clear-btn')).toBeInTheDocument();
  });

  it('undo button is disabled when no strokes', () => {
    render(<PracticeCanvas {...defaultProps} />);
    expect(screen.getByTestId('undo-btn')).toBeDisabled();
  });

  it('handles pointer events on canvas', () => {
    render(<PracticeCanvas {...defaultProps} />);
    const canvas = screen.getByTestId('practice-canvas');

    // Simulate a stroke
    fireEvent.pointerDown(canvas, { clientX: 50, clientY: 50 });
    fireEvent.pointerMove(canvas, { clientX: 100, clientY: 100 });
    fireEvent.pointerUp(canvas);

    // After drawing a stroke, undo should be enabled
    expect(screen.getByTestId('undo-btn')).not.toBeDisabled();
  });

  it('clears strokes when clear is clicked', async () => {
    const user = userEvent.setup();
    render(<PracticeCanvas {...defaultProps} />);
    const canvas = screen.getByTestId('practice-canvas');

    // Draw a stroke
    fireEvent.pointerDown(canvas, { clientX: 50, clientY: 50 });
    fireEvent.pointerMove(canvas, { clientX: 100, clientY: 100 });
    fireEvent.pointerUp(canvas);

    await user.click(screen.getByTestId('clear-btn'));
    expect(screen.getByTestId('undo-btn')).toBeDisabled();
  });

  it('calls onBack when flashcard button is clicked', async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    render(<PracticeCanvas {...defaultProps} onBack={onBack} />);

    await user.click(screen.getByText('Flashcards'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('canvas has touch-action: none for preventing scroll', () => {
    render(<PracticeCanvas {...defaultProps} />);
    const canvas = screen.getByTestId('practice-canvas');
    expect(canvas.style.touchAction).toBe('none');
  });
});
