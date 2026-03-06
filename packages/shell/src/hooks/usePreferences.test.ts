import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePreferences } from './usePreferences';

const mockUpdateUserDarkMode = vi.fn();
const mockUpdateUserLocale = vi.fn();
const mockUpdateUserTempUnit = vi.fn();
const mockUpdateUserSpeedUnit = vi.fn();

vi.mock('@mycircle/shared', () => ({
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

vi.mock('../lib/firebase', () => ({
  updateUserDarkMode: (...args: unknown[]) => mockUpdateUserDarkMode(...args),
  updateUserTheme: vi.fn(),
  updateUserLocale: (...args: unknown[]) => mockUpdateUserLocale(...args),
  updateUserTempUnit: (...args: unknown[]) => mockUpdateUserTempUnit(...args),
  updateUserSpeedUnit: (...args: unknown[]) => mockUpdateUserSpeedUnit(...args),
  updateUserDistanceUnit: vi.fn(),
}));

const makeUser = (uid = 'user1') => ({ uid } as any);

const makeProfile = () => ({
  uid: 'user1',
  email: 'test@example.com',
  displayName: 'Test',
  photoURL: null,
  darkMode: false,
  recentCities: [],
  favoriteCities: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('usePreferences', () => {
  it('updateDarkMode calls firebase and updates profile', async () => {
    const setProfile = vi.fn();
    const { result } = renderHook(() => usePreferences(makeUser(), setProfile));

    await act(async () => {
      await result.current.updateDarkMode(true);
    });

    expect(mockUpdateUserDarkMode).toHaveBeenCalledWith('user1', true);
    expect(setProfile).toHaveBeenCalledWith(expect.any(Function));

    // Verify the updater function
    const updater = setProfile.mock.calls[0][0];
    const profile = makeProfile();
    expect(updater(profile)).toEqual({ ...profile, darkMode: true });
    expect(updater(null)).toBeNull();
  });

  it('updateLocale calls firebase and updates profile', async () => {
    const setProfile = vi.fn();
    const { result } = renderHook(() => usePreferences(makeUser(), setProfile));

    await act(async () => {
      await result.current.updateLocale('es');
    });

    expect(mockUpdateUserLocale).toHaveBeenCalledWith('user1', 'es');
    const updater = setProfile.mock.calls[0][0];
    const profile = makeProfile();
    expect(updater(profile)).toEqual({ ...profile, locale: 'es' });
  });

  it('updateTempUnit calls firebase and updates profile', async () => {
    const setProfile = vi.fn();
    const { result } = renderHook(() => usePreferences(makeUser(), setProfile));

    await act(async () => {
      await result.current.updateTempUnit('F');
    });

    expect(mockUpdateUserTempUnit).toHaveBeenCalledWith('user1', 'F');
    const updater = setProfile.mock.calls[0][0];
    const profile = makeProfile();
    expect(updater(profile)).toEqual({ ...profile, tempUnit: 'F' });
  });

  it('updateSpeedUnit calls firebase and updates profile', async () => {
    const setProfile = vi.fn();
    const { result } = renderHook(() => usePreferences(makeUser(), setProfile));

    await act(async () => {
      await result.current.updateSpeedUnit('mph');
    });

    expect(mockUpdateUserSpeedUnit).toHaveBeenCalledWith('user1', 'mph');
    const updater = setProfile.mock.calls[0][0];
    const profile = makeProfile();
    expect(updater(profile)).toEqual({ ...profile, speedUnit: 'mph' });
  });

  it('does nothing when user is null', async () => {
    const setProfile = vi.fn();
    const { result } = renderHook(() => usePreferences(null, setProfile));

    await act(async () => {
      await result.current.updateDarkMode(true);
      await result.current.updateLocale('es');
      await result.current.updateTempUnit('F');
      await result.current.updateSpeedUnit('mph');
    });

    expect(mockUpdateUserDarkMode).not.toHaveBeenCalled();
    expect(mockUpdateUserLocale).not.toHaveBeenCalled();
    expect(mockUpdateUserTempUnit).not.toHaveBeenCalled();
    expect(mockUpdateUserSpeedUnit).not.toHaveBeenCalled();
    expect(setProfile).not.toHaveBeenCalled();
  });
});
