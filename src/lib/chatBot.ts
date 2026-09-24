import { SEED_PROFILES, findMember, type MemberBrain, type SeedProfile } from './seedProfiles';
import { fetchJsonWithTimeout, isLowBandwidth } from './network';
import { VALEXY, VALEXY_STYLE } from './valexy';

function pick<T>(arr: T[], last?: T): T {
  if (!arr?.length) return '' as T;
  const pool = last ? arr.filter((x) => x !== last) : arr;
  const list = pool.length ? pool : arr;
  return list[Math.floor(Math.random() * list.length)];
}

function valexyTypos(line: string): string {
  let out = line;
  for (const [from, to] of VALEXY.typos) {
    if (Math.random() < 0.4) out = out.replace(new RegExp(`\\b${from}\\b`, 'i'), to);
  }
  return out;
}

function humanize(line: string): string {
  let out = valexyTypos(line.trim());
  const r = Math.random();
  if (r < 0.28 && !/\.{2,}$/.test(out)) {
    out = out.length > 30 ? `${out}...` : `${out}..`;
  }
  if (r > 0.93) out = out.toUpperCase();
  return out;
}

function brainOf(seed?: SeedProfile): MemberBrain {
  return (
    seed?.brain || {
      ...VALEXY_STYLE,
      openers: VALEXY.openers,
      replies: VALEXY.soft,
      questions: VALEXY.questions,
      topics: ['music', 'voice notes', 'food', 'night'],
    }
  );
}

function heatLevel(turnIndex: number, text: string): number {
  const hot =
    /\b(nasty|daddy|master|good girl|wild|ride|moan|location|sexy|hot|pussy|limit|dare|nsfw)\b/i.test(
      text
    );
  if (hot || turnIndex >= 8) return 4;
  if (turnIndex >= 5) return 3;
  if (turnIndex >= 2) return 2;
  return 1;
}

export function replyFromBrain(
  seed: SeedProfile | undefined,
  userText: string,
  turnIndex: number,
  lastLine?: string
): string {
  const b = brainOf(seed);
  const text = userText.toLowerCase();
  const heat = heatLevel(turnIndex, text);

  if (turnIndex === 0) return humanize(pick([...VALEXY.openers, ...b.openers], lastLine));

  if (/\b(sad|scared|alone|cry|thunder|lightning|ex|tired|stress|rough)\b/.test(text)) {
    return humanize(
      pick(['ooh sorry about that 😔', 'i am here for you', 'Beb...come here 🫣', 'you sleep alone? 🥺 I get that', pick(VALEXY.soft)], lastLine)
    );
  }

  if (/\b(voice|song|sing|music|note|sounds)\b/.test(text)) {
    return humanize(
      pick(['the voice 🥵🥵🥵...what did you take for lunch girl..??', 'marize🤤🎼', "That's my favourite song tot for life", 'send that again...I need it 🫣'], lastLine)
    );
  }

  if (/\b(love|cute|beautiful|hot|pretty|blush|miss)\b/.test(text) && heat < 3) {
    return humanize(
      pick(['Really 😊 you are making me blush', 'mmhnh🤫 flatter box 😂', 'wayy too sweet...stop it 🫣', "you've completed my day girl.."], lastLine)
    );
  }

  if (heat >= 3) {
    return humanize(pick([...VALEXY.flirty, ...VALEXY.spicy], lastLine));
  }

  if (/\b(hi|hey|sasa|niaje|hello)\b/.test(text) && text.length < 24) {
    return humanize(pick([...VALEXY.openers, 'hey 🫣 how is you', 'Sasa 👀'], lastLine));
  }

  if (text.endsWith('?') || /\b(what|why|how|where|when)\b/.test(text)) {
    return humanize(pick([...VALEXY.questions, ...b.questions], lastLine));
  }

  if (text.trim().length < 10) {
    return humanize(pick([...VALEXY.short, 'go on...', 'and??', 'yah🫣'], lastLine));
  }

  if (Math.random() < 0.25) return humanize(pick([...VALEXY.questions, ...b.questions], lastLine));

  const bank =
    heat >= 4
      ? [...VALEXY.spicy, ...VALEXY.flirty, ...b.replies]
      : heat >= 3
        ? [...VALEXY.flirty, ...VALEXY.reactions, ...b.replies]
        : [...VALEXY.reactions, ...VALEXY.soft, ...b.replies];

  return humanize(pick(bank, lastLine));
}

export function openerFromBrain(seedUid: string): string {
  const seed = findMember(seedUid) || SEED_PROFILES.find((s) => s.uid === seedUid);
  return humanize(pick([...VALEXY.openers, ...brainOf(seed).openers]));
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
            name: seed?.name || 'Dedra',
            age: seed?.age,
            city: seed?.location?.city,
            bio: seed?.bio,
            interests: seed?.interests,
            brain: { ...VALEXY_STYLE, ...(seed?.brain || {}) },
            sampleLines: [
              ...VALEXY.openers.slice(0, 2),
              ...VALEXY.soft.slice(0, 2),
              ...VALEXY.flirty.slice(0, 2),
              ...VALEXY.spicy.slice(0, 3),
            ],
          },
          history: history.slice(-12),
          message: userText,
        }),
      },
      7000
    );
    if (data?.reply && typeof data.reply === 'string') return humanize(data.reply.slice(0, 500));
  } catch {
    /* local corpus */
  }

  return replyFromBrain(seed, userText, turnIndex, lastBot);
}

export async function openerFor(seedUid: string, _userName: string): Promise<string> {
  return openerFromBrain(seedUid);
}
