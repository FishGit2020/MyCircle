import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockUpload = vi.fn().mockResolvedValue(undefined);
const mockDeletePhoto = vi.fn().mockResolvedValue(undefined);
const mockClearUploadError = vi.fn();

// Default mock returns empty photos
const mockHookState = {
  photos: [] as import('../hooks/useJournalPhotos').JournalPhoto[],
  loading: false,
  uploading: false,
  uploadError: null as string | null,
  clearUploadError: mockClearUploadError,
  upload: mockUpload,
  deletePhoto: mockDeletePhoto,
};

vi.mock('../hooks/useJournalPhotos', () => ({
  useJournalPhotos: () => mockHookState,
}));

vi.mock('@mycircle/shared', async () => {
  const actual = await vi.importActual<object>('@mycircle/shared');
  return {
    ...actual,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

// Import after mocks are set up
const { default: JournalPhotoSection } = await import('./JournalPhotoSection');

describe('JournalPhotoSection — empty state', () => {
  it('shows empty state when no photos', () => {
    render(<JournalPhotoSection childId={null} />);
    expect(screen.getByText('babyJournal.photoAlbum.empty')).toBeInTheDocument();
  });

  it('shows Add Photo button', () => {
    render(<JournalPhotoSection childId={null} />);
    expect(screen.getByText('babyJournal.photoAlbum.addPhoto')).toBeInTheDocument();
  });
});

describe('JournalPhotoSection — with photos', () => {
  it('renders photo thumbnails', () => {
    mockHookState.photos = [
      {
        id: 'photo1',
        childId: null,
        photoUrl: 'https://example.com/photo1.jpg',
        storagePath: 'users/uid/journal-photos/photo1.jpg',
        caption: 'First smile',
        stageLabel: null,
        photoDate: '2026-01-20',
        createdAt: '2026-01-20T10:00:00Z',
      },
    ];
    render(<JournalPhotoSection childId={null} />);
    const imgs = screen.getAllByRole('img');
    expect(imgs.length).toBeGreaterThan(0);
    mockHookState.photos = [];
  });

  it('shows delete confirmation when delete button clicked', async () => {
    mockHookState.photos = [
      {
        id: 'photo1',
        childId: null,
        photoUrl: 'https://example.com/photo1.jpg',
        storagePath: 'users/uid/journal-photos/photo1.jpg',
        caption: 'First smile',
        stageLabel: null,
        photoDate: '2026-01-20',
        createdAt: '2026-01-20T10:00:00Z',
      },
    ];
    const user = userEvent.setup({ delay: null });
    render(<JournalPhotoSection childId={null} />);
    const deleteBtn = screen.getByLabelText('babyJournal.photoAlbum.delete');
    await user.click(deleteBtn);
    expect(screen.getByText('babyJournal.photoAlbum.deleteConfirm')).toBeInTheDocument();
    mockHookState.photos = [];
  });
});
