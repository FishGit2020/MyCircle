import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SongEditor from './SongEditor';
import type { WorshipSong } from '../types';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

const baseSong: WorshipSong = {
  id: '1',
  title: 'Amazing Grace',
  artist: 'John Newton',
  originalKey: 'G',
  format: 'chordpro',
  content: '[G]Amazing [C]grace',
  notes: 'Play softly',
  youtubeUrl: 'https://youtube.com/watch?v=abc123',
  bpm: 100,
  tags: ['hymn', 'classic'],
  createdAt: { seconds: 1700000000, nanoseconds: 0 },
  updatedAt: { seconds: 1700000000, nanoseconds: 0 },
};

describe('SongEditor', () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();
  const onDelete = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the YouTube URL input field', () => {
    render(<SongEditor onSave={onSave} onCancel={onCancel} />);
    expect(screen.getByLabelText('worship.youtubeUrl')).toBeInTheDocument();
    expect(screen.getByText('worship.youtubeUrlHint')).toBeInTheDocument();
  });

  it('populates YouTube URL when editing an existing song', () => {
    render(<SongEditor song={baseSong} onSave={onSave} onDelete={onDelete} onCancel={onCancel} />);
    const input = screen.getByLabelText('worship.youtubeUrl') as HTMLInputElement;
    expect(input.value).toBe('https://youtube.com/watch?v=abc123');
  });

  it('includes YouTube URL in saved data', async () => {
    const user = userEvent.setup();
    render(<SongEditor onSave={onSave} onCancel={onCancel} />);

    await user.type(screen.getByRole('textbox', { name: /worship\.songTitle/ }), 'Test Song');
    await user.type(screen.getByRole('textbox', { name: /worship\.content/ }), 'Some lyrics');
    await user.type(screen.getByLabelText('worship.youtubeUrl'), 'https://youtube.com/watch?v=xyz');
    await user.click(screen.getByText('worship.save'));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        youtubeUrl: 'https://youtube.com/watch?v=xyz',
      })
    );
  });

  it('sends undefined when YouTube URL is empty', async () => {
    const user = userEvent.setup();
    render(<SongEditor onSave={onSave} onCancel={onCancel} />);

    await user.type(screen.getByRole('textbox', { name: /worship\.songTitle/ }), 'Test Song');
    await user.type(screen.getByRole('textbox', { name: /worship\.content/ }), 'Some lyrics');
    // Leave YouTube URL empty
    await user.click(screen.getByText('worship.save'));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        youtubeUrl: undefined,
      })
    );
  });

  it('renders title and content as required fields', () => {
    render(<SongEditor onSave={onSave} onCancel={onCancel} />);
    expect(screen.getByRole('textbox', { name: /worship\.songTitle/ })).toBeRequired();
    expect(screen.getByRole('textbox', { name: /worship\.content/ })).toBeRequired();
  });

  it('renders required field legend text', () => {
    render(<SongEditor onSave={onSave} onCancel={onCancel} />);
    expect(screen.getByText('worship.requiredFieldLegend')).toBeInTheDocument();
  });

  it('renders red asterisks on required fields with aria-hidden', () => {
    const { container } = render(<SongEditor onSave={onSave} onCancel={onCancel} />);
    const asterisks = container.querySelectorAll('span.text-red-500[aria-hidden="true"]');
    expect(asterisks.length).toBe(2); // Title and Content
    asterisks.forEach(a => expect(a.textContent).toBe('*'));
  });

  it('renders the BPM input field', () => {
    render(<SongEditor onSave={onSave} onCancel={onCancel} />);
    expect(screen.getByLabelText('worship.bpm')).toBeInTheDocument();
    expect(screen.getByText('worship.bpmHint')).toBeInTheDocument();
  });

  it('populates BPM when editing an existing song', () => {
    render(<SongEditor song={baseSong} onSave={onSave} onDelete={onDelete} onCancel={onCancel} />);
    const bpmInput = screen.getByLabelText('worship.bpm') as HTMLInputElement;
    expect(bpmInput.value).toBe('100');
  });

  it('includes BPM in saved data', async () => {
    const user = userEvent.setup();
    render(<SongEditor onSave={onSave} onCancel={onCancel} />);

    await user.type(screen.getByRole('textbox', { name: /worship\.songTitle/ }), 'Test Song');
    await user.type(screen.getByRole('textbox', { name: /worship\.content/ }), 'Some lyrics');
    await user.type(screen.getByLabelText('worship.bpm'), '95');
    await user.click(screen.getByText('worship.save'));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        bpm: 95,
      })
    );
  });

  it('disables save button when required fields are empty', () => {
    render(<SongEditor onSave={onSave} onCancel={onCancel} />);
    expect(screen.getByText('worship.save').closest('button')).toBeDisabled();
  });

  it('shows helper text when save is disabled due to missing fields', () => {
    render(<SongEditor onSave={onSave} onCancel={onCancel} />);
    expect(screen.getByText('worship.fillRequiredFields')).toBeInTheDocument();
  });

  it('shows inline validation on title after blur when empty', async () => {
    const user = userEvent.setup();
    render(<SongEditor onSave={onSave} onCancel={onCancel} />);

    const titleInput = screen.getByRole('textbox', { name: /worship\.songTitle/ });
    await user.click(titleInput);
    await user.tab(); // blur
    expect(screen.getByText('worship.fieldRequired')).toBeInTheDocument();
    expect(titleInput).toHaveAttribute('aria-invalid', 'true');
  });

  it('hides helper text when all required fields are filled', async () => {
    const user = userEvent.setup();
    render(<SongEditor onSave={onSave} onCancel={onCancel} />);

    await user.type(screen.getByRole('textbox', { name: /worship\.songTitle/ }), 'Test Song');
    await user.type(screen.getByRole('textbox', { name: /worship\.content/ }), 'Some lyrics');

    expect(screen.queryByText('worship.fillRequiredFields')).not.toBeInTheDocument();
    expect(screen.getByText('worship.save').closest('button')).toBeEnabled();
  });
});
