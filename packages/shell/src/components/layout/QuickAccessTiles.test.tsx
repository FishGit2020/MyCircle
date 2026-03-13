import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import QuickAccessTiles from './QuickAccessTiles';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  TranslationKey: {},
}));
vi.mock('react-router', () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
vi.mock('../widgets/WidgetDashboard', () => ({ WidgetType: {} }));
vi.mock('../../hooks/useWidgetPinned', () => ({
  useWidgetPinned: () => ({ pinned: false, toggle: vi.fn() }),
}));
vi.mock('./iconRegistry', () => ({
  getIcon: () => <svg />,
}));

describe('QuickAccessTiles', () => {
  it('renders the grid', () => {
    render(<QuickAccessTiles />);
    expect(screen.getByText('home.quickAccess')).toBeInTheDocument();
  });
});
