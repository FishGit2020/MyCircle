import React from 'react';

interface MarkdownTextProps {
  content: string;
}

/**
 * Lightweight markdown renderer for AI assistant responses.
 * Handles: code blocks, inline code, bold, italic, bullet lists, numbered lists.
 */
export default function MarkdownText({ content }: MarkdownTextProps) {
  // Split into code blocks and text segments
  const segments = content.split(/(```[\s\S]*?```)/g);

  return (
    <>
      {segments.map((segment, i) => {
        // Code block
        if (segment.startsWith('```') && segment.endsWith('```')) {
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

        // Regular text — process line by line
        const lines = segment.split('\n');
        return (
          <React.Fragment key={i}>
            {lines.map((line, j) => {
              const trimmed = line.trimStart();

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
