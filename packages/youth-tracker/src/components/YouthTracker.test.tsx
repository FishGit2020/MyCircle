import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import YouthTracker from './YouthTracker';

const mockUpdateChild = vi.fn();
const mockDeleteChild = vi.fn();
const mockUseChildren = vi.fn(() => ({
  children: [],
  allChildren: [],
  selectedChild: null,
  selectedId: null,
  setSelectedId: vi.fn(),
  addChild: vi.fn(),
  updateChild: mockUpdateChild,
  deleteChild: mockDeleteChild,
  loading: false,
}));

vi.mock('@mycircle/shared', () => ({
  PageContent: ({ children, className = '' }: any) => <div className={className}>{children}</div>,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  useChildren: (...args: any[]) => mockUseChildren(...args),
  getAgeInMonths: vi.fn(() => 120),
  getAgeRemainingDays: vi.fn(() => 5),
  ChildSelector: ({ children: kids }: any) => <div data-testid="child-selector">{kids?.length ?? 0} children</div>,
}));

const withChild = {
  children: [{ id: 'y1', name: 'Jake', birthDate: '2015-05-10' }],
  allChildren: [{ id: 'y1', name: 'Jake', birthDate: '2015-05-10' }],
  selectedChild: { id: 'y1', name: 'Jake', birthDate: '2015-05-10' },
  selectedId: 'y1',
  setSelectedId: vi.fn(),
  addChild: vi.fn(),
  updateChild: mockUpdateChild,
  deleteChild: mockDeleteChild,
  loading: false,
};

describe('YouthTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseChildren.mockReturnValue({
      children: [],
      allChildren: [],
      selectedChild: null,
      selectedId: null,
      setSelectedId: vi.fn(),
      addChild: vi.fn(),
      updateChild: mockUpdateChild,
      deleteChild: mockDeleteChild,
      loading: false,
    });
  });

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

  it('shows edit and delete buttons when a child is selected', () => {
    mockUseChildren.mockReturnValue(withChild);
    render(<YouthTracker />);
    expect(screen.getByRole('button', { name: 'children.editChild' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'children.deleteChild' })).toBeInTheDocument();
  });

  it('opens edit form prefilled with child data', () => {
    mockUseChildren.mockReturnValue(withChild);
    render(<YouthTracker />);
    fireEvent.click(screen.getByRole('button', { name: 'children.editChild' }));
    expect(screen.getByText('children.editChild')).toBeInTheDocument();
    expect(screen.getByLabelText('children.name')).toHaveValue('Jake');
  });

  it('calls updateChild when edit form is saved', async () => {
    mockUpdateChild.mockResolvedValue(undefined);
    mockUseChildren.mockReturnValue(withChild);
    render(<YouthTracker />);
    fireEvent.click(screen.getByRole('button', { name: 'children.editChild' }));
    fireEvent.change(screen.getByLabelText('children.name'), { target: { value: 'Jacob' } });
    fireEvent.click(screen.getByText('children.save'));
    expect(mockUpdateChild).toHaveBeenCalledWith('y1', { name: 'Jacob', birthDate: '2015-05-10' });
  });

  it('calls deleteChild after confirm', () => {
    mockDeleteChild.mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockUseChildren.mockReturnValue(withChild);
    render(<YouthTracker />);
    fireEvent.click(screen.getByRole('button', { name: 'children.deleteChild' }));
    expect(mockDeleteChild).toHaveBeenCalledWith('y1');
  });
});
