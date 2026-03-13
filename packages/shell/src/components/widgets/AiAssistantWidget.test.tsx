import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AiAssistantWidget from './AiAssistantWidget';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('AiAssistantWidget', () => {
  it('renders without crashing', () => {
    render(<AiAssistantWidget />);
    expect(screen.getByText('widgets.aiAssistant')).toBeInTheDocument();
  });

  it('shows description text', () => {
    render(<AiAssistantWidget />);
    expect(screen.getByText('widgets.aiAssistantDesc')).toBeInTheDocument();
  });

  it('has proper heading structure', () => {
    const { container } = render(<AiAssistantWidget />);
    const heading = container.querySelector('h4');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('widgets.aiAssistant');
  });
});
