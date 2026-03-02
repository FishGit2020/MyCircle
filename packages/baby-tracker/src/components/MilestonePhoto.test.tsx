import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MilestonePhoto from './MilestonePhoto';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('MilestonePhoto', () => {
  let onUpload: ReturnType<typeof vi.fn>;
  let onDelete: ReturnType<typeof vi.fn>;
  let onClearError: ReturnType<typeof vi.fn>;

  const defaultProps = {
    stageId: 5,
    isAuthenticated: true,
    uploading: false,
    onUpload: vi.fn().mockResolvedValue(undefined),
    onDelete: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    onUpload = vi.fn().mockResolvedValue(undefined);
    onDelete = vi.fn().mockResolvedValue(undefined);
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
    // Skeleton has animate-pulse elements
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('shows uploading state', () => {
    render(
      <MilestonePhoto {...defaultProps} uploading={true} onUpload={onUpload} onDelete={onDelete} />
    );
    expect(screen.getByText('baby.uploading')).toBeInTheDocument();
  });

  // --- Error state ---

  it('shows error with try again button when error exists and no photo', () => {
    render(
      <MilestonePhoto
        {...defaultProps}
        error="Upload failed"
        onUpload={onUpload}
        onDelete={onDelete}
        onClearError={onClearError}
      />
    );
    expect(screen.getByText('baby.uploadFailed')).toBeInTheDocument();
    expect(screen.getByText('baby.tryAgain')).toBeInTheDocument();
  });

  it('calls onClearError when try again is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MilestonePhoto
        {...defaultProps}
        error="Upload failed"
        onUpload={onUpload}
        onDelete={onDelete}
        onClearError={onClearError}
      />
    );
    await user.click(screen.getByText('baby.tryAgain'));
    expect(onClearError).toHaveBeenCalledTimes(1);
  });

  // --- Add Photo (no photo URL) ---

  it('shows "Add Photo" button when authenticated with no photo', () => {
    render(
      <MilestonePhoto {...defaultProps} onUpload={onUpload} onDelete={onDelete} />
    );
    expect(screen.getByRole('button', { name: 'baby.addPhoto' })).toBeInTheDocument();
  });

  it('shows caption input when "Add Photo" is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MilestonePhoto {...defaultProps} onUpload={onUpload} onDelete={onDelete} />
    );
    await user.click(screen.getByRole('button', { name: 'baby.addPhoto' }));
    expect(screen.getByLabelText('baby.photoCaption')).toBeInTheDocument();
  });

  it('hides caption input when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MilestonePhoto {...defaultProps} onUpload={onUpload} onDelete={onDelete} />
    );
    await user.click(screen.getByRole('button', { name: 'baby.addPhoto' }));
    expect(screen.getByLabelText('baby.photoCaption')).toBeInTheDocument();

    // Click the cancel (X) button - the second button in the caption row
    const buttons = screen.getAllByRole('button');
    // The last button is the cancel button
    await user.click(buttons[buttons.length - 1]);
    expect(screen.queryByLabelText('baby.photoCaption')).not.toBeInTheDocument();
  });

  // --- Photo exists ---

  it('shows photo thumbnail when photoUrl is provided', () => {
    render(
      <MilestonePhoto
        {...defaultProps}
        photoUrl="https://example.com/photo.jpg"
        onUpload={onUpload}
        onDelete={onDelete}
      />
    );
    const img = screen.getByAltText('baby.milestonePhoto');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  it('shows caption when provided with photo', () => {
    render(
      <MilestonePhoto
        {...defaultProps}
        photoUrl="https://example.com/photo.jpg"
        caption="Week 20 bump"
        onUpload={onUpload}
        onDelete={onDelete}
      />
    );
    expect(screen.getByText('Week 20 bump')).toBeInTheDocument();
  });

  it('shows delete button when photo exists', () => {
    render(
      <MilestonePhoto
        {...defaultProps}
        photoUrl="https://example.com/photo.jpg"
        onUpload={onUpload}
        onDelete={onDelete}
      />
    );
    expect(screen.getByRole('button', { name: 'baby.deletePhoto' })).toBeInTheDocument();
  });

  // --- Delete confirmation ---

  it('shows delete confirmation dialog on delete click', async () => {
    const user = userEvent.setup();
    render(
      <MilestonePhoto
        {...defaultProps}
        photoUrl="https://example.com/photo.jpg"
        onUpload={onUpload}
        onDelete={onDelete}
      />
    );
    await user.click(screen.getByRole('button', { name: 'baby.deletePhoto' }));
    expect(screen.getByText('baby.deletePhotoConfirm')).toBeInTheDocument();
  });

  it('calls onDelete with stageId on confirm', async () => {
    const user = userEvent.setup();
    render(
      <MilestonePhoto
        {...defaultProps}
        stageId={5}
        photoUrl="https://example.com/photo.jpg"
        onUpload={onUpload}
        onDelete={onDelete}
      />
    );
    await user.click(screen.getByRole('button', { name: 'baby.deletePhoto' }));
    // Now there are two "deletePhoto" buttons: the original + one inside the confirm dialog
    const deleteButtons = screen.getAllByText('baby.deletePhoto');
    // The confirm dialog button is the last one
    await user.click(deleteButtons[deleteButtons.length - 1]);
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith(5);
    });
  });

  it('hides confirmation dialog when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MilestonePhoto
        {...defaultProps}
        photoUrl="https://example.com/photo.jpg"
        onUpload={onUpload}
        onDelete={onDelete}
      />
    );
    await user.click(screen.getByRole('button', { name: 'baby.deletePhoto' }));
    expect(screen.getByText('baby.deletePhotoConfirm')).toBeInTheDocument();
    await user.click(screen.getByText('baby.cancel'));
    expect(screen.queryByText('baby.deletePhotoConfirm')).not.toBeInTheDocument();
  });

  // --- Lightbox ---

  it('opens lightbox when photo thumbnail is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MilestonePhoto
        {...defaultProps}
        photoUrl="https://example.com/photo.jpg"
        onUpload={onUpload}
        onDelete={onDelete}
      />
    );
    await user.click(screen.getByRole('button', { name: 'baby.viewPhoto' }));
    expect(screen.getByRole('dialog', { name: 'baby.milestonePhoto' })).toBeInTheDocument();
  });

  it('shows full image in lightbox', async () => {
    const user = userEvent.setup();
    render(
      <MilestonePhoto
        {...defaultProps}
        photoUrl="https://example.com/photo.jpg"
        onUpload={onUpload}
        onDelete={onDelete}
      />
    );
    await user.click(screen.getByRole('button', { name: 'baby.viewPhoto' }));
    const images = screen.getAllByAltText('baby.milestonePhoto');
    // Lightbox shows a second img element
    expect(images.length).toBe(2);
  });

  it('shows caption in lightbox when provided', async () => {
    const user = userEvent.setup();
    render(
      <MilestonePhoto
        {...defaultProps}
        photoUrl="https://example.com/photo.jpg"
        caption="Week 20 bump"
        onUpload={onUpload}
        onDelete={onDelete}
      />
    );
    await user.click(screen.getByRole('button', { name: 'baby.viewPhoto' }));
    // Caption should appear twice: once in the thumbnail view and once in lightbox
    const captions = screen.getAllByText('Week 20 bump');
    expect(captions.length).toBe(2);
  });

  it('closes lightbox via close button', async () => {
    const user = userEvent.setup();
    render(
      <MilestonePhoto
        {...defaultProps}
        photoUrl="https://example.com/photo.jpg"
        onUpload={onUpload}
        onDelete={onDelete}
      />
    );
    await user.click(screen.getByRole('button', { name: 'baby.viewPhoto' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'baby.closeLightbox' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // --- Does not show error UI when photo exists with error ---

  it('does not show error state when photoUrl exists even with error', () => {
    render(
      <MilestonePhoto
        {...defaultProps}
        photoUrl="https://example.com/photo.jpg"
        error="some error"
        onUpload={onUpload}
        onDelete={onDelete}
      />
    );
    expect(screen.queryByText('baby.uploadFailed')).not.toBeInTheDocument();
    // Photo should still be shown
    expect(screen.getByAltText('baby.milestonePhoto')).toBeInTheDocument();
  });
});
