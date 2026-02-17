import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import TimelineView from './TimelineView';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const DEFAULT_PROPS = {
  ageInMonths: 14,
  currentAgeRange: {
    id: '12-18m' as const,
    labelKey: 'childDev.ageRange12_18m',
    minMonths: 12,
    maxMonths: 18,
  },
  checkedMilestones: ['physical-0_3m-01', 'physical-0_3m-02'],
  mode: 'tracking' as const,
  onToggleMilestone: vi.fn(),
};

describe('TimelineView', () => {
  it('renders all domain filter chips', () => {
    render(<TimelineView {...DEFAULT_PROPS} />);

    // Filter chips are always rendered (outside responsive wrappers)
    const chips = screen.getAllByRole('button', { pressed: true });
    expect(chips).toHaveLength(6); // All 6 domains active
  });

  it('renders age range labels in timeline', () => {
    render(<TimelineView {...DEFAULT_PROPS} />);

    // Age range headers appear in both desktop and mobile views
    expect(screen.getAllByText('childDev.ageRange0_3m').length).toBeGreaterThan(0);
    expect(screen.getAllByText('childDev.ageRange12_18m').length).toBeGreaterThan(0);
    expect(screen.getAllByText('childDev.ageRange4_5y').length).toBeGreaterThan(0);
  });

  it('highlights current age range', () => {
    render(<TimelineView {...DEFAULT_PROPS} />);

    // Current age badge should appear on the mobile view
    expect(screen.getAllByText('childDev.currentAge').length).toBeGreaterThan(0);
  });

  it('shows progress counts in cells', () => {
    render(<TimelineView {...DEFAULT_PROPS} />);

    // Physical 0-3m: 2 checked out of 5
    const physicalCells = screen.getAllByLabelText(
      /childDev\.domainPhysical childDev\.ageRange0_3m: 2\/5/,
    );
    expect(physicalCells.length).toBeGreaterThan(0);
  });

  it('toggles domain visibility when clicking a filter chip', async () => {
    const user = userEvent.setup();
    render(<TimelineView {...DEFAULT_PROPS} />);

    // All 6 chips start pressed (active)
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(6);

    // Click the first chip (Physical) to deactivate it
    const physicalChips = screen.getAllByText('childDev.domainPhysical');
    await user.click(physicalChips[0]); // the filter chip

    // Now 5 pressed, 1 unpressed
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(5);
    expect(screen.getAllByRole('button', { pressed: false }).length).toBeGreaterThan(0);
  });

  it('keeps at least one domain visible', async () => {
    const user = userEvent.setup();
    render(<TimelineView {...DEFAULT_PROPS} />);

    // Deactivate 5 of 6 domains
    const domainNames = [
      'childDev.domainPhysical',
      'childDev.domainSpeech',
      'childDev.domainCognitive',
      'childDev.domainSocial',
      'childDev.domainHealth',
    ];

    for (const name of domainNames) {
      const chips = screen.getAllByText(name);
      await user.click(chips[0]); // click the filter chip
    }

    // Only 1 domain active — try to deactivate it too
    const remainingActive = screen.getAllByRole('button', { pressed: true });
    expect(remainingActive).toHaveLength(1);

    await user.click(remainingActive[0]);
    // Should still have 1 active — can't go to zero
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1);
  });

  it('expands milestone details when clicking a progress cell', async () => {
    const user = userEvent.setup();
    render(<TimelineView {...DEFAULT_PROPS} />);

    // Click on a cell (use aria-label to find it)
    const cells = screen.getAllByLabelText(
      /childDev\.domainPhysical childDev\.ageRange0_3m/,
    );
    await user.click(cells[0]);

    // Both desktop and mobile views exist in the DOM (JSDOM has no CSS media queries),
    // so expanded milestones render in both → 5 × 2 = 10 checkboxes
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(10);
  });

  it('collapses expanded section when clicking same cell again', async () => {
    const user = userEvent.setup();
    render(<TimelineView {...DEFAULT_PROPS} />);

    const cells = screen.getAllByLabelText(
      /childDev\.domainPhysical childDev\.ageRange0_3m/,
    );

    // Expand
    await user.click(cells[0]);
    expect(screen.getAllByRole('checkbox')).toHaveLength(10);

    // Collapse
    await user.click(cells[0]);
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('calls onToggleMilestone when checking a milestone', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<TimelineView {...DEFAULT_PROPS} onToggleMilestone={onToggle} />);

    // Expand a cell
    const cells = screen.getAllByLabelText(
      /childDev\.domainPhysical childDev\.ageRange0_3m/,
    );
    await user.click(cells[0]);

    // Click a checkbox
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);

    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('shows bullet points in reference mode (no checkboxes)', async () => {
    const user = userEvent.setup();
    render(<TimelineView {...DEFAULT_PROPS} mode="reference" />);

    // Expand a cell
    const cells = screen.getAllByLabelText(
      /childDev\.domainPhysical childDev\.ageRange0_3m/,
    );
    await user.click(cells[0]);

    // No checkboxes in reference mode
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);

    // Milestone text should still be rendered
    const expandedSections = screen.getAllByTestId('expanded-physical-0-3m');
    expect(expandedSections.length).toBeGreaterThan(0);
  });

  it('renders age marker when ageInMonths is provided', () => {
    render(<TimelineView {...DEFAULT_PROPS} />);
    expect(screen.getByTestId('age-marker')).toBeInTheDocument();
  });

  it('does not render age marker when ageInMonths is null', () => {
    render(<TimelineView {...DEFAULT_PROPS} ageInMonths={null} currentAgeRange={null} />);
    expect(screen.queryByTestId('age-marker')).not.toBeInTheDocument();
  });

  it('shows checked milestones as checked when expanded', async () => {
    const user = userEvent.setup();
    render(<TimelineView {...DEFAULT_PROPS} />);

    // Expand Physical 0-3m (has 2 checked milestones)
    const cells = screen.getAllByLabelText(
      /childDev\.domainPhysical childDev\.ageRange0_3m/,
    );
    await user.click(cells[0]);

    // Both desktop + mobile views → 2 checked × 2 = 4
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    const checkedCount = checkboxes.filter(cb => cb.checked).length;
    expect(checkedCount).toBe(4);
  });
});
