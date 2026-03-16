import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ChildDevelopment from './ChildDevelopment';

const mockAddChild = vi.fn();
const mockUpdateChild = vi.fn();
const mockDeleteChild = vi.fn();
const mockSetSelectedId = vi.fn();

const mockUseChildren = vi.fn(() => ({
  children: [],
  allChildren: [],
  selectedChild: null,
  selectedId: null,
  setSelectedId: mockSetSelectedId,
  addChild: mockAddChild,
  updateChild: vi.fn(),
  deleteChild: vi.fn(),
  loading: false,
}));

// Mock @mycircle/shared
vi.mock('@mycircle/shared', () => ({
  PageContent: ({ children, className = '' }: any) => <div className={className}>{children}</div>, // eslint-disable-line @typescript-eslint/no-explicit-any
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  StorageKeys: {
    CHILD_NAME: 'child-name',
    CHILD_BIRTH_DATE: 'child-birth-date',
    CHILD_MILESTONES: 'child-milestones',
  },
  WindowEvents: {
    CHILD_DATA_CHANGED: 'child-data-changed',
  },
  useVerseOfDay: () => ({
    reference: 'Proverbs 22:6',
    text: 'Test verse text',
    loading: false,
    shuffle: vi.fn(),
  }),
  parseVerseReference: (ref: string) => {
    const match = ref.replace(/[\u2013\u2014].*/g, '').trim().match(/^(.+?)\s+(\d+)(?::.*)?$/);
    if (!match) return null;
    return { book: match[1].trim(), chapter: parseInt(match[2], 10) };
  },
  useChildren: (...args: any[]) => mockUseChildren(...args), // eslint-disable-line @typescript-eslint/no-explicit-any
  getAgeInMonths: vi.fn(() => 12),
  getAgeRemainingDays: vi.fn(() => 5),
  ChildSelector: ({ children: kids }: any) => <div data-testid="child-selector">{kids?.length ?? 0} children</div>, // eslint-disable-line @typescript-eslint/no-explicit-any
}));

vi.mock('react-router', () => ({
  Link: ({ to, children, ...props }: any) => <a href={to} {...props}>{children}</a>, // eslint-disable-line @typescript-eslint/no-explicit-any
}));

describe('ChildDevelopment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseChildren.mockReturnValue({
      children: [],
      allChildren: [],
      selectedChild: null,
      selectedId: null,
      setSelectedId: mockSetSelectedId,
      addChild: mockAddChild,
      updateChild: mockUpdateChild,
      deleteChild: mockDeleteChild,
      loading: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders title and subtitle when no children', () => {
    render(<ChildDevelopment />);
    expect(screen.getByText('childDev.title')).toBeInTheDocument();
    expect(screen.getByText('childDev.subtitle')).toBeInTheDocument();
  });

  it('shows add child form when no children', () => {
    render(<ChildDevelopment />);
    expect(screen.getByLabelText('childDev.childName')).toBeInTheDocument();
    expect(screen.getByLabelText('childDev.birthDate')).toBeInTheDocument();
    expect(screen.getByText('children.addChild')).toBeInTheDocument();
  });

  it('calls addChild when form is submitted', async () => {
    mockAddChild.mockResolvedValue('child-1');
    render(<ChildDevelopment />);

    fireEvent.change(screen.getByLabelText('childDev.childName'), { target: { value: 'Emma' } });
    fireEvent.change(screen.getByLabelText('childDev.birthDate'), { target: { value: '2024-06-15' } });
    fireEvent.click(screen.getByText('children.addChild'));

    expect(mockAddChild).toHaveBeenCalledWith({ name: 'Emma', birthDate: '2024-06-15' });
  });

  it('shows child name when a child is selected', () => {
    mockUseChildren.mockReturnValue({
      children: [{ id: 'c1', name: 'Liam', birthDate: '2024-01-10' }],
      allChildren: [{ id: 'c1', name: 'Liam', birthDate: '2024-01-10' }],
      selectedChild: { id: 'c1', name: 'Liam', birthDate: '2024-01-10' },
      selectedId: 'c1',
      setSelectedId: mockSetSelectedId,
      addChild: mockAddChild,
      updateChild: mockUpdateChild,
      deleteChild: mockDeleteChild,
      loading: false,
    });
    render(<ChildDevelopment />);
    expect(screen.getByText('Liam')).toBeInTheDocument();
  });

  it('renders timeline view when child data exists', () => {
    mockUseChildren.mockReturnValue({
      children: [{ id: 'c1', name: 'Sophia', birthDate: '2024-03-20' }],
      allChildren: [{ id: 'c1', name: 'Sophia', birthDate: '2024-03-20' }],
      selectedChild: { id: 'c1', name: 'Sophia', birthDate: '2024-03-20' },
      selectedId: 'c1',
      setSelectedId: mockSetSelectedId,
      addChild: mockAddChild,
      updateChild: mockUpdateChild,
      deleteChild: mockDeleteChild,
      loading: false,
    });
    render(<ChildDevelopment />);
    expect(screen.getAllByText('childDev.domainPhysical').length).toBeGreaterThan(0);
    expect(screen.getAllByText('childDev.domainSpeech').length).toBeGreaterThan(0);
    expect(screen.getByText('childDev.cdcAttribution')).toBeInTheDocument();
  });

  it('renders milestone checkboxes for tracking progress', () => {
    mockUseChildren.mockReturnValue({
      children: [{ id: 'c1', name: 'Noah', birthDate: '2024-06-01' }],
      allChildren: [{ id: 'c1', name: 'Noah', birthDate: '2024-06-01' }],
      selectedChild: { id: 'c1', name: 'Noah', birthDate: '2024-06-01' },
      selectedId: 'c1',
      setSelectedId: mockSetSelectedId,
      addChild: mockAddChild,
      updateChild: mockUpdateChild,
      deleteChild: mockDeleteChild,
      loading: false,
    });
    render(<ChildDevelopment />);
    expect(screen.queryAllByRole('checkbox').length).toBeGreaterThan(0);
    expect(screen.queryByText(/%$/)).toBeNull();
  });

  it('does not have tracking or reference mode toggles', () => {
    mockUseChildren.mockReturnValue({
      children: [{ id: 'c1', name: 'Ava', birthDate: '2024-06-01' }],
      allChildren: [{ id: 'c1', name: 'Ava', birthDate: '2024-06-01' }],
      selectedChild: { id: 'c1', name: 'Ava', birthDate: '2024-06-01' },
      selectedId: 'c1',
      setSelectedId: mockSetSelectedId,
      addChild: mockAddChild,
      updateChild: mockUpdateChild,
      deleteChild: mockDeleteChild,
      loading: false,
    });
    render(<ChildDevelopment />);
    expect(screen.queryByText('childDev.tracking')).not.toBeInTheDocument();
    expect(screen.queryByText('childDev.reference')).not.toBeInTheDocument();
    expect(screen.queryByText('childDev.overview')).not.toBeInTheDocument();
  });

  it('shows child selector when children exist', () => {
    mockUseChildren.mockReturnValue({
      children: [{ id: 'c1', name: 'Oliver', birthDate: '2024-06-01' }],
      allChildren: [{ id: 'c1', name: 'Oliver', birthDate: '2024-06-01' }],
      selectedChild: { id: 'c1', name: 'Oliver', birthDate: '2024-06-01' },
      selectedId: 'c1',
      setSelectedId: mockSetSelectedId,
      addChild: mockAddChild,
      updateChild: mockUpdateChild,
      deleteChild: mockDeleteChild,
      loading: false,
    });
    render(<ChildDevelopment />);
    expect(screen.getByTestId('child-selector')).toBeInTheDocument();
  });

  it('shows red flag indicators', () => {
    mockUseChildren.mockReturnValue({
      children: [{ id: 'c1', name: 'Lucas', birthDate: '2024-06-01' }],
      allChildren: [{ id: 'c1', name: 'Lucas', birthDate: '2024-06-01' }],
      selectedChild: { id: 'c1', name: 'Lucas', birthDate: '2024-06-01' },
      selectedId: 'c1',
      setSelectedId: mockSetSelectedId,
      addChild: mockAddChild,
      updateChild: mockUpdateChild,
      deleteChild: mockDeleteChild,
      loading: false,
    });
    render(<ChildDevelopment />);
    const redFlags = screen.getAllByText('childDev.redFlag');
    expect(redFlags.length).toBeGreaterThan(0);
  });

  it('shuffles Bible verse', async () => {
    const user = userEvent.setup({ delay: null });
    render(<ChildDevelopment />);

    const shuffleBtn = screen.getByRole('button', { name: 'childDev.shuffleVerse' });
    expect(shuffleBtn).toBeInTheDocument();
    await user.click(shuffleBtn);
  });

  it('shows edit and delete buttons when a child is selected', () => {
    mockUseChildren.mockReturnValue({
      children: [{ id: 'c1', name: 'Emma', birthDate: '2024-01-01' }],
      allChildren: [{ id: 'c1', name: 'Emma', birthDate: '2024-01-01' }],
      selectedChild: { id: 'c1', name: 'Emma', birthDate: '2024-01-01' },
      selectedId: 'c1',
      setSelectedId: mockSetSelectedId,
      addChild: mockAddChild,
      updateChild: mockUpdateChild,
      deleteChild: mockDeleteChild,
      loading: false,
    });
    render(<ChildDevelopment />);
    expect(screen.getByRole('button', { name: 'children.editChild' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'children.deleteChild' })).toBeInTheDocument();
  });

  it('opens edit form when Edit button is clicked', () => {
    mockUseChildren.mockReturnValue({
      children: [{ id: 'c1', name: 'Emma', birthDate: '2024-01-01' }],
      allChildren: [{ id: 'c1', name: 'Emma', birthDate: '2024-01-01' }],
      selectedChild: { id: 'c1', name: 'Emma', birthDate: '2024-01-01' },
      selectedId: 'c1',
      setSelectedId: mockSetSelectedId,
      addChild: mockAddChild,
      updateChild: mockUpdateChild,
      deleteChild: mockDeleteChild,
      loading: false,
    });
    render(<ChildDevelopment />);
    fireEvent.click(screen.getByRole('button', { name: 'children.editChild' }));
    expect(screen.getByText('children.editChild')).toBeInTheDocument();
    expect(screen.getByLabelText('childDev.childName')).toHaveValue('Emma');
  });

  it('calls updateChild when edit form is saved', async () => {
    mockUpdateChild.mockResolvedValue(undefined);
    mockUseChildren.mockReturnValue({
      children: [{ id: 'c1', name: 'Emma', birthDate: '2024-01-01' }],
      allChildren: [{ id: 'c1', name: 'Emma', birthDate: '2024-01-01' }],
      selectedChild: { id: 'c1', name: 'Emma', birthDate: '2024-01-01' },
      selectedId: 'c1',
      setSelectedId: mockSetSelectedId,
      addChild: mockAddChild,
      updateChild: mockUpdateChild,
      deleteChild: mockDeleteChild,
      loading: false,
    });
    render(<ChildDevelopment />);
    fireEvent.click(screen.getByRole('button', { name: 'children.editChild' }));
    fireEvent.change(screen.getByLabelText('childDev.childName'), { target: { value: 'Emma Rose' } });
    fireEvent.click(screen.getByText('children.save'));
    expect(mockUpdateChild).toHaveBeenCalledWith('c1', { name: 'Emma Rose', birthDate: '2024-01-01' });
  });

  it('calls deleteChild after confirm', async () => {
    mockDeleteChild.mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockUseChildren.mockReturnValue({
      children: [{ id: 'c1', name: 'Emma', birthDate: '2024-01-01' }],
      allChildren: [{ id: 'c1', name: 'Emma', birthDate: '2024-01-01' }],
      selectedChild: { id: 'c1', name: 'Emma', birthDate: '2024-01-01' },
      selectedId: 'c1',
      setSelectedId: mockSetSelectedId,
      addChild: mockAddChild,
      updateChild: mockUpdateChild,
      deleteChild: mockDeleteChild,
      loading: false,
    });
    render(<ChildDevelopment />);
    fireEvent.click(screen.getByRole('button', { name: 'children.deleteChild' }));
    expect(mockDeleteChild).toHaveBeenCalledWith('c1');
  });
});
