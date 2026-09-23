/** Network helpers for low-bandwidth and flaky connections. */

export function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, ms = 12000): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), ms);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => window.clearTimeout(timer));
}

export async function fetchJsonWithTimeout<T>(input: RequestInfo, init: RequestInit = {}, ms = 12000): Promise<T> {
  const res = await fetchWithTimeout(input, init, ms);
  return (await res.json()) as T;
}

type Connection = { saveData?: boolean; effectiveType?: string; downlink?: number };

export function getConnection(): Connection | null {
  const nav = navigator as Navigator & {
    connection?: Connection;
    mozConnection?: Connection;
    webkitConnection?: Connection;
  };
  return nav.connection || nav.mozConnection || nav.webkitConnection || null;
}

export function isLowBandwidth(): boolean {
  const c = getConnection();
  if (!c) return false;
  if (c.saveData) return true;
  const type = c.effectiveType || '';
  return type === 'slow-2g' || type === '2g' || (typeof c.downlink === 'number' && c.downlink > 0 && c.downlink < 1);
}

export function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine !== false;
}

/** Timeout a Firestore-ish promise so the UI can fall back to the seed deck. */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    promise.then(
      (v) => {
        window.clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        window.clearTimeout(timer);
        reject(e);
      }
    );
  });
}
