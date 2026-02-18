import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthModal from './AuthModal';

const mockSignIn = vi.fn();
const mockSignInWithEmail = vi.fn();
const mockSignUpWithEmail = vi.fn();
const mockResetPassword = vi.fn();

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signInWithEmail: mockSignInWithEmail,
    signUpWithEmail: mockSignUpWithEmail,
    resetPassword: mockResetPassword,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

/** Get the form submit button (type="submit") */
function getSubmitButton() {
  const buttons = screen.getAllByRole('button');
  return buttons.find(b => b.getAttribute('type') === 'submit')!;
}

describe('AuthModal', () => {
  const onClose = vi.fn();

  it('renders nothing when closed', () => {
    const { container } = render(<AuthModal open={false} onClose={onClose} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders dialog when open', () => {
    render(<AuthModal open={true} onClose={onClose} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows sign in and sign up tabs', () => {
    render(<AuthModal open={true} onClose={onClose} />);
    // Both tabs exist — there will be duplicates with the submit button text
    const signInElements = screen.getAllByText('auth.signIn');
    const signUpElements = screen.getAllByText('auth.signUp');
    expect(signInElements.length).toBeGreaterThanOrEqual(1);
    expect(signUpElements.length).toBeGreaterThanOrEqual(1);
  });

  it('shows Google sign-in button', () => {
    render(<AuthModal open={true} onClose={onClose} />);
    expect(screen.getByText('auth.continueWithGoogle')).toBeInTheDocument();
  });

  it('shows email and password fields on sign in tab', () => {
    render(<AuthModal open={true} onClose={onClose} />);
    expect(screen.getByLabelText('auth.email')).toBeInTheDocument();
    expect(screen.getByLabelText('auth.password')).toBeInTheDocument();
  });

  it('calls signInWithEmail on form submit', async () => {
    const user = userEvent.setup();
    mockSignInWithEmail.mockResolvedValue(undefined);
    render(<AuthModal open={true} onClose={onClose} />);

    await user.type(screen.getByLabelText('auth.email'), 'test@example.com');
    await user.type(screen.getByLabelText('auth.password'), 'password123');
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(mockSignInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('shows error on failed sign in', async () => {
    const user = userEvent.setup();
    mockSignInWithEmail.mockRejectedValue({ code: 'auth/wrong-password' });
    render(<AuthModal open={true} onClose={onClose} />);

    await user.type(screen.getByLabelText('auth.email'), 'test@example.com');
    await user.type(screen.getByLabelText('auth.password'), 'wrong');
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('auth.errorWrongPassword')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('switches to sign up tab and shows additional fields', async () => {
    const user = userEvent.setup();
    render(<AuthModal open={true} onClose={onClose} />);

    // Click Sign Up tab (first element with that text is the tab)
    const signUpElements = screen.getAllByText('auth.signUp');
    await user.click(signUpElements[0]);

    expect(screen.getByLabelText('auth.displayName')).toBeInTheDocument();
    expect(screen.getByLabelText('auth.confirmPassword')).toBeInTheDocument();
  });

  it('shows error when passwords do not match on sign up', async () => {
    const user = userEvent.setup();
    render(<AuthModal open={true} onClose={onClose} />);

    // Switch to sign up tab
    const signUpElements = screen.getAllByText('auth.signUp');
    await user.click(signUpElements[0]);

    await user.type(screen.getByLabelText('auth.email'), 'new@example.com');
    await user.type(screen.getByLabelText('auth.password'), 'password123');
    await user.type(screen.getByLabelText('auth.confirmPassword'), 'different');

    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(screen.getByText('auth.errorPasswordMismatch')).toBeInTheDocument();
    });
    expect(mockSignUpWithEmail).not.toHaveBeenCalled();
  });

  it('calls signUpWithEmail on valid sign up', async () => {
    const user = userEvent.setup();
    mockSignUpWithEmail.mockResolvedValue(undefined);
    render(<AuthModal open={true} onClose={onClose} />);

    // Switch to sign up tab
    const signUpElements = screen.getAllByText('auth.signUp');
    await user.click(signUpElements[0]);

    await user.type(screen.getByLabelText('auth.displayName'), 'New User');
    await user.type(screen.getByLabelText('auth.email'), 'new@example.com');
    await user.type(screen.getByLabelText('auth.password'), 'password123');
    await user.type(screen.getByLabelText('auth.confirmPassword'), 'password123');

    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(mockSignUpWithEmail).toHaveBeenCalledWith('new@example.com', 'password123', 'New User');
    });
  });

  it('calls Google sign in when Google button is clicked', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue(undefined);
    render(<AuthModal open={true} onClose={onClose} />);

    await user.click(screen.getByText('auth.continueWithGoogle'));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledOnce();
    });
  });

  it('calls resetPassword when forgot password is clicked', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue(undefined);
    render(<AuthModal open={true} onClose={onClose} />);

    await user.type(screen.getByLabelText('auth.email'), 'test@example.com');
    await user.click(screen.getByText('auth.forgotPassword'));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('test@example.com');
      expect(screen.getByText('auth.resetSent')).toBeInTheDocument();
    });
  });

  it('shows error when forgot password clicked without email', async () => {
    const user = userEvent.setup();
    render(<AuthModal open={true} onClose={onClose} />);

    await user.click(screen.getByText('auth.forgotPassword'));

    await waitFor(() => {
      expect(screen.getByText('auth.errorEnterEmail')).toBeInTheDocument();
    });
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('closes on close button click', async () => {
    const user = userEvent.setup();
    render(<AuthModal open={true} onClose={onClose} />);

    await user.click(screen.getByLabelText('auth.close'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes on Escape key', () => {
    render(<AuthModal open={true} onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes on backdrop click', () => {
    render(<AuthModal open={true} onClose={onClose} />);
    // Click the backdrop (the outer div with role="presentation")
    fireEvent.click(screen.getByRole('presentation'));
    expect(onClose).toHaveBeenCalled();
  });
});
