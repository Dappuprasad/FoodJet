import { formatPaise } from '@foodjet/shared';

export { formatPaise };

const TIME_FORMAT = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const DATE_TIME_FORMAT = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

export function formatTime(iso: string): string {
  return TIME_FORMAT.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return DATE_TIME_FORMAT.format(new Date(iso));
}

/** "in 24 min" / "any moment now" / "12 min late". */
export function formatEta(iso: string, now = Date.now()): string {
  const diffMinutes = Math.round((new Date(iso).getTime() - now) / 60_000);

  if (diffMinutes > 1) return `in ${diffMinutes} min`;
  if (diffMinutes >= -1) return 'any moment now';
  return `${Math.abs(diffMinutes)} min late`;
}
