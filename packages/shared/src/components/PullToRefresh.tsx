import React, { useRef, useState, useCallback, type ReactNode } from 'react';
import { useTranslation } from '../i18n/I18nContext';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
}

const THRESHOLD = 60;
const MAX_PULL = 80;

const spinKeyframes = `@keyframes pull-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);

  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (refreshing) return;
    if (window.scrollY === 0) {
      startYRef.current = e.touches[0].clientY;
      pullingRef.current = false;
    }
  }, [refreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (refreshing) return;
    if (window.scrollY !== 0) {
      pullingRef.current = false;
      setPullDistance(0);
      return;
    }

    const deltaY = e.touches[0].clientY - startYRef.current;
    if (deltaY > 0) {
      pullingRef.current = true;
      // Apply resistance — pull distance grows slower the further you pull
      const distance = Math.min(deltaY * 0.5, MAX_PULL);
      setPullDistance(distance);
      e.preventDefault();
    } else {
      pullingRef.current = false;
      setPullDistance(0);
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pullingRef.current || refreshing) {
      setPullDistance(0);
      return;
    }

    if (pullDistance >= THRESHOLD) {
      setRefreshing(true);
      setPullDistance(THRESHOLD * 0.5); // Hold at indicator position
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    pullingRef.current = false;
  }, [pullDistance, refreshing, onRefresh]);

  const isPulling = pullDistance > 0 || refreshing;
  const pastThreshold = pullDistance >= THRESHOLD;

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', touchAction: 'pan-y' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Inject spinner keyframes */}
      {refreshing && <style>{spinKeyframes}</style>}

      {/* Pull indicator */}
      {isPulling && (
        <div
          role="status"
          aria-label={
            refreshing
              ? t('pullToRefresh.refreshing' as any)
              : pastThreshold
                ? t('pullToRefresh.release' as any)
                : t('pullToRefresh.hint' as any)
          }
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 4,
            overflow: 'hidden',
            paddingBottom: 4,
            height: pullDistance,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: refreshing ? 'pull-spin 1s linear infinite' : undefined,
            }}
          >
            {refreshing ? (
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg
                className={`w-5 h-5 transition-transform ${pastThreshold ? 'rotate-180 text-blue-500' : 'text-gray-400'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
          </div>
          <span className={`text-xs ${refreshing || pastThreshold ? 'text-blue-500' : 'text-gray-400'}`}>
            {refreshing
              ? t('pullToRefresh.refreshing' as any)
              : pastThreshold
                ? t('pullToRefresh.release' as any)
                : t('pullToRefresh.hint' as any)}
          </span>
        </div>
      )}

      {/* Content */}
      <div
        style={{
          transform: isPulling ? `translateY(${pullDistance}px)` : undefined,
          transition: pullingRef.current ? 'none' : 'transform 0.3s ease',
        }}
      >
        {children}
      </div>
    </div>
  );
}
