import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Breadcrumb } from './Breadcrumb';

describe('Breadcrumb', () => {
  it('renders nothing when there is only one item', () => {
    const { container } = render(<Breadcrumb items={[{ label: 'Home' }]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when items is empty', () => {
    const { container } = render(<Breadcrumb items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders breadcrumb navigation with multiple items', () => {
    render(
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Weather' }]} />
    );

    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Weather')).toBeInTheDocument();
  });

  it('renders a link for items with href', () => {
    render(
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Current' }]} />
    );

    const link = screen.getByText('Home');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/');
  });

  it('renders a button for items with onClick', () => {
    const onClick = vi.fn();
    render(
      <Breadcrumb items={[{ label: 'Back', onClick }, { label: 'Current' }]} />
    );

    const button = screen.getByText('Back');
    expect(button.tagName).toBe('BUTTON');

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('marks the last item as current page', () => {
    render(
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Weather' }]} />
    );

    const currentItem = screen.getByText('Weather');
    expect(currentItem).toHaveAttribute('aria-current', 'page');
  });

  it('does not mark non-last items as current page', () => {
    render(
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Weather' }]} />
    );

    const homeLink = screen.getByText('Home');
    expect(homeLink).not.toHaveAttribute('aria-current');
  });
});
