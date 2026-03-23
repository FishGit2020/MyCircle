import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMilestoneEvents } from './useMilestoneEvents';

vi.mock('@mycircle/shared', async () => {
  const actual = await vi.importActual<object>('@mycircle/shared');
  return {
    ...actual,
    useQuery: vi.fn(() => ({
      data: {
        milestoneEvents: [
          {
            id: 'ev1',
            childId: 'child1',
            title: 'First kick',
            eventDate: '2026-01-15',
            note: 'Amazing!',
            createdAt: '2026-01-15T10:00:00Z',
            updatedAt: '2026-01-15T10:00:00Z',
          },
        ],
      },
      loading: false,
      error: undefined,
    })),
    useMutation: vi.fn(() => [vi.fn().mockResolvedValue({}), { loading: false }]),
  };
});

describe('useMilestoneEvents', () => {
  it('returns events from query', () => {
    const { result } = renderHook(() => useMilestoneEvents());
    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].title).toBe('First kick');
  });

  it('returns loading=false when data is available', () => {
    const { result } = renderHook(() => useMilestoneEvents());
    expect(result.current.loading).toBe(false);
  });

  it('exposes addEvent, updateEvent, deleteEvent functions', () => {
    const { result } = renderHook(() => useMilestoneEvents());
    expect(typeof result.current.addEvent).toBe('function');
    expect(typeof result.current.updateEvent).toBe('function');
    expect(typeof result.current.deleteEvent).toBe('function');
  });

});
