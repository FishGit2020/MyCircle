import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LanguageSelector from './LanguageSelector';

const mockSetLocale = vi.fn();
const mockUpdateLocale = vi.fn();

let mockLocale = 'en';
let mockUser: any = null;
let mockProfile: any = null;

vi.mock('../../lib/firebase', () => ({ logEvent: vi.fn() }));

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

describe('LanguageSelector', () => {
  it('renders a select with 3 language options', () => {
    render(<LanguageSelector />);
    const select = screen.getByLabelText('Select language');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(screen.getByText('ES')).toBeInTheDocument();
  });

  it('shows current locale as selected', () => {
    mockLocale = 'es';
    render(<LanguageSelector />);
    const select = screen.getByLabelText('Select language') as HTMLSelectElement;
    expect(select.value).toBe('es');
  });

  it('calls setLocale on change', () => {
    render(<LanguageSelector />);
    fireEvent.change(screen.getByLabelText('Select language'), { target: { value: 'zh' } });
    expect(mockSetLocale).toHaveBeenCalledWith('zh');
  });

  it('persists locale to Firestore for signed-in users', () => {
    mockUser = { uid: '123' };
    render(<LanguageSelector />);
    fireEvent.change(screen.getByLabelText('Select language'), { target: { value: 'es' } });
    expect(mockSetLocale).toHaveBeenCalledWith('es');
    expect(mockUpdateLocale).toHaveBeenCalledWith('es');
  });

  it('does not call updateLocale when user is not signed in', () => {
    mockUser = null;
    render(<LanguageSelector />);
    fireEvent.change(screen.getByLabelText('Select language'), { target: { value: 'zh' } });
    expect(mockSetLocale).toHaveBeenCalledWith('zh');
    expect(mockUpdateLocale).not.toHaveBeenCalled();
  });

  it('has accessible focus ring', () => {
    render(<LanguageSelector />);
    const select = screen.getByLabelText('Select language');
    expect(select.className).toContain('focus:ring-2');
  });
});
