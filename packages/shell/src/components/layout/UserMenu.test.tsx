import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UserMenu from './UserMenu';

const mockSignIn = vi.fn();
const mockSignInWithEmail = vi.fn();
const mockSignUpWithEmail = vi.fn();
const mockResetPassword = vi.fn();
const mockSignOut = vi.fn();
const mockSwitchToAccount = vi.fn();
const mockRemoveKnownAccount = vi.fn();

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  isNativePlatform: () => false,
}));

let mockUser: any = null;
let mockLoading = false;
let mockKnownAccounts: any[] = [];

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: mockLoading,
    signIn: mockSignIn,
    signInWithEmail: mockSignInWithEmail,
    signUpWithEmail: mockSignUpWithEmail,
    resetPassword: mockResetPassword,
    signOut: mockSignOut,
    updateDarkMode: vi.fn(),
    knownAccounts: mockKnownAccounts,
    switchToAccount: mockSwitchToAccount,
    removeKnownAccount: mockRemoveKnownAccount,
  }),
}));

vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}));

vi.mock('../../lib/firebase', () => ({
  logEvent: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockUser = null;
  mockLoading = false;
  mockKnownAccounts = [];
  // Reset window.confirm
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

describe('UserMenu', () => {
  it('shows loading skeleton when auth is loading', () => {
    mockLoading = true;
    const { container } = render(<UserMenu />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows sign in button when no user', () => {
    render(<UserMenu />);
    const signInBtn = screen.getByText('auth.signIn');
    expect(signInBtn).toBeInTheDocument();
  });

  it('opens auth modal when sign in button is clicked', () => {
    render(<UserMenu />);
    fireEvent.click(screen.getByText('auth.signIn'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows user avatar when signed in with photo', () => {
    mockUser = {
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: 'https://example.com/photo.jpg',
    };
    render(<UserMenu />);
    const avatar = screen.getByAltText('Test User');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  it('shows initial letter when no photo', () => {
    mockUser = {
      displayName: 'Alice',
      email: 'alice@example.com',
      photoURL: null,
    };
    render(<UserMenu />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('has aria-label and aria-expanded on menu button', () => {
    mockUser = { displayName: 'Test', email: 'test@test.com', photoURL: null };
    render(<UserMenu />);
    const btn = screen.getByLabelText('auth.userMenu');
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(btn).toHaveAttribute('aria-haspopup', 'true');
  });

  it('toggles dropdown menu on click', () => {
    mockUser = { displayName: 'Test', email: 'test@test.com', photoURL: null };
    render(<UserMenu />);

    fireEvent.click(screen.getByLabelText('auth.userMenu'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('test@test.com')).toBeInTheDocument();
    expect(screen.getByLabelText('auth.userMenu')).toHaveAttribute('aria-expanded', 'true');
  });

  it('calls signOut and closes menu', () => {
    mockUser = { displayName: 'Test', email: 'test@test.com', photoURL: null };
    render(<UserMenu />);

    fireEvent.click(screen.getByLabelText('auth.userMenu'));
    fireEvent.click(screen.getByText('auth.signOut'));
    expect(mockSignOut).toHaveBeenCalledOnce();
  });

  it('closes menu on outside click', () => {
    mockUser = { displayName: 'Test', email: 'test@test.com', photoURL: null };
    render(<UserMenu />);

    fireEvent.click(screen.getByLabelText('auth.userMenu'));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.mouseDown(document);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('shows "Current" badge for current account', () => {
    mockUser = { uid: 'user1', displayName: 'Test', email: 'test@test.com', photoURL: null };
    mockKnownAccounts = [
      { uid: 'user1', email: 'test@test.com', displayName: 'Test', photoURL: null, providerId: 'google.com', lastSignedInAt: 1000 },
    ];
    render(<UserMenu />);

    fireEvent.click(screen.getByLabelText('auth.userMenu'));
    expect(screen.getByText('auth.currentAccount')).toBeInTheDocument();
  });

  it('shows other accounts in dropdown', () => {
    mockUser = { uid: 'user1', displayName: 'Test', email: 'test@test.com', photoURL: null };
    mockKnownAccounts = [
      { uid: 'user1', email: 'test@test.com', displayName: 'Test', photoURL: null, providerId: 'google.com', lastSignedInAt: 2000 },
      { uid: 'user2', email: 'other@test.com', displayName: 'Other', photoURL: null, providerId: 'google.com', lastSignedInAt: 1000 },
    ];
    render(<UserMenu />);

    fireEvent.click(screen.getByLabelText('auth.userMenu'));
    expect(screen.getByText('Other')).toBeInTheDocument();
    expect(screen.getByText('other@test.com')).toBeInTheDocument();
  });

  it('calls switchToAccount when clicking a Google account', () => {
    mockUser = { uid: 'user1', displayName: 'Test', email: 'test@test.com', photoURL: null };
    const otherAccount = { uid: 'user2', email: 'other@test.com', displayName: 'Other', photoURL: null, providerId: 'google.com' as const, lastSignedInAt: 1000 };
    mockKnownAccounts = [
      { uid: 'user1', email: 'test@test.com', displayName: 'Test', photoURL: null, providerId: 'google.com', lastSignedInAt: 2000 },
      otherAccount,
    ];
    mockSwitchToAccount.mockResolvedValue(undefined);
    render(<UserMenu />);

    fireEvent.click(screen.getByLabelText('auth.userMenu'));
    fireEvent.click(screen.getByLabelText('Switch to Other'));
    expect(mockSwitchToAccount).toHaveBeenCalledWith(otherAccount);
  });

  it('shows password prompt for email accounts', () => {
    mockUser = { uid: 'user1', displayName: 'Test', email: 'test@test.com', photoURL: null };
    mockKnownAccounts = [
      { uid: 'user1', email: 'test@test.com', displayName: 'Test', photoURL: null, providerId: 'google.com', lastSignedInAt: 2000 },
      { uid: 'user2', email: 'email@test.com', displayName: 'Email User', photoURL: null, providerId: 'password', lastSignedInAt: 1000 },
    ];
    render(<UserMenu />);

    fireEvent.click(screen.getByLabelText('auth.userMenu'));
    fireEvent.click(screen.getByLabelText('Switch to Email User'));
    // Password prompt should appear
    expect(screen.getByPlaceholderText('auth.enterPassword')).toBeInTheDocument();
    expect(screen.getByText('auth.switchButton')).toBeInTheDocument();
  });

  it('calls removeKnownAccount after confirmation', () => {
    mockUser = { uid: 'user1', displayName: 'Test', email: 'test@test.com', photoURL: null };
    mockKnownAccounts = [
      { uid: 'user1', email: 'test@test.com', displayName: 'Test', photoURL: null, providerId: 'google.com', lastSignedInAt: 2000 },
      { uid: 'user2', email: 'other@test.com', displayName: 'Other', photoURL: null, providerId: 'google.com', lastSignedInAt: 1000 },
    ];
    render(<UserMenu />);

    fireEvent.click(screen.getByLabelText('auth.userMenu'));
    fireEvent.click(screen.getByLabelText('auth.removeAccount'));
    expect(window.confirm).toHaveBeenCalledWith('auth.accountRemoveConfirm');
    expect(mockRemoveKnownAccount).toHaveBeenCalledWith('user2');
  });

  it('shows "Add another account" button', () => {
    mockUser = { uid: 'user1', displayName: 'Test', email: 'test@test.com', photoURL: null };
    mockKnownAccounts = [];
    render(<UserMenu />);

    fireEvent.click(screen.getByLabelText('auth.userMenu'));
    expect(screen.getByText('auth.addAnotherAccount')).toBeInTheDocument();
  });

  it('shows max accounts message when 5 accounts reached', () => {
    mockUser = { uid: 'user1', displayName: 'Test', email: 'test@test.com', photoURL: null };
    mockKnownAccounts = Array.from({ length: 5 }, (_, i) => ({
      uid: `user${i}`,
      email: `user${i}@test.com`,
      displayName: `User ${i}`,
      photoURL: null,
      providerId: 'google.com',
      lastSignedInAt: 1000 + i,
    }));
    render(<UserMenu />);

    fireEvent.click(screen.getByLabelText('auth.userMenu'));
    expect(screen.getByText('auth.maxAccountsReached')).toBeInTheDocument();
  });

  it('does not show other accounts section when there are none', () => {
    mockUser = { uid: 'user1', displayName: 'Test', email: 'test@test.com', photoURL: null };
    mockKnownAccounts = [
      { uid: 'user1', email: 'test@test.com', displayName: 'Test', photoURL: null, providerId: 'google.com', lastSignedInAt: 1000 },
    ];
    render(<UserMenu />);

    fireEvent.click(screen.getByLabelText('auth.userMenu'));
    expect(screen.queryByLabelText('auth.removeAccount')).not.toBeInTheDocument();
  });
});
