import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LanguageSelector from './LanguageSelector';

const mockSetLocale = vi.fn();
const mockUpdateLocale = vi.fn();
const mockLogEvent = vi.fn();

let mockLocale = 'en';
let mockUser: any = null;
let mockProfile: any = null;

vi.mock('../../lib/firebase', () => ({ logEvent: (...args: any[]) => mockLogEvent(...args) }));

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    locale: mockLocale,
    setLocale: mockSetLocale,
    t: (key: string) => key,
  }),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    profile: mockProfile,
    updateLocale: mockUpdateLocale,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockLocale = 'en';
  mockUser = null;
  mockProfile = null;
});

function openMenu() {
  fireEvent.click(screen.getByRole('button', { name: /language/i }));
}

describe('LanguageSelector', () => {
  it('renders a trigger button with globe and locale code', () => {
    render(<LanguageSelector />);
    const trigger = screen.getByRole('button', { name: /language/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-haspopup', 'true');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger.textContent).toContain('EN');
  });

  it('opens dropdown with menu role and 3 language items on click', () => {
    render(<LanguageSelector />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    openMenu();
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
    expect(screen.getByRole('button', { name: /language/i })).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows flag and translated name for each language', () => {
    render(<LanguageSelector />);
    openMenu();
    expect(screen.getByText('language.en')).toBeInTheDocument();
    expect(screen.getByText('language.es')).toBeInTheDocument();
    expect(screen.getByText('language.zh')).toBeInTheDocument();
  });

  it('highlights the active locale', () => {
    mockLocale = 'es';
    render(<LanguageSelector />);
    openMenu();
    const items = screen.getAllByRole('menuitem');
    // ES item (index 1) should have the active class
    expect(items[1].className).toContain('bg-blue-50');
    // EN item (index 0) should not
    expect(items[0].className).not.toContain('bg-blue-50');
  });

  it('calls setLocale and closes menu on item click', () => {
    render(<LanguageSelector />);
    openMenu();
    fireEvent.click(screen.getAllByRole('menuitem')[2]); // zh
    expect(mockSetLocale).toHaveBeenCalledWith('zh');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes on outside click', () => {
    render(<LanguageSelector />);
    openMenu();
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.mouseDown(document);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes on Escape key', () => {
    render(<LanguageSelector />);
    openMenu();
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('toggles menu on repeated trigger clicks', () => {
    render(<LanguageSelector />);
    openMenu();
    expect(screen.getByRole('menu')).toBeInTheDocument();
    openMenu();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('persists locale to Firestore for signed-in users', () => {
    mockUser = { uid: '123' };
    render(<LanguageSelector />);
    openMenu();
    fireEvent.click(screen.getAllByRole('menuitem')[1]); // es
    expect(mockSetLocale).toHaveBeenCalledWith('es');
    expect(mockUpdateLocale).toHaveBeenCalledWith('es');
  });

  it('does not call updateLocale when user is not signed in', () => {
    mockUser = null;
    render(<LanguageSelector />);
    openMenu();
    fireEvent.click(screen.getAllByRole('menuitem')[2]); // zh
    expect(mockSetLocale).toHaveBeenCalledWith('zh');
    expect(mockUpdateLocale).not.toHaveBeenCalled();
  });

  it('fires analytics event on language change', () => {
    render(<LanguageSelector />);
    openMenu();
    fireEvent.click(screen.getAllByRole('menuitem')[1]); // es
    expect(mockLogEvent).toHaveBeenCalledWith('language_change', { locale: 'es' });
  });
});
