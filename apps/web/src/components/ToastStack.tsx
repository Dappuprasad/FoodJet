import { useToast } from '../context/toast-context';

const TONE_ICONS = {
  success: '✓',
  error: '!',
  info: 'i',
} as const;

export function ToastStack() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          className={`toast toast-${toast.tone}`}
          onClick={() => dismiss(toast.id)}
        >
          <span className="toast-icon" aria-hidden="true">
            {TONE_ICONS[toast.tone]}
          </span>
          {toast.message}
        </button>
      ))}
    </div>
  );
}
