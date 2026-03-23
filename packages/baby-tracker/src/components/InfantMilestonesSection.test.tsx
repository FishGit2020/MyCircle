import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InfantMilestonesSection from './InfantMilestonesSection';

vi.mock('../hooks/useInfantAchievements', () => ({
  useInfantAchievements: () => ({
    achievementMap: new Map(),
    loading: false,
    logAchievement: vi.fn().mockResolvedValue(undefined),
    updateAchievement: vi.fn().mockResolvedValue(undefined),
    clearAchievement: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('@mycircle/shared', async () => {
  const actual = await vi.importActual<object>('@mycircle/shared');
  return {
    ...actual,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

describe('InfantMilestonesSection', () => {
  it('shows select child prompt when no child selected', () => {
    render(<InfantMilestonesSection selectedChildId={null} />);
    expect(screen.getByText('babyJournal.milestones.selectChild')).toBeInTheDocument();
  });

  it('shows filter buttons when child is selected', () => {
    render(<InfantMilestonesSection selectedChildId="child1" />);
    expect(screen.getByText('babyJournal.milestones.filterAll')).toBeInTheDocument();
    expect(screen.getByText('babyJournal.milestones.filterAchieved')).toBeInTheDocument();
    expect(screen.getByText('babyJournal.milestones.filterUpcoming')).toBeInTheDocument();
  });

  it('switches to Achieved filter when clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(<InfantMilestonesSection selectedChildId="child1" />);
    const achievedBtn = screen.getByText('babyJournal.milestones.filterAchieved');
    await user.click(achievedBtn);
    expect(achievedBtn).toHaveClass('bg-pink-600');
  });

  it('renders milestone rows when child is selected', () => {
    render(<InfantMilestonesSection selectedChildId="child1" />);
    // Should render at least some rows (infant milestones data)
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
  });
});
