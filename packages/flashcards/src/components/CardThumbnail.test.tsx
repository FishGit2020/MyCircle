import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CardThumbnail from './CardThumbnail';
import type { FlashCard } from '../types';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const baseCard: FlashCard = {
  id: 'c1',
  type: 'chinese',
  category: 'family',
  front: '妈妈',
  back: 'Mom',
  meta: { pinyin: 'māma' },
};

describe('CardThumbnail', () => {
  const onClick = vi.fn();
  beforeEach(() => vi.clearAllMocks());

  it('renders card front text', () => {
    render(<CardThumbnail card={baseCard} isMastered={false} onClick={onClick} />);
    expect(screen.getByText('妈妈')).toBeInTheDocument();
  });

  it('shows card type label', () => {
    render(<CardThumbnail card={baseCard} isMastered={false} onClick={onClick} />);
    expect(screen.getByText('chinese')).toBeInTheDocument();
  });

  it('shows pinyin when available', () => {
    render(<CardThumbnail card={baseCard} isMastered={false} onClick={onClick} />);
    expect(screen.getByText('māma')).toBeInTheDocument();
  });

  it('shows mastered checkmark', () => {
    render(<CardThumbnail card={baseCard} isMastered={true} onClick={onClick} />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('applies opacity for mastered cards', () => {
    const { container } = render(<CardThumbnail card={baseCard} isMastered={true} onClick={onClick} />);
    expect(container.querySelector('.opacity-60')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    render(<CardThumbnail card={baseCard} isMastered={false} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });

  it('shows delete button when onDelete provided', () => {
    const onDelete = vi.fn();
    render(<CardThumbnail card={baseCard} isMastered={false} onClick={onClick} onDelete={onDelete} />);
    fireEvent.click(screen.getByLabelText('flashcards.delete'));
    expect(onDelete).toHaveBeenCalled();
  });

  it('shows edit button when onEdit provided', () => {
    const onEdit = vi.fn();
    render(<CardThumbnail card={baseCard} isMastered={false} onClick={onClick} onEdit={onEdit} />);
    fireEvent.click(screen.getByLabelText('flashcards.edit'));
    expect(onEdit).toHaveBeenCalled();
  });

  it('shows publish button when onPublish provided', () => {
    const onPublish = vi.fn();
    render(<CardThumbnail card={baseCard} isMastered={false} onClick={onClick} onPublish={onPublish} />);
    fireEvent.click(screen.getByLabelText('flashcards.publish'));
    expect(onPublish).toHaveBeenCalled();
  });

  it('shows shared badge for public cards', () => {
    const publicCard: FlashCard = { ...baseCard, isPublic: true, createdBy: { uid: 'u1', displayName: 'Bob' } };
    render(<CardThumbnail card={publicCard} isMastered={false} onClick={onClick} />);
    expect(screen.getByText('flashcards.shared')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows private badge for non-english private cards', () => {
    render(<CardThumbnail card={baseCard} isMastered={false} onClick={onClick} />);
    expect(screen.getByText('flashcards.private')).toBeInTheDocument();
  });

  it('does not show private badge for english cards', () => {
    const enCard: FlashCard = { ...baseCard, type: 'english' };
    render(<CardThumbnail card={enCard} isMastered={false} onClick={onClick} />);
    expect(screen.queryByText('flashcards.private')).not.toBeInTheDocument();
  });

  it('uses correct border color per type', () => {
    const { container } = render(<CardThumbnail card={{ ...baseCard, type: 'custom' }} isMastered={false} onClick={onClick} />);
    expect(container.querySelector('.border-yellow-300')).toBeInTheDocument();
  });
});
