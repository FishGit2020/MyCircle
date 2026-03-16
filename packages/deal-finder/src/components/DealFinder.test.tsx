import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import DealFinder from './DealFinder';

// Mock @mycircle/shared
vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  PageContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  StorageKeys: {},
  WindowEvents: {},
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

// Mock useDeals hook
const mockDeals = [
  {
    id: '1',
    title: 'Test Deal Electronics',
    url: 'https://example.com/1',
    source: 'slickdeals' as const,
    price: '$99.99',
    originalPrice: '$199.99',
    store: 'Amazon',
    category: 'electronics',
    postedAt: new Date().toISOString(),
    score: 100,
  },
  {
    id: '2',
    title: 'Test Home Deal',
    url: 'https://example.com/2',
    source: 'reddit' as const,
    price: '$49.99',
    store: 'Walmart',
    category: 'home',
    postedAt: new Date().toISOString(),
    score: 50,
  },
];

const mockRefresh = vi.fn();

vi.mock('../hooks/useDeals', () => ({
  useDeals: () => ({
    deals: mockDeals,
    loading: false,
    error: null,
    refresh: mockRefresh,
  }),
}));

function renderComponent() {
  return render(
    <MemoryRouter>
      <DealFinder />
    </MemoryRouter>
  );
}

describe('DealFinder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and subtitle', () => {
    renderComponent();
    expect(screen.getByText('deals.title')).toBeInTheDocument();
    expect(screen.getByText('deals.subtitle')).toBeInTheDocument();
  });

  it('renders deal cards', () => {
    renderComponent();
    expect(screen.getByText('Test Deal Electronics')).toBeInTheDocument();
    expect(screen.getByText('Test Home Deal')).toBeInTheDocument();
  });

  it('shows price and original price', () => {
    renderComponent();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('$199.99')).toBeInTheDocument();
  });

  it('shows store badges', () => {
    renderComponent();
    expect(screen.getByText('Amazon')).toBeInTheDocument();
    expect(screen.getByText('Walmart')).toBeInTheDocument();
  });

  it('filters by search term', () => {
    renderComponent();
    const searchInput = screen.getByPlaceholderText('deals.searchPlaceholder');
    fireEvent.change(searchInput, { target: { value: 'Electronics' } });
    expect(screen.getByText('Test Deal Electronics')).toBeInTheDocument();
    expect(screen.queryByText('Test Home Deal')).not.toBeInTheDocument();
  });

  it('filters by source', () => {
    renderComponent();
    const redditBtn = screen.getByText('deals.sourceReddit');
    fireEvent.click(redditBtn);
    expect(screen.queryByText('Test Deal Electronics')).not.toBeInTheDocument();
    expect(screen.getByText('Test Home Deal')).toBeInTheDocument();
  });

  it('filters by category', () => {
    renderComponent();
    const homeBtn = screen.getByText('deals.categoryHome');
    fireEvent.click(homeBtn);
    expect(screen.queryByText('Test Deal Electronics')).not.toBeInTheDocument();
    expect(screen.getByText('Test Home Deal')).toBeInTheDocument();
  });

  it('calls refresh when button clicked', () => {
    renderComponent();
    const refreshBtn = screen.getByLabelText('deals.refresh');
    fireEvent.click(refreshBtn);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('shows deals count', () => {
    renderComponent();
    expect(screen.getByText(/2/)).toBeInTheDocument();
  });

  it('shows discount percentage', () => {
    renderComponent();
    expect(screen.getByText('-50%')).toBeInTheDocument();
  });

  it('shows source badges', () => {
    renderComponent();
    expect(screen.getByText('SlickDeals')).toBeInTheDocument();
    expect(screen.getByText('Reddit')).toBeInTheDocument();
  });

  it('has accessible deal links', () => {
    renderComponent();
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(2);
    links.forEach(link => {
      expect(link).toHaveAttribute('href');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link).toHaveAttribute('target', '_blank');
    });
  });
});
