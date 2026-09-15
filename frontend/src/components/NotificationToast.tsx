import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  RiCheckboxCircleFill,
  RiErrorWarningFill,
  RiInformationFill,
  RiCloseLine,
} from '@remixicon/react';
import { cx } from '@/utils/cx';

export type ToastStatus = 'success' | 'warning' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  status: ToastStatus;
  duration?: number;
  timestamp?: number;
}

type ToastListener = (toasts: ToastMessage[]) => void;

class ToastStore {
  private toasts: ToastMessage[] = [];
  private listeners: Set<ToastListener> = new Set();

  subscribe(listener: ToastListener) {
    this.listeners.add(listener);
    listener(this.toasts);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify(toast: Omit<ToastMessage, 'id'> & { id?: string }) {
    const id = toast.id || Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = {
      ...toast,
      id,
      timestamp: Date.now(),
      duration: toast.duration ?? 6000,
    };

    // Filter out identical existing active toast to prevent rapid duplication
    this.toasts = [
      ...this.toasts.filter((t) => !(t.title === newToast.title && t.description === newToast.description)),
      newToast,
    ];
    this.emit();
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.emit();
  }

  private emit() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }
}

export const toastStore = new ToastStore();

export const notify = (toast: Omit<ToastMessage, 'id'> & { id?: string }) => {
  toastStore.notify(toast);
};

const statusVisuals = {
  success: {
    icon: RiCheckboxCircleFill,
    color: 'text-emerald-400',
    border: 'border-emerald-500/25',
    bg: 'bg-emerald-500/10',
    bar: 'bg-emerald-500',
  },
  warning: {
    icon: RiErrorWarningFill,
    color: 'text-amber-400',
    border: 'border-amber-500/25',
    bg: 'bg-amber-500/10',
    bar: 'bg-amber-500',
  },
  error: {
    icon: RiErrorWarningFill,
    color: 'text-rose-400',
    border: 'border-rose-500/25',
    bg: 'bg-rose-500/10',
    bar: 'bg-rose-500',
  },
  info: {
    icon: RiInformationFill,
    color: 'text-sky-400',
    border: 'border-sky-500/25',
    bg: 'bg-sky-500/10',
    bar: 'bg-sky-500',
  },
};

export const NotificationToastItem: React.FC<{
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}> = ({ toast, onDismiss }) => {
  const visual = statusVisuals[toast.status] || statusVisuals.info;
  const Icon = visual.icon;

  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return;
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.92, transition: { duration: 0.2 } }}
      className={cx(
        'relative overflow-hidden w-full rounded-2xl bg-background-secondary-default/95 backdrop-blur-xl border border-border-button-default shadow-2xl p-4 flex gap-3 text-text-primary pointer-events-auto',
        visual.border
      )}
      role="alert"
    >
      <div className={cx('flex size-8 shrink-0 items-center justify-center rounded-xl', visual.bg, visual.color)}>
        <Icon className="size-4.5" />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-body-2-medium font-semibold text-text-primary leading-tight">
            {toast.title}
          </h4>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-background-tertiary-default transition-colors"
            title="Dismiss notification"
          >
            <RiCloseLine className="size-4" />
          </button>
        </div>

        {toast.description && (
          <p className="text-caption-1-regular text-text-secondary leading-relaxed break-words">
            {toast.description}
          </p>
        )}
      </div>

      {toast.duration && toast.duration > 0 && (
        <motion.span
          aria-hidden="true"
          className={cx('absolute inset-x-0 bottom-0 h-[2.5px] origin-left', visual.bar)}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
};

export const NotificationToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    return toastStore.subscribe((updated) => setToasts(updated));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2.5 w-[min(420px,calc(100vw-32px))] pointer-events-none select-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <NotificationToastItem
            key={toast.id}
            toast={toast}
            onDismiss={(id) => toastStore.dismiss(id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
