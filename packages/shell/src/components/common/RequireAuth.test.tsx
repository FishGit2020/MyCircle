import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RequireAuth from './RequireAuth';

const mockSignIn = vi.fn();

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  WindowEvents: { AUTH_STATE_CHANGED: 'auth-state-changed' },
}));

vi.mock('./Loading', () => ({
  default: () => <div data-testid="loading">Loading...</div>,
}));

let mockAuthState = { user: null as any, loading: false, signIn: mockSignIn };

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

describe('RequireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = { user: null, loading: false, signIn: mockSignIn };
    delete window.__getFirebaseIdToken;
  });

  it('shows loading when auth is loading', () => {
    mockAuthState = { user: null, loading: true, signIn: mockSignIn };
    render(<RequireAuth><div>Protected</div></RequireAuth>);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('shows sign-in prompt when not authenticated', () => {
    render(<RequireAuth><div>Protected</div></RequireAuth>);
    expect(screen.getByText('auth.signInToAccess')).toBeInTheDocument();
    expect(screen.getByText('auth.continueWithGoogle')).toBeInTheDocument();
  });

  it('renders children when user is present', () => {
    mockAuthState = { user: { uid: 'u1' }, loading: false, signIn: mockSignIn };
    render(<RequireAuth><div>Protected</div></RequireAuth>);
    expect(screen.getByText('Protected')).toBeInTheDocument();
  });

  it('renders children when token bridge returns token', async () => {
    window.__getFirebaseIdToken = vi.fn().mockResolvedValue('mock-token');
    render(<RequireAuth><div>Protected</div></RequireAuth>);
    await waitFor(() => {
      expect(screen.getByText('Protected')).toBeInTheDocument();
    });
  });

  it('calls signIn when Google button clicked', () => {
    render(<RequireAuth><div>Protected</div></RequireAuth>);
    fireEvent.click(screen.getByText('auth.continueWithGoogle'));
    expect(mockSignIn).toHaveBeenCalled();
  });

  it('shows sign-in prompt text', () => {
    render(<RequireAuth><div>Protected</div></RequireAuth>);
    expect(screen.getByText('auth.signInPrompt')).toBeInTheDocument();
  });
});
