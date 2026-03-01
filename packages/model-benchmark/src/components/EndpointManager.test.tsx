import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EndpointManager from './EndpointManager';

// Mock @mycircle/shared
vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

const mockSaveEndpoint = vi.fn();
const mockDeleteEndpoint = vi.fn();

vi.mock('../hooks/useEndpoints', () => ({
  useEndpoints: () => ({
    endpoints: [
      { id: '1', name: 'NAS Server', url: 'http://nas:11434', hasCfAccess: false },
      { id: '2', name: 'GPU Server', url: 'https://gpu.example.com', hasCfAccess: true },
    ],
    loading: false,
    saving: false,
    refetch: vi.fn(),
    saveEndpoint: mockSaveEndpoint,
    deleteEndpoint: mockDeleteEndpoint,
  }),
}));

describe('EndpointManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders endpoint list', () => {
    render(<EndpointManager />);
    expect(screen.getByText('NAS Server')).toBeInTheDocument();
    expect(screen.getByText('GPU Server')).toBeInTheDocument();
  });

  it('shows CF Access badge for endpoints with CF access', () => {
    render(<EndpointManager />);
    expect(screen.getByText('CF Access')).toBeInTheDocument();
  });

  it('shows add form when button clicked', async () => {
    const user = userEvent.setup();
    render(<EndpointManager />);
    await user.click(screen.getByText('benchmark.endpoints.add'));
    expect(screen.getByPlaceholderText('benchmark.endpoints.namePlaceholder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('benchmark.endpoints.urlPlaceholder')).toBeInTheDocument();
  });

  it('save button is disabled when name and url are empty', async () => {
    const user = userEvent.setup();
    render(<EndpointManager />);
    await user.click(screen.getByText('benchmark.endpoints.add'));
    const saveBtn = screen.getByText('benchmark.endpoints.save');
    expect(saveBtn).toBeDisabled();
  });

  it('enables save when name and url are filled', async () => {
    const user = userEvent.setup();
    render(<EndpointManager />);
    await user.click(screen.getByText('benchmark.endpoints.add'));
    await user.type(screen.getByPlaceholderText('benchmark.endpoints.namePlaceholder'), 'Test');
    await user.type(screen.getByPlaceholderText('benchmark.endpoints.urlPlaceholder'), 'http://test:11434');
    const saveBtn = screen.getByText('benchmark.endpoints.save');
    expect(saveBtn).not.toBeDisabled();
  });
});
