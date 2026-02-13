import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = `toast-${++toastCounter}`;
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      addToast: () => {},
      removeToast: () => {},
      toasts: [] as Toast[],
    };
  }
  return context;
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const dur = toast.duration ?? 3000;
    if (dur > 0) {
      timerRef.current = setTimeout(() => {
        setExiting(true);
        setTimeout(onRemove, 300);
      }, dur);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [toast.duration, onRemove]);

  const icons: Record<ToastType, string> = {
    success: '\u2713',
    error: '\u2717',
    warning: '\u26A0',
    info: '\u2139',
  };

  const colors: Record<ToastType, string> = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-yellow-500',
    info: 'bg-blue-600',
  };

  return (
    <div
      role="alert"
      className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm max-w-sm transition-all duration-300 ${colors[toast.type]} ${
        exiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
      }`}
    >
      <span className="text-lg flex-shrink-0">{icons[toast.type]}</span>
      <span className="flex-1 min-w-0">{toast.message}</span>
      <button
        onClick={() => { setExiting(true); setTimeout(onRemove, 300); }}
        className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity ml-1"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-20 right-4 z-[100] flex flex-col gap-2 pointer-events-none sm:bottom-6"
      aria-live="polite"
    >
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={() => removeToast(toast.id)} />
        </div>
      ))}
    </div>
  );
}
