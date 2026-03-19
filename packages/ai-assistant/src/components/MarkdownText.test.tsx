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

  it('handles unclosed code block when streaming', () => {
    const content = 'Here is code:\n```javascript\nconst x = 1;';
    const { container } = render(<MarkdownText content={content} streaming />);
    // Should auto-close the code block and render it
    const pre = container.querySelector('pre');
    expect(pre).toBeInTheDocument();
    const code = pre!.querySelector('code');
    expect(code!.textContent).toContain('const x = 1;');
  });

  it('does not auto-close code block when not streaming', () => {
    // Without streaming, unclosed ``` is treated as text
    const content = 'Here is code:\n```javascript\nconst x = 1;';
    const { container } = render(<MarkdownText content={content} />);
    const pre = container.querySelector('pre');
    // Without streaming fix, the regex won't match so no <pre> rendered
    expect(pre).toBeNull();
  });

  // T012: Heading rendering tests (US2)
  describe('Heading rendering', () => {
    it('renders # heading with h1 classes', () => {
      const { container } = render(<MarkdownText content="# My Title" />);
      const heading = container.querySelector('.text-xl.font-bold');
      expect(heading).toBeInTheDocument();
      expect(heading!.textContent).toBe('My Title');
    });

    it('renders ## heading with h2 classes', () => {
      const { container } = render(<MarkdownText content="## Section Header" />);
      const heading = container.querySelector('.text-lg.font-semibold');
      expect(heading).toBeInTheDocument();
      expect(heading!.textContent).toBe('Section Header');
    });

    it('renders ### heading with h3 classes', () => {
      const { container } = render(<MarkdownText content="### Subsection" />);
      const heading = container.querySelector('.text-base.font-semibold');
      expect(heading).toBeInTheDocument();
      expect(heading!.textContent).toBe('Subsection');
    });

    it('does not render heading without space after #', () => {
      const { container } = render(<MarkdownText content="#nospace" />);
      expect(container.querySelector('.text-xl')).toBeNull();
      expect(container.querySelector('.font-bold')).toBeNull();
    });

    it('applies dark mode class to headings', () => {
      const { container } = render(<MarkdownText content="# Dark Title" />);
      const heading = container.querySelector('.dark\\:text-gray-100');
      expect(heading).toBeInTheDocument();
    });

    it('applies renderInline to heading content (bold inside heading works)', () => {
      const { container } = render(<MarkdownText content="# **Bold** Heading" />);
      const strong = container.querySelector('.text-xl strong');
      expect(strong).toBeInTheDocument();
      expect(strong!.textContent).toBe('Bold');
    });
  });

  // T013: Table rendering tests (US3)
  describe('Table rendering', () => {
    const tableContent = '| Name | Age |\n|------|-----|\n| Alice | 30 |\n| Bob | 25 |';

    it('renders a markdown table with table element', () => {
      const { container } = render(<MarkdownText content={tableContent} />);
      expect(container.querySelector('table')).toBeInTheDocument();
    });

    it('renders table header row with th elements', () => {
      const { container } = render(<MarkdownText content={tableContent} />);
      const headers = container.querySelectorAll('th');
      expect(headers).toHaveLength(2);
      expect(headers[0].textContent).toBe('Name');
      expect(headers[1].textContent).toBe('Age');
    });

    it('renders table data rows with td elements', () => {
      const { container } = render(<MarkdownText content={tableContent} />);
      const rows = container.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(2);
    });

    it('wraps table in overflow-x-auto container', () => {
      const { container } = render(<MarkdownText content={tableContent} />);
      const wrapper = container.querySelector('.overflow-x-auto');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper!.querySelector('table')).toBeInTheDocument();
    });

    it('applies renderInline to cell content (bold in cell works)', () => {
      const content = '| Name | Score |\n|------|-------|\n| **Alice** | 100 |';
      const { container } = render(<MarkdownText content={content} />);
      const strong = container.querySelector('td strong');
      expect(strong).toBeInTheDocument();
      expect(strong!.textContent).toBe('Alice');
    });

    it('applies dark mode classes to table elements', () => {
      const { container } = render(<MarkdownText content={tableContent} />);
      const th = container.querySelector('th');
      expect(th!.className).toContain('dark:bg-gray-700');
      const td = container.querySelector('td');
      expect(td!.className).toContain('dark:border-gray-600');
    });
  });

  // T014: Streaming partial-table safety test (US3)
  describe('Partial table during streaming', () => {
    it('does not render a table when only header row present (no separator row)', () => {
      const partialTable = '| Name | Age |';
      const { container } = render(<MarkdownText content={partialTable} streaming />);
      expect(container.querySelector('table')).toBeNull();
    });

    it('does not render a table when separator row not yet arrived', () => {
      const partialTable = '| Name | Age |\n| Alice | 30 |';
      const { container } = render(<MarkdownText content={partialTable} streaming />);
      // Second line is a data row, not a separator — should not be detected as table
      expect(container.querySelector('table')).toBeNull();
    });

    it('renders table correctly once separator row is present', () => {
      const completeTable = '| Name | Age |\n|------|-----|\n| Alice | 30 |';
      const { container } = render(<MarkdownText content={completeTable} />);
      expect(container.querySelector('table')).toBeInTheDocument();
    });
  });
});
