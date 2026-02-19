import React, { useState } from 'react';
import { useTranslation } from '@mycircle/shared';

interface FlipCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  flipped?: boolean;
  onFlip?: () => void;
}

export default function FlipCard({ front, back, flipped: controlledFlipped, onFlip }: FlipCardProps) {
  const { t } = useTranslation();
  const [internalFlipped, setInternalFlipped] = useState(false);
  const isFlipped = controlledFlipped ?? internalFlipped;

  const handleClick = () => {
    if (onFlip) {
      onFlip();
    } else {
      setInternalFlipped(f => !f);
    }
  };

  return (
    <div
      className="perspective-1000 w-full max-w-md mx-auto cursor-pointer"
      style={{ perspective: '1000px' }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}
      aria-label={t('flashcards.tapToFlip')}
    >
      <div
        className="relative w-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          minHeight: '240px',
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 w-full h-full rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center p-6"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="text-center">{front}</div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 w-full h-full rounded-2xl bg-blue-50 dark:bg-blue-900/30 shadow-lg border border-blue-200 dark:border-blue-700 flex items-center justify-center p-6"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="text-center">{back}</div>
        </div>
      </div>
    </div>
  );
}
