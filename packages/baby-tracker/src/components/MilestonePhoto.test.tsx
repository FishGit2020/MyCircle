import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MilestonePhoto from './MilestonePhoto';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const samplePhotos = [
  { photoId: 'photo-1', photoUrl: 'https://example.com/1.jpg', caption: 'Week 5' },
  { photoId: 'photo-2', photoUrl: 'https://example.com/2.jpg' },
];

describe('MilestonePhoto', () => {
  let onUpload: ReturnType<typeof vi.fn>;
  let onDelete: ReturnType<typeof vi.fn>;
  let onSaveNotes: ReturnType<typeof vi.fn>;
  let onClearError: ReturnType<typeof vi.fn>;

  const defaultProps = {
    stageId: 5,
    photos: [],
    isAuthenticated: true,
    uploading: false,
    savingNotes: false,
    onUpload: vi.fn().mockResolvedValue(undefined),
    onDelete: vi.fn().mockResolvedValue(undefined),
    onSaveNotes: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    onUpload = vi.fn().mockResolvedValue(undefined);
    onDelete = vi.fn().mockResolvedValue(undefined);
    onSaveNotes = vi.fn().mockResolvedValue(undefined);
    onClearError = vi.fn();
  });

  // --- Null / loading / uploading states ---

  it('returns null when not authenticated and not loading', () => {
    const { container } = render(
      <MilestonePhoto {...defaultProps} isAuthenticated={false} loading={false} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows skeleton when loading', () => {
    const { container } = render(
      <MilestonePhoto {...defaultProps} loading={true} />
    );
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('shows uploading placeholder when uploading', () => {
    render(
      <MilestonePhoto {...defaultProps} uploading={true} onUpload={onUpload} onDelete={onDelete} onSaveNotes={onSaveNotes} />
    );
    expect(screen.getByText('baby.uploading')).toBeInTheDocument();
  });

  // --- Error state ---

  it('shows error with try again button when error exists', () => {
    render(
      <MilestonePhoto
        {...defaultProps}
        error="Upload failed"
        onUpload={onUpload}
        onDelete={onDelete}
        onSaveNotes={onSaveNotes}
        onClearError={onClearError}
      />
    );
    expect(screen.getByText('baby.uploadFailed')).toBeInTheDocument();
    expect(screen.getByText('baby.tryAgain')).toBeInTheDocument();
  });

  it('calls onClearError when try again is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <MilestonePhoto
        {...defaultProps}
        error="Upload failed"
        onUpload={onUpload}
        onDelete={onDelete}
        onSaveNotes={onSaveNotes}
        onClearError={onClearError}
      />
    );
    await user.click(screen.getByText('baby.tryAgain'));
    expect(onClearError).toHaveBeenCalledTimes(1);
  });

  // --- Add Photo ---

  it('shows "Add Photo" button when authenticated with no photos', () => {
    render(
      <MilestonePhoto {...defaultProps} onUpload={onUpload} onDelete={onDelete} onSaveNotes={onSaveNotes} />
    );
    expect(screen.getByRole('button', { name: 'baby.addPhoto' })).toBeInTheDocument();
  });

  it('shows "Add Another Photo" button when photos exist', () => {
    render(
      <MilestonePhoto
        {...defaultProps}
        photos={samplePhotos}
        onUpload={onUpload}
        onDelete={onDelete}
        onSaveNotes={onSaveNotes}
      />
    );
    expect(screen.getByRole('button', { name: 'baby.addAnotherPhoto' })).toBeInTheDocument();
  });

  it('shows caption input when "Add Photo" is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <MilestonePhoto {...defaultProps} onUpload={onUpload} onDelete={onDelete} onSaveNotes={onSaveNotes} />
    );
    await user.click(screen.getByRole('button', { name: 'baby.addPhoto' }));
    expect(screen.getByLabelText('baby.photoCaption')).toBeInTheDocument();
  });

  it('hides caption input when cancel is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <MilestonePhoto {...defaultProps} onUpload={onUpload} onDelete={onDelete} onSaveNotes={onSaveNotes} />
    );
    await user.click(screen.getByRole('button', { name: 'baby.addPhoto' }));
    expect(screen.getByLabelText('baby.photoCaption')).toBeInTheDocument();

    // Cancel button (X) is the last button in the caption row
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[buttons.length - 1]);
    expect(screen.queryByLabelText('baby.photoCaption')).not.toBeInTheDocument();
  });

  // --- Multiple photos ---

  it('shows all photo thumbnails', () => {
    render(
      <MilestonePhoto
        {...defaultProps}
        photos={samplePhotos}
        onUpload={onUpload}
        onDelete={onDelete}
        onSaveNotes={onSaveNotes}
      />
    );
    const images = screen.getAllByAltText('baby.milestonePhoto');
    expect(images.length).toBe(2);
  });

  it('shows view button for each photo', () => {
    render(
      <MilestonePhoto
        {...defaultProps}
        photos={samplePhotos}
        onUpload={onUpload}
        onDelete={onDelete}
        onSaveNotes={onSaveNotes}
      />
    );
    const viewButtons = screen.getAllByRole('button', { name: 'baby.viewPhoto' });
    expect(viewButtons.length).toBe(2);
  });

  // --- Delete confirmation ---

  it('shows delete confirmation dialog when delete is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <MilestonePhoto
        {...defaultProps}
        photos={[samplePhotos[0]]}
        onUpload={onUpload}
        onDelete={onDelete}
        onSaveNotes={onSaveNotes}
      />
    );
    const deleteBtn = screen.getByRole('button', { name: 'baby.deletePhoto' });
    await user.click(deleteBtn);
    expect(screen.getByText('baby.deletePhotoConfirm')).toBeInTheDocument();
  });

  it('calls onDelete with stageId and photoId on confirm', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <MilestonePhoto
        {...defaultProps}
        stageId={5}
        photos={[samplePhotos[0]]}
        onUpload={onUpload}
        onDelete={onDelete}
        onSaveNotes={onSaveNotes}
      />
    );
    await user.click(screen.getByRole('button', { name: 'baby.deletePhoto' }));
    // Confirm dialog has a button with text baby.deletePhoto
    const deleteButtons = screen.getAllByText('baby.deletePhoto');
    await user.click(deleteButtons[deleteButtons.length - 1]);
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith(5, 'photo-1');
    });
  });

  it('hides confirmation dialog when cancel is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <MilestonePhoto
        {...defaultProps}
        photos={[samplePhotos[0]]}
        onUpload={onUpload}
        onDelete={onDelete}
        onSaveNotes={onSaveNotes}
      />
    );
    await user.click(screen.getByRole('button', { name: 'baby.deletePhoto' }));
    expect(screen.getByText('baby.deletePhotoConfirm')).toBeInTheDocument();
    await user.click(screen.getByText('baby.cancel'));
    expect(screen.queryByText('baby.deletePhotoConfirm')).not.toBeInTheDocument();
  });

  // --- Lightbox ---

  it('opens lightbox when photo thumbnail is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <MilestonePhoto
        {...defaultProps}
        photos={[samplePhotos[0]]}
        onUpload={onUpload}
        onDelete={onDelete}
        onSaveNotes={onSaveNotes}
      />
    );
    await user.click(screen.getByRole('button', { name: 'baby.viewPhoto' }));
    expect(screen.getByRole('dialog', { name: 'baby.milestonePhoto' })).toBeInTheDocument();
  });

  it('closes lightbox via close button', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <MilestonePhoto
        {...defaultProps}
        photos={[samplePhotos[0]]}
        onUpload={onUpload}
        onDelete={onDelete}
        onSaveNotes={onSaveNotes}
      />
    );
    await user.click(screen.getByRole('button', { name: 'baby.viewPhoto' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'baby.closeLightbox' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // --- Notes ---

  it('shows notes textarea', () => {
    render(
      <MilestonePhoto {...defaultProps} onUpload={onUpload} onDelete={onDelete} onSaveNotes={onSaveNotes} />
    );
    expect(screen.getByRole('textbox', { name: 'baby.notes' })).toBeInTheDocument();
  });

  it('shows existing notes value', () => {
    render(
      <MilestonePhoto
        {...defaultProps}
        notes="Great week!"
        onUpload={onUpload}
        onDelete={onDelete}
        onSaveNotes={onSaveNotes}
      />
    );
    expect(screen.getByRole('textbox', { name: 'baby.notes' })).toHaveValue('Great week!');
  });

  it('shows save button when notes are edited', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <MilestonePhoto {...defaultProps} onUpload={onUpload} onDelete={onDelete} onSaveNotes={onSaveNotes} />
    );
    const textarea = screen.getByRole('textbox', { name: 'baby.notes' });
    await user.type(textarea, 'New note');
    expect(screen.getByRole('button', { name: 'baby.saveNotes' })).toBeInTheDocument();
  });

  it('calls onSaveNotes when save button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <MilestonePhoto
        {...defaultProps}
        stageId={5}
        onUpload={onUpload}
        onDelete={onDelete}
        onSaveNotes={onSaveNotes}
      />
    );
    const textarea = screen.getByRole('textbox', { name: 'baby.notes' });
    await user.type(textarea, 'My note');
    await user.click(screen.getByRole('button', { name: 'baby.saveNotes' }));
    await waitFor(() => {
      expect(onSaveNotes).toHaveBeenCalledWith(5, 'My note');
    });
  });
});
