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
  useQuery: () => ({
    data: { biblePassage: { text: 'Test verse text', reference: 'Proverbs 22:6' } },
    loading: false,
  }),
  GET_BIBLE_PASSAGE: { kind: 'Document', definitions: [] },
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
    storage['child-milestones'] = '["physical-0_3m-01"]';

    render(<ChildDevelopment />);

    // Should show overview, not setup
    expect(screen.getByText('Liam')).toBeInTheDocument();
  });

  it('shows overview with domain cards when child data exists', () => {
    storage['child-name'] = 'Sophia';
    storage['child-birth-date'] = '2024-03-20';

    render(<ChildDevelopment />);

    // 6 domain cards should be rendered
    expect(screen.getByText('childDev.domainPhysical')).toBeInTheDocument();
    expect(screen.getByText('childDev.domainSpeech')).toBeInTheDocument();
    expect(screen.getByText('childDev.domainCognitive')).toBeInTheDocument();
    expect(screen.getByText('childDev.domainSocial')).toBeInTheDocument();
    expect(screen.getByText('childDev.domainHealth')).toBeInTheDocument();
    expect(screen.getByText('childDev.domainSensory')).toBeInTheDocument();
  });

  it('toggles milestone checkbox in tracking mode', async () => {
    const user = userEvent.setup();
    storage['child-name'] = 'Noah';
    storage['child-birth-date'] = '2024-06-01';

    render(<ChildDevelopment />);

    // Click on the first domain card (Physical)
    await user.click(screen.getByText('childDev.domainPhysical'));

    // Should show domain detail view with checkboxes
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);

    // Toggle first checkbox
    await user.click(checkboxes[0]);
    expect(storage['child-milestones']).toBeDefined();

    const saved = JSON.parse(storage['child-milestones']);
    expect(saved).toHaveLength(1);
  });

  it('switches between tracking and reference modes', async () => {
    const user = userEvent.setup();
    storage['child-name'] = 'Ava';
    storage['child-birth-date'] = '2024-06-01';

    render(<ChildDevelopment />);

    // Start in tracking mode
    expect(screen.getByText('childDev.tracking')).toBeInTheDocument();
    expect(screen.getByText('childDev.reference')).toBeInTheDocument();

    // Switch to reference mode
    await user.click(screen.getByText('childDev.reference'));

    // Navigate to a domain
    await user.click(screen.getByText('childDev.domainPhysical'));

    // Should show bullet items, not checkboxes
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('shows current age range highlighted', () => {
    // Set birth date to ~6 months ago
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    storage['child-name'] = 'Oliver';
    storage['child-birth-date'] = sixMonthsAgo.toISOString().split('T')[0];

    render(<ChildDevelopment />);

    // Navigate to a domain to see age range cards
    fireEvent.click(screen.getByText('childDev.domainPhysical'));

    // Should have a "Current Age" badge somewhere
    expect(screen.getByText('childDev.currentAge')).toBeInTheDocument();
  });

  it('navigates to domain detail and back', async () => {
    const user = userEvent.setup();
    storage['child-name'] = 'Emma';
    storage['child-birth-date'] = '2024-06-01';

    render(<ChildDevelopment />);

    // Click a domain card
    await user.click(screen.getByText('childDev.domainSpeech'));

    // Should show back button and domain header
    expect(screen.getByText('childDev.back')).toBeInTheDocument();
    expect(screen.getByText('childDev.domainSpeech')).toBeInTheDocument();

    // Go back
    await user.click(screen.getByText('childDev.back'));

    // Should be back to overview with all domain cards
    expect(screen.getByText('childDev.domainPhysical')).toBeInTheDocument();
  });

  it('shows red flag indicators', () => {
    storage['child-name'] = 'Lucas';
    storage['child-birth-date'] = '2024-06-01';

    render(<ChildDevelopment />);

    // Switch to reference mode to see red flag labels
    fireEvent.click(screen.getByText('childDev.reference'));

    // Navigate to a domain
    fireEvent.click(screen.getByText('childDev.domainPhysical'));

    // Should show red flag labels
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

    // Should now show overview
    expect(screen.getByText('Mia')).toBeInTheDocument();
  });
});
