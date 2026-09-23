import { SEED_PROFILES, type SeedProfile } from './seedProfiles';

export type DemoMessage = {
  id: string;
  matchId: string;
  senderId: string;
  text: string;
  createdAt: number;
  fromBot?: boolean;
};

export type DemoThread = {
  id: string;
  seedUid: string;
  name: string;
  photo?: string;
  lastMessage?: string;
  lastMessageAt?: number;
  messages: DemoMessage[];
};

const THREADS_KEY = 'mingleke-demo-threads';
const SWIPED_KEY_PREFIX = 'mingleke-swiped-';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota
  }
}

export function demoMatchId(seedUid: string, userId: string) {
  // Stable id that looks like a normal match key, not a “demo” flag
  return `m_${seedUid}_${userId}`.replace(/[^\w-]/g, '').slice(0, 120);
}

export function isDemoThreadId(id: string) {
  return id.startsWith('m_mem-') || id.startsWith('demo-') || id.startsWith('m_seed-');
}

export function listDemoThreads(): DemoThread[] {
  const threads = read<DemoThread[]>(THREADS_KEY, []);
  return threads.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
}

export function getDemoThread(matchId: string): DemoThread | null {
  return listDemoThreads().find((t) => t.id === matchId) || null;
}

export function ensureDemoThread(seedUid: string, userId: string): DemoThread {
  const id = demoMatchId(seedUid, userId);
  const existing = getDemoThread(id);
  if (existing) return existing;

  const seed: SeedProfile | undefined = SEED_PROFILES.find((s) => s.uid === seedUid);
  const thread: DemoThread = {
    id,
    seedUid,
    name: seed?.name || 'Member',
    photo: seed?.photos?.[0],
    messages: [],
  };
  const threads = read<DemoThread[]>(THREADS_KEY, []).filter((t) => t.id !== id);
  threads.push(thread);
  write(THREADS_KEY, threads);
  return thread;
}

export function appendDemoMessage(matchId: string, message: DemoMessage): DemoThread | null {
  const threads = read<DemoThread[]>(THREADS_KEY, []);
  const idx = threads.findIndex((t) => t.id === matchId);
  if (idx < 0) return null;
  threads[idx].messages = [...(threads[idx].messages || []), message];
  threads[idx].lastMessage = message.text;
  threads[idx].lastMessageAt = message.createdAt;
  write(THREADS_KEY, threads);
  return threads[idx];
}

export function rememberLocalSwipe(userId: string, uid: string) {
  try {
    const key = `${SWIPED_KEY_PREFIX}${userId}`;
    const prev = read<string[]>(key, []);
    if (!prev.includes(uid)) write(key, [...prev, uid]);
  } catch {
    // ignore
  }
}

export function localSwipedUids(userId: string): string[] {
  return read<string[]>(`${SWIPED_KEY_PREFIX}${userId}`, []);
}

export function likedSeedProfiles(userId: string): SeedProfile[] {
  const swiped = new Set(localSwipedUids(userId));
  return SEED_PROFILES.filter((s) => swiped.has(s.uid));
}
