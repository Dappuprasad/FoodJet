import { createContext, useContext } from 'react';

export type ToastTone = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

export interface ToastContextValue {
  toasts: Toast[];
  notify: (message: string, tone?: ToastTone) => void;
  dismiss: (id: number) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export const TOAST_DURATION_MS = 3200;

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}
