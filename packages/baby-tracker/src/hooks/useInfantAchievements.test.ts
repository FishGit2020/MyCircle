import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInfantAchievements } from './useInfantAchievements';

vi.mock('@mycircle/shared', async () => {
  const actual = await vi.importActual<object>('@mycircle/shared');
  return {
    ...actual,
    useQuery: vi.fn(() => ({
      data: {
        infantAchievements: [
          {
            id: 'ach1',
            childId: 'child1',
            milestoneId: 'physical-0_3m-01',
            achievedDate: '2026-02-10',
            note: null,
            createdAt: '2026-02-10T10:00:00Z',
            updatedAt: '2026-02-10T10:00:00Z',
          },
        ],
      },
      loading: false,
      error: undefined,
    })),
    useMutation: vi.fn(() => [vi.fn().mockResolvedValue({}), { loading: false }]),
  };
});

describe('useInfantAchievements', () => {
  it('returns achievementMap keyed by milestoneId when childId provided', () => {
    const { result } = renderHook(() => useInfantAchievements('child1'));
    expect(result.current.achievementMap.has('physical-0_3m-01')).toBe(true);
  });

  it('returns loading=false', () => {
    const { result } = renderHook(() => useInfantAchievements('child1'));
    expect(result.current.loading).toBe(false);
  });

  it('exposes logAchievement, updateAchievement, clearAchievement', () => {
    const { result } = renderHook(() => useInfantAchievements('child1'));
    expect(typeof result.current.logAchievement).toBe('function');
    expect(typeof result.current.updateAchievement).toBe('function');
    expect(typeof result.current.clearAchievement).toBe('function');
  });

});
