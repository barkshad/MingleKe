/** Free launch window: everyone can join free until this ISO date. */
export const FREE_UNTIL = '2026-09-30T23:59:59+03:00';

export function isFreeWindow(): boolean {
  return Date.now() < new Date(FREE_UNTIL).getTime();
}

export function freeWindowMsLeft(): number {
  const end = new Date(FREE_UNTIL).getTime();
  return Math.max(0, end - Date.now());
}

export function formatCountdown(ms: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { days, hours, minutes, seconds, total };
}

export function freeWindowTextLabel(): string {
  const end = new Date(FREE_UNTIL);
  return end.toLocaleDateString('en-KE', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
