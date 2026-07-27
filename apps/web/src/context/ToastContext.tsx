import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  TOAST_DURATION_MS,
  ToastContext,
  type Toast,
  type ToastTone,
} from './toast-context';

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));

    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, message, tone }]);

      timers.current.set(
        id,
        setTimeout(() => dismiss(id), TOAST_DURATION_MS),
      );
    },
    [dismiss],
  );

  // Clearing pending timers on unmount stops setState firing into a dead tree.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending.values()) clearTimeout(timer);
      pending.clear();
    };
  }, []);

  const value = useMemo(() => ({ toasts, notify, dismiss }), [toasts, notify, dismiss]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
