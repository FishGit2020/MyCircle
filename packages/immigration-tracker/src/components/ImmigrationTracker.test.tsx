import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ImmigrationTracker from './ImmigrationTracker';

// Mock hooks
vi.mock('../hooks/useCases', () => ({
  useCases: vi.fn(),
}));
vi.mock('../hooks/useCaseStatus', () => ({
  useCaseStatus: vi.fn(),
}));

import { useCases } from '../hooks/useCases';
import { useCaseStatus } from '../hooks/useCaseStatus';

const mockUseCases = useCases as ReturnType<typeof vi.fn>;
const mockUseCaseStatus = useCaseStatus as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockUseCaseStatus.mockReturnValue({
    statuses: new Map(),
    loadingReceipt: null,
    error: null,
    fetchStatus: vi.fn(),
  });
});

describe('ImmigrationTracker', () => {
  it('shows loading spinner', () => {
    mockUseCases.mockReturnValue({
      cases: [],
      loading: true,
      isAuthenticated: true,
      authChecked: true,
      addCase: vi.fn(),
      deleteCase: vi.fn(),
      refresh: vi.fn(),
    });

    render(<ImmigrationTracker />);
    expect(screen.getByText('immigration.title')).toBeInTheDocument();
  });

  it('shows sign-in message when not authenticated', () => {
    mockUseCases.mockReturnValue({
      cases: [],
      loading: false,
      isAuthenticated: false,
      authChecked: true,
      addCase: vi.fn(),
      deleteCase: vi.fn(),
      refresh: vi.fn(),
    });

    render(<ImmigrationTracker />);
    expect(screen.getByText('immigration.signInRequired')).toBeInTheDocument();
  });

  it('shows empty state when no cases', () => {
    mockUseCases.mockReturnValue({
      cases: [],
      loading: false,
      isAuthenticated: true,
      authChecked: true,
      addCase: vi.fn(),
      deleteCase: vi.fn(),
      refresh: vi.fn(),
    });

    render(<ImmigrationTracker />);
    expect(screen.getByText('immigration.noCases')).toBeInTheDocument();
  });

  it('renders case cards', () => {
    mockUseCases.mockReturnValue({
      cases: [
        { id: '1', receiptNumber: 'IOE0912345678', formType: 'I-485', nickname: 'Green Card', createdAt: { seconds: 0, nanoseconds: 0 } },
      ],
      loading: false,
      isAuthenticated: true,
      authChecked: true,
      addCase: vi.fn(),
      deleteCase: vi.fn(),
      refresh: vi.fn(),
    });

    render(<ImmigrationTracker />);
    expect(screen.getByText('IOE0912345678')).toBeInTheDocument();
    expect(screen.getByText('I-485')).toBeInTheDocument();
  });
});
