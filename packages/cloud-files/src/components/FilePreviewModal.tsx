import { useEffect, useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { FileItem, SharedFileItem } from '../types';

interface FilePreviewModalProps {
  file: FileItem | SharedFileItem | null;
  onClose: () => void;
}

function isTextType(ct: string): boolean {
  return ct.startsWith('text/') ||
    ct === 'application/json' ||
    ct === 'application/xml' ||
    ct === 'application/javascript' ||
    ct === 'application/typescript';
}

function isMarkdown(ct: string, name: string): boolean {
  return ct === 'text/markdown' || name.endsWith('.md');
}

function isCsv(ct: string, name: string): boolean {
  return ct === 'text/csv' || name.endsWith('.csv');
}

function isHtml(ct: string, name: string): boolean {
  return ct === 'text/html' || name.endsWith('.html') || name.endsWith('.htm');
}

function parseCsvToRows(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Simple CSV parser — handles quoted fields with commas
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (ch === '"') {
        if (inQuotes && trimmed[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    rows.push(cells);
  }
  return rows;
}

function TextPreview({ content, className }: { content: string; className?: string }) {
  return (
    <pre className={`w-full text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 overflow-auto whitespace-pre-wrap break-words font-mono ${className ?? ''}`}>
      {content}
    </pre>
  );
}

function CsvTable({ content }: { content: string }) {
  const rows = parseCsvToRows(content);
  if (rows.length === 0) return <TextPreview content={content} />;

  const header = rows[0];
  const body = rows.slice(1);

  return (
    <div className="w-full overflow-auto">
      <table className="w-full text-sm text-left border-collapse">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-700">
            {header.map((cell, i) => (
              <th key={i} className="px-3 py-2 font-semibold text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 whitespace-nowrap">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-1.5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MarkdownPreview({ content }: { content: string }) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    let cancelled = false;
    import('marked').then(({ marked }) => {
      if (cancelled) return;
      const result = marked.parse(content);
      if (typeof result === 'string') {
        setHtml(result);
      } else {
        result.then(h => { if (!cancelled) setHtml(h); });
      }
    }).catch(() => {
      if (!cancelled) setHtml(`<pre>${content}</pre>`);
    });
    return () => { cancelled = true; };
  }, [content]);

  return (
    <div
      className="w-full prose dark:prose-invert prose-sm max-w-none overflow-auto"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function HtmlPreview({ content }: { content: string }) {
  const [blobUrl, setBlobUrl] = useState('');

  useEffect(() => {
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [content]);

  if (!blobUrl) return null;

  return (
    <iframe
      src={blobUrl}
      title="HTML Preview"
      sandbox="allow-same-origin"
      className="w-full h-[70vh] border border-gray-200 dark:border-gray-600 rounded bg-white"
    />
  );
}

export default function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  const { t } = useTranslation();
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!file) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [file, onClose]);

  // Fetch text content for text-based files
  useEffect(() => {
    if (!file) { setTextContent(null); return; }

    const ct = file.contentType;
    const name = file.fileName;
    const needsFetch = isTextType(ct) || isMarkdown(ct, name) || isCsv(ct, name) || isHtml(ct, name) ||
      name.endsWith('.svg') || name.endsWith('.rtf') ||
      // Fallback: octet-stream with text-like extension
      (ct === 'application/octet-stream' && /\.(md|txt|csv|json|xml|html|htm|js|ts|py|rtf)$/i.test(name));

    if (!needsFetch) { setTextContent(null); return; }

    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(file.downloadUrl)
      .then(res => {
        if (!res.ok) throw new Error('Fetch failed');
        return res.text();
      })
      .then(text => { if (!cancelled) setTextContent(text); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [file]);

  if (!file) return null;

  const ct = file.contentType;
  const name = file.fileName;
  const isImage = ct.startsWith('image/') && !name.endsWith('.svg');
  const isSvg = ct === 'image/svg+xml' || name.endsWith('.svg');
  const isPdf = ct === 'application/pdf';
  const isVideo = ct.startsWith('video/');
  const isAudio = ct.startsWith('audio/');
  const isMd = isMarkdown(ct, name) || (ct === 'application/octet-stream' && name.endsWith('.md'));
  const isCsvFile = isCsv(ct, name);
  const isHtmlFile = isHtml(ct, name);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('cloudFiles.preview')}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 dark:bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate mr-4">{file.fileName}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('cloudFiles.closePreview')}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 min-h-0">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {error && (
            <p className="text-red-500 dark:text-red-400 text-sm text-center py-8">{t('cloudFiles.previewError')}</p>
          )}
          {!loading && !error && (
            <>
              {isImage && (
                <div className="flex items-center justify-center">
                  <img src={file.downloadUrl} alt={file.fileName} className="max-h-full max-w-full object-contain rounded" />
                </div>
              )}
              {isSvg && textContent && (
                <div className="flex items-center justify-center">
                  <img src={file.downloadUrl} alt={file.fileName} className="max-h-full max-w-full object-contain rounded" />
                </div>
              )}
              {isPdf && (
                <iframe src={file.downloadUrl} title={file.fileName} className="w-full h-[70vh] border-0 rounded" />
              )}
              {isVideo && (
                <video src={file.downloadUrl} controls className="w-full max-h-[70vh] rounded" aria-label={file.fileName}>
                  {t('cloudFiles.previewNotSupported')}
                </video>
              )}
              {isAudio && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <svg className="w-16 h-16 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                  </svg>
                  <audio src={file.downloadUrl} controls className="w-full max-w-md" aria-label={file.fileName}>
                    {t('cloudFiles.previewNotSupported')}
                  </audio>
                </div>
              )}
              {isMd && textContent && <MarkdownPreview content={textContent} />}
              {isCsvFile && textContent && <CsvTable content={textContent} />}
              {isHtmlFile && textContent && <HtmlPreview content={textContent} />}
              {/* Generic text/code preview */}
              {!isImage && !isSvg && !isPdf && !isVideo && !isAudio && !isMd && !isCsvFile && !isHtmlFile && textContent && (
                <TextPreview content={textContent} />
              )}
              {/* Unsupported */}
              {!isImage && !isSvg && !isPdf && !isVideo && !isAudio && !textContent && !loading && (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">{t('cloudFiles.previewNotSupported')}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
