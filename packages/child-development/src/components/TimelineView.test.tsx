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
};

describe('TimelineView', () => {
  it('renders all domain filter chips', () => {
    render(<TimelineView {...DEFAULT_PROPS} />);

    const chips = screen.getAllByRole('button', { pressed: true });
    expect(chips).toHaveLength(6); // All 6 domains active
  });

  it('renders age range labels in timeline', () => {
    render(<TimelineView {...DEFAULT_PROPS} />);

    expect(screen.getByText('childDev.ageRange0_3m')).toBeInTheDocument();
    expect(screen.getByText('childDev.ageRange12_18m')).toBeInTheDocument();
    expect(screen.getByText('childDev.ageRange4_5y')).toBeInTheDocument();
  });

  it('shows CDC attribution text', () => {
    render(<TimelineView {...DEFAULT_PROPS} />);
    expect(screen.getByText('childDev.cdcAttribution')).toBeInTheDocument();
  });

  it('renders CDC and AAP guide links for the auto-expanded current stage', () => {
    render(<TimelineView {...DEFAULT_PROPS} />);

    // Only current stage is auto-expanded, so one pair of links visible
    const cdcLinks = screen.getAllByText('childDev.cdcGuide');
    const aapLinks = screen.getAllByText('childDev.aapGuide');
    expect(cdcLinks).toHaveLength(1);
    expect(aapLinks).toHaveLength(1);
  });

  it('shows green dot for past stages', () => {
    render(<TimelineView {...DEFAULT_PROPS} />);

    // 0-3m, 3-6m, 6-9m, 9-12m are all past (maxMonths <= 14)
    expect(screen.getByTestId('dot-past-0-3m')).toBeInTheDocument();
    expect(screen.getByTestId('dot-past-3-6m')).toBeInTheDocument();
    expect(screen.getByTestId('dot-past-6-9m')).toBeInTheDocument();
    expect(screen.getByTestId('dot-past-9-12m')).toBeInTheDocument();
  });

  it('shows blue dot for current stage', () => {
    render(<TimelineView {...DEFAULT_PROPS} />);
    expect(screen.getByTestId('dot-current-12-18m')).toBeInTheDocument();
  });

  it('shows gray dot for upcoming stages', () => {
    render(<TimelineView {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('dot-upcoming-18-24m')).toBeInTheDocument();
    expect(screen.getByTestId('dot-upcoming-2-3y')).toBeInTheDocument();
    expect(screen.getByTestId('dot-upcoming-4-5y')).toBeInTheDocument();
  });

  it('shows stage badges (Completed, Current, Upcoming)', () => {
    render(<TimelineView {...DEFAULT_PROPS} />);

    // Past stages get "Completed" badges
    const pastBadges = screen.getAllByText('childDev.pastStage');
    expect(pastBadges.length).toBe(4); // 0-3m, 3-6m, 6-9m, 9-12m

    // Current stage gets "Current" badge
    expect(screen.getByText('childDev.currentStage')).toBeInTheDocument();

    // Upcoming stages get "Upcoming" badges
    const upcomingBadges = screen.getAllByText('childDev.upcomingStage');
    expect(upcomingBadges.length).toBe(4); // 18-24m, 2-3y, 3-4y, 4-5y
  });

  it('auto-expands only the current stage, past stages collapsed', () => {
    render(<TimelineView {...DEFAULT_PROPS} />);

    // Current stage should be expanded
    const currentButton = screen.getByTestId('stage-12-18m').querySelector('button');
    expect(currentButton).toHaveAttribute('aria-expanded', 'true');

    // Past stages should be collapsed by default
    const pastButton = screen.getByTestId('stage-0-3m').querySelector('button');
    expect(pastButton).toHaveAttribute('aria-expanded', 'false');

    // Domain headers: 1 filter chip + 1 inside the expanded current stage = 2
    const domainHeaders = screen.getAllByText('childDev.domainPhysical');
    expect(domainHeaders).toHaveLength(2);
  });

  it('collapses upcoming stages by default', () => {
    render(<TimelineView {...DEFAULT_PROPS} />);

    // Upcoming stages should have aria-expanded=false
    const upcomingButton = screen.getByTestId('stage-18-24m').querySelector('button');
    expect(upcomingButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('expands upcoming stage on click', async () => {
    const user = userEvent.setup();
    render(<TimelineView {...DEFAULT_PROPS} />);

    // Click the upcoming stage header
    const stageNode = screen.getByTestId('stage-18-24m');
    const stageButton = stageNode.querySelector('button')!;
    expect(stageButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(stageButton);
    expect(stageButton).toHaveAttribute('aria-expanded', 'true');
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

  it('does not render any checkboxes', () => {
    render(<TimelineView {...DEFAULT_PROPS} />);
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('shows red flag badges on milestones', () => {
    render(<TimelineView {...DEFAULT_PROPS} />);

    // Red flag milestones should show the badge text
    const redFlags = screen.getAllByText('childDev.redFlag');
    expect(redFlags.length).toBeGreaterThan(0);
  });

  it('shows milestone count for each stage', () => {
    render(<TimelineView {...DEFAULT_PROPS} />);

    // Each stage should show a milestone count
    const counts = screen.getAllByText(/childDev\.milestoneCount/);
    expect(counts).toHaveLength(9); // 9 age ranges
  });

  it('handles null ageInMonths gracefully', () => {
    render(<TimelineView ageInMonths={null} currentAgeRange={null} />);

    // All stages should be "upcoming" (no past, no current)
    expect(screen.queryAllByText('childDev.pastStage')).toHaveLength(0);
    expect(screen.queryAllByText('childDev.currentStage')).toHaveLength(0);
    const upcomingBadges = screen.getAllByText('childDev.upcomingStage');
    expect(upcomingBadges).toHaveLength(9);
  });

  it('shows milestones grouped by domain within expanded current stage', () => {
    render(<TimelineView {...DEFAULT_PROPS} />);

    // Only current stage auto-expanded: 1 filter chip + 1 domain header = 2
    const physicalHeaders = screen.getAllByText('childDev.domainPhysical');
    expect(physicalHeaders).toHaveLength(2);
  });

  it('allows toggling past stages open and closed', async () => {
    const user = userEvent.setup();
    render(<TimelineView {...DEFAULT_PROPS} />);

    // Past stage starts collapsed
    const pastStage = screen.getByTestId('stage-0-3m');
    const pastButton = pastStage.querySelector('button')!;
    expect(pastButton).toHaveAttribute('aria-expanded', 'false');

    // Click to expand
    await user.click(pastButton);
    expect(pastButton).toHaveAttribute('aria-expanded', 'true');

    // Click again to collapse
    await user.click(pastButton);
    expect(pastButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('allows collapsing the current stage', async () => {
    const user = userEvent.setup();
    render(<TimelineView {...DEFAULT_PROPS} />);

    // Current stage starts expanded
    const currentStage = screen.getByTestId('stage-12-18m');
    const currentButton = currentStage.querySelector('button')!;
    expect(currentButton).toHaveAttribute('aria-expanded', 'true');

    // Click to collapse
    await user.click(currentButton);
    expect(currentButton).toHaveAttribute('aria-expanded', 'false');
  });
});
