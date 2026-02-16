import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UserMenu from './UserMenu';

const mockSignIn = vi.fn();
const mockSignOut = vi.fn();

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

let mockUser: any = null;
let mockLoading = false;

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: mockLoading,
    signIn: mockSignIn,
    signOut: mockSignOut,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockUser = null;
  mockLoading = false;
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

  it('calls signIn when sign in button is clicked', () => {
    render(<UserMenu />);
    fireEvent.click(screen.getByText('auth.signIn'));
    expect(mockSignIn).toHaveBeenCalledOnce();
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
});
