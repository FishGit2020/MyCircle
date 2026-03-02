import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Onboarding from './Onboarding';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key, locale: 'en' }),
}));

vi.mock('../../lib/firebase', () => ({
  logEvent: vi.fn(),
}));

const ONBOARDING_KEY = 'mycircle-onboarding-complete';

describe('Onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('shows onboarding when not completed', () => {
    render(<Onboarding />);
    expect(screen.getByText('onboarding.welcome')).toBeInTheDocument();
    expect(screen.getByText('onboarding.step1Title')).toBeInTheDocument();
  });

  it('does not show when already completed', () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    const { container } = render(<Onboarding />);
    expect(container.innerHTML).toBe('');
  });

  it('advances to next step on Next click', () => {
    render(<Onboarding />);
    fireEvent.click(screen.getByText('onboarding.next'));
    expect(screen.getByText('onboarding.step2Title')).toBeInTheDocument();
  });

  it('dismisses on Skip click', () => {
    render(<Onboarding />);
    fireEvent.click(screen.getByText('onboarding.skip'));
    expect(localStorage.getItem(ONBOARDING_KEY)).toBe('true');
  });

  it('shows progress dots', () => {
    render(<Onboarding />);
    // There are 12 steps, so 12 progress dot buttons
    const dotButtons = screen.getAllByLabelText(/onboarding.stepOf/);
    expect(dotButtons.length).toBe(12);
  });

  it('allows jumping to a step via dots', () => {
    render(<Onboarding />);
    const dots = screen.getAllByLabelText(/onboarding.stepOf/);
    fireEvent.click(dots[2]); // Jump to step 3
    expect(screen.getByText('onboarding.step3Title')).toBeInTheDocument();
  });

  it('shows Get Started on last step', () => {
    render(<Onboarding />);
    // Click next 11 times to reach last step
    for (let i = 0; i < 11; i++) {
      fireEvent.click(screen.getByText('onboarding.next'));
    }
    expect(screen.getByText('onboarding.getStarted')).toBeInTheDocument();
  });

  it('completes onboarding on last step Get Started click', () => {
    render(<Onboarding />);
    for (let i = 0; i < 11; i++) {
      fireEvent.click(screen.getByText('onboarding.next'));
    }
    fireEvent.click(screen.getByText('onboarding.getStarted'));
    expect(localStorage.getItem(ONBOARDING_KEY)).toBe('true');
  });

  it('shows locale badge on first step', () => {
    render(<Onboarding />);
    expect(screen.getByText('English')).toBeInTheDocument();
  });
});
