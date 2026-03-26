import { useRef, useState, useCallback, useEffect } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { ScanPage } from '../types';

interface PageTrayProps {
  pages: ScanPage[];
  activePageId: string | null;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onSelect: (pageId: string) => void;
  onDelete: (pageId: string) => void;
  onAddPage: () => void;
  maxReached: boolean;
}

export function PageTray({
  pages,
  activePageId,
  onReorder,
  onSelect,
  onDelete,
  onAddPage,
  maxReached,
}: PageTrayProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Pointer-based drag reorder
  const handlePointerDown = useCallback(
    (e: React.PointerEvent, index: number) => {
      // Only start drag on long-press or deliberate hold
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragIndex(index);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragIndex === null || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + containerRef.current.scrollLeft;
      const thumbWidth = 72; // 64px thumb + 8px gap
      const overIndex = Math.min(Math.max(Math.floor(x / thumbWidth), 0), pages.length - 1);
      setDragOverIndex(overIndex);
    },
    [dragIndex, pages.length]
  );

  const handlePointerUp = useCallback(() => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      onReorder(dragIndex, dragOverIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragIndex, dragOverIndex, onReorder]);

  // Keyboard reorder support
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        onReorder(index, index - 1);
      } else if (e.key === 'ArrowRight' && index < pages.length - 1) {
        e.preventDefault();
        onReorder(index, index + 1);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onDelete(pages[index].id);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(pages[index].id);
      }
    },
    [onReorder, onDelete, onSelect, pages]
  );

  // Draw thumbnails on mini canvases
  const thumbRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());
  useEffect(() => {
    for (const page of pages) {
      const canvas = thumbRefs.current.get(page.id);
      if (!canvas) continue;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      const scale = 56 / Math.max(page.imageData.width, page.imageData.height);
      canvas.width = Math.round(page.imageData.width * scale);
      canvas.height = Math.round(page.imageData.height * scale);
      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = page.imageData.width;
      tmpCanvas.height = page.imageData.height;
      tmpCanvas.getContext('2d')!.putImageData(page.imageData, 0, 0);
      ctx.drawImage(tmpCanvas, 0, 0, canvas.width, canvas.height);
    }
  }, [pages]);

  if (pages.length === 0) return null;

  return (
    <div className="w-full bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-3 py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {t('docScanner.pageTray')} ({pages.length})
        </span>
      </div>
      <div
        ref={containerRef}
        className="flex gap-2 overflow-x-auto pb-1"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {pages.map((page, index) => {
          const isActive = page.id === activePageId;
          const isDragging = dragIndex === index;
          const isDragOver = dragOverIndex === index && dragIndex !== null && dragIndex !== index;

          return (
            <div
              key={page.id}
              className={`relative flex-shrink-0 w-16 cursor-pointer rounded-md overflow-hidden border-2 transition-all ${
                isActive
                  ? 'border-blue-500 dark:border-blue-400'
                  : isDragOver
                    ? 'border-blue-300 dark:border-blue-600'
                    : 'border-gray-300 dark:border-gray-600'
              } ${isDragging ? 'opacity-50 scale-95' : ''}`}
              onPointerDown={(e) => handlePointerDown(e, index)}
              onClick={() => onSelect(page.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              tabIndex={0}
              role="button"
              aria-label={`${t('docScanner.page', { n: index + 1 })}${isActive ? ' (selected)' : ''}`}
            >
              {/* Page number badge */}
              <span className="absolute top-0.5 left-0.5 z-10 bg-black/60 text-white text-[10px] font-bold rounded px-1 leading-4">
                {index + 1}
              </span>

              {/* Delete button */}
              <button
                type="button"
                className="absolute top-0.5 right-0.5 z-10 bg-red-500/80 hover:bg-red-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(page.id);
                }}
                aria-label={`${t('docScanner.delete')} ${t('docScanner.page', { n: index + 1 })}`}
              >
                ×
              </button>

              {/* Thumbnail */}
              <canvas
                ref={(el) => {
                  if (el) thumbRefs.current.set(page.id, el);
                  else thumbRefs.current.delete(page.id);
                }}
                className="w-full aspect-[3/4] bg-gray-200 dark:bg-gray-700 object-cover"
              />
            </div>
          );
        })}

        {/* Add page button */}
        {!maxReached && (
          <button
            type="button"
            className="flex-shrink-0 w-16 aspect-[3/4] rounded-md border-2 border-dashed border-gray-400 dark:border-gray-500 flex items-center justify-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors min-h-[44px]"
            onClick={onAddPage}
            aria-label={t('docScanner.addPage')}
          >
            <span className="text-2xl text-gray-400 dark:text-gray-500">+</span>
          </button>
        )}
      </div>
    </div>
  );
}
