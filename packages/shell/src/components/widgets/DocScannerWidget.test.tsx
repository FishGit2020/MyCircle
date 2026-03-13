import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DocScannerWidget from './DocScannerWidget';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('DocScannerWidget', () => {
  it('renders without crashing', () => {
    render(<DocScannerWidget />);
    expect(screen.getByText('widgets.docScanner')).toBeInTheDocument();
  });

  it('shows description text', () => {
    render(<DocScannerWidget />);
    expect(screen.getByText('widgets.docScannerDesc')).toBeInTheDocument();
  });

  it('has proper heading structure', () => {
    const { container } = render(<DocScannerWidget />);
    const heading = container.querySelector('h4');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('widgets.docScanner');
  });
});
