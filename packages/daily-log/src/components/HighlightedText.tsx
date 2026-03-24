interface HighlightedTextProps {
  text: string;
  query: string;
}

export default function HighlightedText({ text, query }: HighlightedTextProps) {
  if (!query.trim()) return <>{text}</>;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-100 dark:bg-yellow-800/40 rounded px-0.5 not-italic">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}
