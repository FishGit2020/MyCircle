import React from 'react';

interface MarkdownTextProps {
  content: string;
  /** When true, handles unclosed code blocks (streaming partial content) */
  streaming?: boolean;
}

/**
 * Lightweight markdown renderer for AI assistant responses.
 * Handles: code blocks, tables, headings, inline code, bold, italic, bullet lists, numbered lists.
 */
export default function MarkdownText({ content, streaming }: MarkdownTextProps) {
  // Split into code blocks and text segments
  // When streaming, handle unclosed code blocks (opening ``` without closing)
  let processedContent = content;
  if (streaming) {
    const backtickCount = (content.match(/```/g) || []).length;
    if (backtickCount % 2 !== 0) {
      // Unclosed code block — append closing ``` so it renders as code
      processedContent = content + '\n```';
    }
  }
  // Stage 1: Split by code blocks
  const codeSegments = processedContent.split(/(```[\s\S]*?```)/g);

  // Stage 1.5: Split non-code segments by markdown tables, then flatten
  const segments: Array<{ content: string; isCode: boolean }> = [];
  for (const seg of codeSegments) {
    if (seg.startsWith('```') && seg.endsWith('```')) {
      segments.push({ content: seg, isCode: true });
    } else {
      // Split by table blocks (2+ consecutive pipe-delimited lines)
      const tableParts = seg.split(/((?:\|[^\n]+\|(?:\n|$)){2,})/g);
      for (const part of tableParts) {
        segments.push({ content: part, isCode: false });
      }
    }
  }

  return (
    <>
      {segments.map(({ content: segment, isCode }, i) => {
        // Code block
        if (isCode) {
          const inner = segment.slice(3, -3);
          // Remove optional language identifier on first line
          const firstNewline = inner.indexOf('\n');
          const code = firstNewline > -1 ? inner.slice(firstNewline + 1) : inner;
          return (
            <pre
              key={i}
              className="my-2 p-3 rounded-lg bg-gray-800 dark:bg-gray-900 text-gray-100 text-xs overflow-x-auto font-mono"
            >
              <code>{code}</code>
            </pre>
          );
        }

        // T009/T010/T011: Markdown table (Stage 1.5 — requires separator row)
        if (isMarkdownTable(segment)) {
          return renderMarkdownTable(segment, i);
        }

        // Regular text — process line by line (Stage 2)
        const lines = segment.split('\n');
        return (
          <React.Fragment key={i}>
            {lines.map((line, j) => {
              const trimmed = line.trimStart();

              // T008: Headings (#, ##, ### — ATX-style only, space required)
              const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)/);
              if (headingMatch) {
                const level = headingMatch[1].length;
                const classMap = ['text-xl font-bold', 'text-lg font-semibold', 'text-base font-semibold'];
                return (
                  <div key={j} className={`mt-3 mb-1 text-gray-900 dark:text-gray-100 ${classMap[level - 1]}`}>
                    {renderInline(headingMatch[2])}
                  </div>
                );
              }

              // Bullet list items
              if (/^[-*]\s+/.test(trimmed)) {
                return (
                  <div key={j} className="flex gap-1.5 ml-2">
                    <span className="text-gray-400 select-none">&bull;</span>
                    <span>{renderInline(trimmed.replace(/^[-*]\s+/, ''))}</span>
                  </div>
                );
              }

              // Numbered list items
              if (/^\d+[.)]\s+/.test(trimmed)) {
                const match = trimmed.match(/^(\d+[.)])\s+(.*)/);
                if (match) {
                  return (
                    <div key={j} className="flex gap-1.5 ml-2">
                      <span className="text-gray-400 select-none min-w-[1.2em] text-right">{match[1]}</span>
                      <span>{renderInline(match[2])}</span>
                    </div>
                  );
                }
              }

              // Empty line = paragraph break
              if (trimmed === '') {
                return <div key={j} className="h-2" />;
              }

              // Regular paragraph
              return (
                <React.Fragment key={j}>
                  {j > 0 && lines[j - 1].trim() !== '' && <br />}
                  {renderInline(line)}
                </React.Fragment>
              );
            })}
          </React.Fragment>
        );
      })}
    </>
  );
}

// T009: Detect a complete markdown table (requires separator row as gate)
function isMarkdownTable(text: string): boolean {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return false;
  if (!lines[0].includes('|')) return false;
  // Separator row: only pipes, dashes, colons, spaces
  return /^\|[\s\-:|]+\|$/.test(lines[1].trim());
}

// T010: Render a markdown table with styled header, body, and dark mode variants
function renderMarkdownTable(segment: string, key: number): React.ReactNode {
  const lines = segment.trim().split('\n').filter(l => l.trim());
  const parseRow = (line: string): string[] =>
    line.split('|').slice(1, -1).map(cell => cell.trim());

  const headers = parseRow(lines[0]);
  // lines[1] is separator — skip it
  const rows = lines.slice(2).map(parseRow);

  return (
    <div key={key} className="overflow-x-auto my-2">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {headers.map((header, i) => (
              <th
                key={i}
                className="text-left px-3 py-2 font-semibold bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
              >
                {renderInline(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="even:bg-gray-50 dark:even:bg-gray-800/50">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                >
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  // Process inline patterns: **bold**, *italic*, `code`
  const parts: React.ReactNode[] = [];
  // regex: code, bold, italic (in priority order)
  const regex = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Push text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // Inline code
      parts.push(
        <code key={match.index} className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-sm font-mono">
          {match[1].slice(1, -1)}
        </code>
      );
    } else if (match[2]) {
      // Bold
      parts.push(<strong key={match.index}>{match[2].slice(2, -2)}</strong>);
    } else if (match[3]) {
      // Italic
      parts.push(<em key={match.index}>{match[3].slice(1, -1)}</em>);
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}
