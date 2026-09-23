import { SEED_PROFILES, findMember, type MemberBrain, type SeedProfile } from './seedProfiles';
import { fetchJsonWithTimeout, isLowBandwidth } from './network';

/**
 * Valexy-style texting patterns: raw, emoji bursts, messy caps, light censoring,
 * Sheng fragments, feelings first. Polished AI cadence is banned.
 */

const VIBE_EMOJI = ['💔', '😂', '🤌', '🥲', '😭', '👀', '💀', '🔥', '❤️', '😌', '🥺', '✨', '🫶'];
const FILLERS = ['mehn', 'bana', 'kwani', 'sasa', 'wah', 'ai', 'hadi', 'buana'];
const CENSOR = [
  ['fuck', 'f*CK'],
  ['shit', 'sh*t'],
  ['damn', 'd*mn'],
  ['crap', 'cr*p'],
];

function pick<T>(arr: T[], last?: T): T {
  if (!arr.length) return '' as T;
  const pool = last ? arr.filter((x) => x !== last) : arr;
  const list = pool.length ? pool : arr;
  return list[Math.floor(Math.random() * list.length)];
}

function emojis(n = 1): string {
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(pick(VIBE_EMOJI));
  return out.join('');
}

function maybeCensor(line: string): string {
  let out = line;
  for (const [raw, cut] of CENSOR) {
    if (out.toLowerCase().includes(raw)) {
      out = out.replace(new RegExp(raw, 'gi'), cut);
      break;
    }
  }
  return out;
}

/**
 * Humanize: mixed casing, emoji slap, filler word, trailing emoji burst.
 * Not every line gets every treatment — variety is the point.
 */
function humanize(line: string): string {
  let out = maybeCensor(line.trim());
  const r = Math.random();

  if (r < 0.35) out = `${out} ${emojis(1)}`;
  if (r > 0.55 && r < 0.75) out = `${out} ${emojis(2)}`;
  if (r > 0.85) out = `${pick(FILLERS)} ${out}`;
  if (r < 0.12) out = out.replace(/\.(\s|$)/, ' ');
  if (r > 0.9 && out.length < 60) out = out.toUpperCase();
  // occasional double space / missing punctuation — typed on a phone
  if (Math.random() < 0.08) out = out.replace(/,\s/, '  ');
  return out;
}

/** Split a long thought into two chat bubbles worth of text sometimes. */
function maybeSplit(line: string): string {
  if (Math.random() > 0.2) return line;
  const parts = line.split(/(?<=[.!?])\s+/);
  if (parts.length < 2) return line;
  return `${parts[0]} ${emojis(1)} ${parts.slice(1).join(' ')}`;
}

function brainOf(seed?: SeedProfile): MemberBrain {
  return (
    seed?.brain || {
      voice: 'messy honest texter',
      humor: 'chaotic',
      never: 'polished essays',
      style: 'short emotional bursts',
      quirk: 'emoji slap after feelings',
      openers: ['okay hi 😭 what made you swipe me', 'we matched?? mehn 😂 talk now'],
      replies: ['wait say that again 💔', 'lol you’re funny 🤌 go on'],
      questions: ['what are we doing this weekend tho 👀'],
      topics: ['life', 'feelings'],
    }
  );
}

function topicHit(text: string, seed?: SeedProfile): boolean {
  const bag = [...(brainOf(seed).topics || []), ...(seed?.interests || []), '']
    .join(' ')
    .toLowerCase();
  return bag.split(/\s+/).some((t) => t && text.includes(t.slice(0, 4)));
}

/** Raw text from a specific person's brain + Valexy pattern layer. */
export function replyFromBrain(
  seed: SeedProfile | undefined,
  userText: string,
  turnIndex: number,
  lastLine?: string
): string {
  const b = brainOf(seed);
  const text = userText.toLowerCase();

  if (turnIndex === 0) return maybeSplit(humanize(pick(b.openers, lastLine)));

  if (/\b(fuck|shit|wtf|stress|tired|sad|cry|break|ex)\b/.test(text)) {
    return humanize(
      pick(
        [
          'ai mehn 💔 come here, tell me everything',
          'not that 🥲 we can talk tho, I’m here',
          'f*CK whoever did that 😭 continue',
        ],
        lastLine
      )
    );
  }

  if (/\b(love|marry|beautiful|cute|hot|babe|crush)\b/.test(text)) {
    return humanize(
      pick(
        [
          'ai stop 😂❤️ say more first',
          'you’re moving too fast mehn 🤌 wait',
          'okayyyy 🥺 but buy me food first',
        ],
        lastLine
      )
    );
  }

  if (text.endsWith('?')) {
    return maybeSplit(humanize(`${pick(b.replies, lastLine)} ${emojis(1)}`));
  }

  if (/\b(hi|hey|hello|niaje|sasa|sup)\b/.test(text) && text.length < 20) {
    return humanize(pick([pick(b.openers, lastLine), 'sasa 👋 you just say hi like that?'], lastLine));
  }

  if (text.trim().length < 10) {
    return humanize(pick(['that’s it?? 😭', 'talk to me mehn', 'and?? 👀', 'lol go on 🤌'], lastLine));
  }

  if (topicHit(text, seed) && Math.random() < 0.5) {
    return maybeSplit(humanize(pick([...b.replies, ...b.questions], lastLine)));
  }

  if (Math.random() < 0.3) return humanize(pick(b.questions, lastLine));
  return maybeSplit(humanize(pick(b.replies, lastLine)));
}

export function openerFromBrain(seedUid: string): string {
  const seed = findMember(seedUid) || SEED_PROFILES.find((s) => s.uid === seedUid);
  return maybeSplit(humanize(pick(brainOf(seed).openers)));
}

export async function botReply(
  seedUid: string,
  history: Array<{ senderId: string; text: string }>,
  userText: string
): Promise<string> {
  const seed = findMember(seedUid) || SEED_PROFILES.find((s) => s.uid === seedUid);
  const turnIndex = history.filter((m) => m.senderId !== 'bot').length;
  const lastBot = [...history].reverse().find((m) => m.senderId === 'bot')?.text;

  if (isLowBandwidth() || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return replyFromBrain(seed, userText, turnIndex, lastBot);
  }

  try {
    const data = await fetchJsonWithTimeout<{ reply?: string }>(
      '/api/chat',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: {
            name: seed?.name || 'Member',
            age: seed?.age,
            city: seed?.location?.city,
            bio: seed?.bio,
            interests: seed?.interests,
            brain: seed?.brain,
            texting: 'instagram-dm-messy-kenyan',
          },
          history: history.slice(-12),
          message: userText,
        }),
      },
      7000
    );
    if (data?.reply && typeof data.reply === 'string') {
      return humanize(data.reply.slice(0, 400));
    }
  } catch {
    // brain path
  }

  return replyFromBrain(seed, userText, turnIndex, lastBot);
}

export async function openerFor(seedUid: string, _userName: string): Promise<string> {
  return openerFromBrain(seedUid);
}
