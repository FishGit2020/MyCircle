import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import YouthTracker from './YouthTracker';

vi.mock('@mycircle/shared', () => ({
  PageContent: ({ children, className = '' }: any) => <div className={className}>{children}</div>,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  useChildren: vi.fn(() => ({
    children: [],
    allChildren: [],
    selectedChild: null,
    selectedId: null,
    setSelectedId: vi.fn(),
    addChild: vi.fn(),
    updateChild: vi.fn(),
    deleteChild: vi.fn(),
    loading: false,
  })),
  getAgeInMonths: vi.fn(() => 120),
  getAgeRemainingDays: vi.fn(() => 5),
  ChildSelector: ({ children: kids }: any) => <div data-testid="child-selector">{kids?.length ?? 0} children</div>,
}));

describe('YouthTracker', () => {
  it('renders title when no children', () => {
    render(<YouthTracker />);
    expect(screen.getByText('youth.title')).toBeInTheDocument();
    expect(screen.getByText('youth.subtitle')).toBeInTheDocument();
  });

  it('shows add child form when no children', () => {
    render(<YouthTracker />);
    expect(screen.getByLabelText('children.name')).toBeInTheDocument();
    expect(screen.getByLabelText('children.birthDate')).toBeInTheDocument();
    expect(screen.getByText('children.addChild')).toBeInTheDocument();
  });
});
