import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CloudFilesWidget from './CloudFilesWidget';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  StorageKeys: { CLOUD_FILES_CACHE: 'cloud_files_cache' },
  WindowEvents: { CLOUD_FILES_CHANGED: 'cloud-files-changed' },
}));

describe('CloudFilesWidget', () => {
  it('renders without crashing', () => {
    render(<CloudFilesWidget />);
    expect(screen.getByText('widgets.cloudFiles')).toBeInTheDocument();
  });

  it('shows description text', () => {
    render(<CloudFilesWidget />);
    expect(screen.getByText('widgets.cloudFilesDesc')).toBeInTheDocument();
  });

  it('shows no cloud files message when no data', () => {
    render(<CloudFilesWidget />);
    expect(screen.getByText('widgets.noCloudFiles')).toBeInTheDocument();
  });

  it('has proper heading structure', () => {
    const { container } = render(<CloudFilesWidget />);
    const heading = container.querySelector('h4');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('widgets.cloudFiles');
  });
});
