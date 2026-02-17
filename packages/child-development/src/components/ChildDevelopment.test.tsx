import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ChildDevelopment from './ChildDevelopment';

// Mock @mycircle/shared
vi.mock('@mycircle/shared', () => ({
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
}));

describe('ChildDevelopment', () => {
  let storage: Record<string, string>;
  let originalGetItem: typeof Storage.prototype.getItem;
  let originalSetItem: typeof Storage.prototype.setItem;

  beforeEach(() => {
    storage = {};
    originalGetItem = Storage.prototype.getItem;
    originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => storage[key] ?? null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => { storage[key] = value; });
  });

  afterEach(() => {
    Storage.prototype.getItem = originalGetItem;
    Storage.prototype.setItem = originalSetItem;
    vi.restoreAllMocks();
  });

  it('renders title and subtitle', () => {
    render(<ChildDevelopment />);
    expect(screen.getByText('childDev.title')).toBeInTheDocument();
    expect(screen.getByText('childDev.subtitle')).toBeInTheDocument();
  });

  it('shows setup form when no child data', () => {
    render(<ChildDevelopment />);
    expect(screen.getByLabelText('childDev.childName')).toBeInTheDocument();
    expect(screen.getByLabelText('childDev.birthDate')).toBeInTheDocument();
    expect(screen.getByText('childDev.getStarted')).toBeInTheDocument();
  });

  it('saves child data to localStorage and dispatches event', async () => {
    const user = userEvent.setup();
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    render(<ChildDevelopment />);

    await user.type(screen.getByLabelText('childDev.childName'), 'Emma');
    fireEvent.change(screen.getByLabelText('childDev.birthDate'), { target: { value: '2024-06-15' } });
    await user.click(screen.getByText('childDev.getStarted'));

    expect(storage['child-name']).toBe('Emma');
    expect(storage['child-birth-date']).toBe(btoa('2024-06-15'));
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));

    dispatchSpy.mockRestore();
  });

  it('loads child data from localStorage on mount', () => {
    storage['child-name'] = 'Liam';
    storage['child-birth-date'] = '2024-01-10';

    render(<ChildDevelopment />);

    // Should show main view, not setup
    expect(screen.getByText('Liam')).toBeInTheDocument();
  });

  it('renders timeline view when child data exists', () => {
    storage['child-name'] = 'Sophia';
    storage['child-birth-date'] = '2024-03-20';

    render(<ChildDevelopment />);

    // Should show the timeline (domain names appear in filter chips + expanded stage headers)
    expect(screen.getAllByText('childDev.domainPhysical').length).toBeGreaterThan(0);
    expect(screen.getAllByText('childDev.domainSpeech').length).toBeGreaterThan(0);
    expect(screen.getByText('childDev.cdcAttribution')).toBeInTheDocument();
  });

  it('does not render any checkboxes or progress rings', () => {
    storage['child-name'] = 'Noah';
    storage['child-birth-date'] = '2024-06-01';

    render(<ChildDevelopment />);

    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    // No SVG progress rings — no "%" text should appear
    expect(screen.queryByText(/%$/)).toBeNull();
  });

  it('does not have tracking or reference mode toggles', () => {
    storage['child-name'] = 'Ava';
    storage['child-birth-date'] = '2024-06-01';

    render(<ChildDevelopment />);

    expect(screen.queryByText('childDev.tracking')).not.toBeInTheDocument();
    expect(screen.queryByText('childDev.reference')).not.toBeInTheDocument();
    expect(screen.queryByText('childDev.overview')).not.toBeInTheDocument();
  });

  it('does not read CHILD_MILESTONES from localStorage', () => {
    storage['child-name'] = 'Oliver';
    storage['child-birth-date'] = '2024-06-01';
    storage['child-milestones'] = '["physical-0_3m-01"]';

    render(<ChildDevelopment />);

    // The component should work fine — milestones storage is ignored
    expect(screen.getByText('Oliver')).toBeInTheDocument();
  });

  it('shows red flag indicators', () => {
    storage['child-name'] = 'Lucas';
    storage['child-birth-date'] = '2024-06-01';

    render(<ChildDevelopment />);

    // Red flag labels should appear (from expanded past/current stages in the timeline)
    const redFlags = screen.getAllByText('childDev.redFlag');
    expect(redFlags.length).toBeGreaterThan(0);
  });

  it('shuffles Bible verse', async () => {
    const user = userEvent.setup();
    render(<ChildDevelopment />);

    const shuffleBtn = screen.getByRole('button', { name: 'childDev.shuffleVerse' });
    expect(shuffleBtn).toBeInTheDocument();

    // Click should not crash
    await user.click(shuffleBtn);
  });

  it('responds to external CHILD_DATA_CHANGED events', () => {
    render(<ChildDevelopment />);

    // Initially no child data — setup form shown
    expect(screen.getByText('childDev.getStarted')).toBeInTheDocument();

    // Simulate external data change
    storage['child-name'] = 'Mia';
    storage['child-birth-date'] = '2024-01-15';
    act(() => {
      window.dispatchEvent(new Event('child-data-changed'));
    });

    // Should now show main view
    expect(screen.getByText('Mia')).toBeInTheDocument();
  });

  it('shows edit button and edit form works', async () => {
    const user = userEvent.setup();
    storage['child-name'] = 'Emma';
    storage['child-birth-date'] = btoa('2024-06-01');

    render(<ChildDevelopment />);

    // Should show main view with edit button
    expect(screen.getByText('Emma')).toBeInTheDocument();
    const editBtn = screen.getByText('childDev.editChild');

    await user.click(editBtn);

    // Should show the form
    expect(screen.getByLabelText('childDev.childName')).toBeInTheDocument();
    expect(screen.getByText('childDev.saveChild')).toBeInTheDocument();
  });
});
