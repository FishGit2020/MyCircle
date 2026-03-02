import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MarkdownText from './MarkdownText';

describe('MarkdownText', () => {
  it('renders plain text', () => {
    render(<MarkdownText content="Hello world" />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders inline code with code element', () => {
    const { container } = render(<MarkdownText content="Use `console.log` for debug" />);
    const codeEl = container.querySelector('code.font-mono');
    expect(codeEl).toBeInTheDocument();
    expect(codeEl!.textContent).toBe('console.log');
  });

  it('renders bold text with strong element', () => {
    const { container } = render(<MarkdownText content="This is **bold text** here" />);
    const strong = container.querySelector('strong');
    expect(strong).toBeInTheDocument();
    expect(strong!.textContent).toBe('bold text');
  });

  it('renders italic text with em element', () => {
    const { container } = render(<MarkdownText content="This is *italic text* here" />);
    const em = container.querySelector('em');
    expect(em).toBeInTheDocument();
    expect(em!.textContent).toBe('italic text');
  });

  it('renders code blocks with pre and code elements', () => {
    const content = '```javascript\nconst x = 1;\n```';
    const { container } = render(<MarkdownText content={content} />);
    const pre = container.querySelector('pre');
    expect(pre).toBeInTheDocument();
    const code = pre!.querySelector('code');
    expect(code).toBeInTheDocument();
    expect(code!.textContent).toBe('const x = 1;\n');
  });

  it('renders code blocks without language identifier in output', () => {
    const content = '```python\nprint("hello")\n```';
    const { container } = render(<MarkdownText content={content} />);
    const code = container.querySelector('pre code');
    expect(code).toBeInTheDocument();
    // Should not contain language identifier
    expect(code!.textContent).not.toContain('python');
    expect(code!.textContent).toContain('print("hello")');
  });

  it('renders bullet list items with bullet markers', () => {
    const content = '- Item one\n- Item two\n- Item three';
    render(<MarkdownText content={content} />);
    expect(screen.getByText('Item one')).toBeInTheDocument();
    expect(screen.getByText('Item two')).toBeInTheDocument();
    expect(screen.getByText('Item three')).toBeInTheDocument();
  });

  it('renders asterisk bullet list items', () => {
    const content = '* First\n* Second';
    render(<MarkdownText content={content} />);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('renders numbered list items', () => {
    const content = '1. First item\n2. Second item\n3. Third item';
    render(<MarkdownText content={content} />);
    expect(screen.getByText('First item')).toBeInTheDocument();
    expect(screen.getByText('Second item')).toBeInTheDocument();
    expect(screen.getByText('Third item')).toBeInTheDocument();
  });

  it('renders numbered list with number labels', () => {
    const content = '1. First\n2. Second';
    render(<MarkdownText content={content} />);
    expect(screen.getByText('1.')).toBeInTheDocument();
    expect(screen.getByText('2.')).toBeInTheDocument();
  });

  it('renders empty lines as spacing', () => {
    const content = 'Line one\n\nLine two';
    const { container } = render(<MarkdownText content={content} />);
    // Empty line should create an h-2 spacer div
    const spacer = container.querySelector('.h-2');
    expect(spacer).toBeInTheDocument();
  });

  it('renders mixed content with text and code block', () => {
    const content = 'Here is some code:\n```\nfoo()\n```\nAnd more text';
    const { container } = render(<MarkdownText content={content} />);
    const pre = container.querySelector('pre');
    expect(pre).toBeInTheDocument();
    expect(screen.getByText(/Here is some code/)).toBeInTheDocument();
    expect(screen.getByText(/And more text/)).toBeInTheDocument();
  });

  it('renders empty string without errors', () => {
    const { container } = render(<MarkdownText content="" />);
    expect(container).toBeInTheDocument();
  });
});
