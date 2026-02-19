import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import { submitFeedback, FeedbackData, logEvent } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

type Category = FeedbackData['category'];

const CATEGORY_KEYS: { value: Category; key: string }[] = [
  { value: 'general', key: 'feedback.categoryGeneral' },
  { value: 'bug', key: 'feedback.categoryBug' },
  { value: 'feature', key: 'feedback.categoryFeature' },
  { value: 'other', key: 'feedback.categoryOther' },
];

export default function FeedbackButton({ hasActivePlayer }: { hasActivePlayer?: boolean }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category>('general');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const reset = useCallback(() => {
    setCategory('general');
    setRating(0);
    setHoverRating(0);
    setMessage('');
    setStatus('idle');
  }, []);

  const closeModal = useCallback(() => {
    setOpen(false);
    // Restore focus to the trigger button when the modal closes
    previouslyFocused.current?.focus();
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, closeModal]);

  // Focus trap: cycle Tab focus within the dialog
  useEffect(() => {
    if (!open || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const focusableSelector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const handleTabTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = dialog.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleTabTrap);
    return () => document.removeEventListener('keydown', handleTabTrap);
  }, [open]);

  // Move initial focus into the dialog when opened
  useEffect(() => {
    if (open && dialogRef.current) {
      const heading = dialogRef.current.querySelector<HTMLElement>('h2');
      heading?.focus();
    }
  }, [open]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  const handleOpen = () => {
    previouslyFocused.current = document.activeElement as HTMLElement;
    reset();
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus('sending');
    try {
      await submitFeedback(
        { category, rating, message: message.trim() },
        user ? { uid: user.uid, email: user.email, displayName: user.displayName } : null,
      );
      logEvent('feedback_submitted', { category, rating });
      setStatus('sent');
      setTimeout(() => {
        closeModal();
        reset();
      }, 1500);
    } catch (err) {
      console.error('[Feedback] submission failed:', err);
      setStatus('error');
    }
  };

  const starLabel = (count: number) =>
    count === 1
      ? t('feedback.ratingStars').replace('{count}', '1')
      : t('feedback.ratingStarsPlural').replace('{count}', String(count));

  return (
    <>
      {/* Floating trigger button */}
      <button
        ref={triggerRef}
        onClick={handleOpen}
        className={`fixed ${hasActivePlayer ? 'bottom-36 md:bottom-24' : 'bottom-20 md:bottom-6'} right-6 z-40 flex items-center gap-2 p-3 md:px-4 md:py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-medium rounded-full shadow-lg hover:shadow-xl transition-all focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 focus-visible:outline-none`}
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        aria-haspopup="dialog"
        aria-label={t('feedback.button')}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className="hidden md:inline">{t('feedback.button')}</span>
      </button>

      {/* Modal backdrop + dialog */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60"
            onClick={closeModal}
            aria-hidden="true"
          />

          {/* Dialog */}
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-dialog-title"
            className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-black/40 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2
                id="feedback-dialog-title"
                tabIndex={-1}
                className="text-lg font-semibold text-gray-900 dark:text-white outline-none"
              >
                {t('feedback.title')}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                aria-label={t('feedback.close')}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {status === 'sent' ? (
              <div className="px-5 py-10 text-center" role="status">
                <svg className="w-12 h-12 mx-auto text-green-500 dark:text-green-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-700 dark:text-gray-200 font-medium">{t('feedback.success')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4" noValidate>
                {/* Category */}
                <div>
                  <label htmlFor="fb-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('feedback.category')}
                  </label>
                  <select
                    id="fb-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  >
                    {CATEGORY_KEYS.map((c) => (
                      <option key={c.value} value={c.value}>{t(c.key as any)}</option>
                    ))}
                  </select>
                </div>

                {/* Star Rating */}
                <fieldset>
                  <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('feedback.rating')}{' '}
                    <span className="text-gray-400 dark:text-gray-500 font-normal">({t('feedback.ratingOptional')})</span>
                  </legend>
                  <div className="flex gap-1" role="radiogroup" aria-label={t('feedback.rating')}>
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = star <= (hoverRating || rating);
                      const checked = star === rating;
                      return (
                        <button
                          key={star}
                          type="button"
                          role="radio"
                          aria-checked={checked}
                          aria-label={starLabel(star)}
                          onClick={() => setRating(star === rating ? 0 : star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                        >
                          <svg
                            className={`w-7 h-7 transition-colors ${
                              active
                                ? 'text-yellow-400 dark:text-yellow-300'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Message */}
                <div>
                  <label htmlFor="fb-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('feedback.message')}
                  </label>
                  <textarea
                    id="fb-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('feedback.messagePlaceholder')}
                    rows={4}
                    required
                    aria-required="true"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition"
                  />
                </div>

                {/* Error message */}
                {status === 'error' && (
                  <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                    {t('feedback.error')}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!message.trim() || status === 'sending'}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-blue-400 dark:disabled:bg-blue-400/50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-800 focus-visible:outline-none"
                  aria-disabled={!message.trim() || status === 'sending'}
                >
                  {status === 'sending' ? t('feedback.sending') : t('feedback.submit')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
