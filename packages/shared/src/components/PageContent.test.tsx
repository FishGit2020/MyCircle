import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageContent } from './PageContent';

describe('PageContent', () => {
  it('renders children', () => {
    render(<PageContent><p>Hello</p></PageContent>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('applies flex-grow by default', () => {
    const { container } = render(<PageContent>content</PageContent>);
    expect(container.firstChild).toHaveClass('flex-grow');
  });

  it('applies max-width class when specified', () => {
    const { container } = render(<PageContent maxWidth="3xl">content</PageContent>);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('max-w-3xl');
    expect(el).toHaveClass('mx-auto');
    expect(el).toHaveClass('w-full');
  });

  it('does not apply mx-auto or w-full when maxWidth is none', () => {
    const { container } = render(<PageContent maxWidth="none">content</PageContent>);
    const el = container.firstChild as HTMLElement;
    expect(el).not.toHaveClass('mx-auto');
    expect(el).not.toHaveClass('w-full');
  });

  it('applies flex flex-col when fill is true', () => {
    const { container } = render(<PageContent fill>content</PageContent>);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('flex');
    expect(el).toHaveClass('flex-col');
  });

  it('merges custom className', () => {
    const { container } = render(<PageContent className="space-y-6">content</PageContent>);
    expect(container.firstChild).toHaveClass('space-y-6');
  });

  it('does not add bottom padding classes', () => {
    const { container } = render(<PageContent>content</PageContent>);
    const classes = (container.firstChild as HTMLElement).className;
    expect(classes).not.toMatch(/pb-/);
  });
});
