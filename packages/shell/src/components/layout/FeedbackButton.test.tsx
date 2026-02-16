import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import FeedbackButton from './FeedbackButton';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

const mockSubmitFeedback = vi.fn().mockResolvedValue(undefined);
const mockLogEvent = vi.fn();

vi.mock('../../lib/firebase', () => ({
  submitFeedback: (...args: any[]) => mockSubmitFeedback(...args),
  logEvent: (...args: any[]) => mockLogEvent(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('FeedbackButton', () => {
  it('renders floating trigger button', () => {
    render(<FeedbackButton />);
    expect(screen.getByText('feedback.button')).toBeInTheDocument();
  });

  it('opens modal on click', () => {
    render(<FeedbackButton />);
    fireEvent.click(screen.getByText('feedback.button'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('feedback.title')).toBeInTheDocument();
  });

  it('shows category select, star rating, and message textarea', () => {
    render(<FeedbackButton />);
    fireEvent.click(screen.getByText('feedback.button'));

    expect(screen.getByLabelText('feedback.category')).toBeInTheDocument();
    expect(screen.getByLabelText('feedback.message')).toBeInTheDocument();
    // 5 star buttons
    const stars = screen.getAllByRole('radio');
    expect(stars).toHaveLength(5);
  });

  it('disables submit when message is empty', () => {
    render(<FeedbackButton />);
    fireEvent.click(screen.getByText('feedback.button'));

    const submit = screen.getByText('feedback.submit');
    expect(submit).toBeDisabled();
  });

  it('enables submit when message is entered', () => {
    render(<FeedbackButton />);
    fireEvent.click(screen.getByText('feedback.button'));

    fireEvent.change(screen.getByLabelText('feedback.message'), {
      target: { value: 'Great app!' },
    });
    const submit = screen.getByText('feedback.submit');
    expect(submit).not.toBeDisabled();
  });

  it('submits feedback and shows success', async () => {
    render(<FeedbackButton />);
    fireEvent.click(screen.getByText('feedback.button'));

    fireEvent.change(screen.getByLabelText('feedback.message'), {
      target: { value: 'Great app!' },
    });
    fireEvent.click(screen.getByText('feedback.submit'));

    await waitFor(() => {
      expect(mockSubmitFeedback).toHaveBeenCalledWith(
        { category: 'general', rating: 0, message: 'Great app!' },
        null,
      );
    });
    expect(screen.getByText('feedback.success')).toBeInTheDocument();
  });

  it('shows error on submission failure', async () => {
    mockSubmitFeedback.mockRejectedValueOnce(new Error('fail'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<FeedbackButton />);
    fireEvent.click(screen.getByText('feedback.button'));

    fireEvent.change(screen.getByLabelText('feedback.message'), {
      target: { value: 'Feedback' },
    });
    fireEvent.click(screen.getByText('feedback.submit'));

    await waitFor(() => {
      expect(screen.getByText('feedback.error')).toBeInTheDocument();
    });
    consoleSpy.mockRestore();
  });

  it('closes on Escape key', () => {
    render(<FeedbackButton />);
    fireEvent.click(screen.getByText('feedback.button'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on close button click', () => {
    render(<FeedbackButton />);
    fireEvent.click(screen.getByText('feedback.button'));
    fireEvent.click(screen.getByLabelText('feedback.close'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('has aria-haspopup on trigger', () => {
    render(<FeedbackButton />);
    const trigger = screen.getByText('feedback.button').closest('button')!;
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
  });
});
