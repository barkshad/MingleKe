import { SEED_PROFILES, findMember, type MemberBrain, type SeedProfile } from './seedProfiles';
import { fetchJsonWithTimeout, isLowBandwidth } from './network';
import { VALEXY, VALEXY_STYLE } from './valexy';

function pick<T>(arr: T[], last?: T): T {
  if (!arr?.length) return '' as T;
  const pool = last ? arr.filter((x) => x !== last) : arr;
  const list = pool.length ? pool : arr;
  return list[Math.floor(Math.random() * list.length)];
}

/** Apply Valexy’s real typo words without making every line identical. */
function valexyTypos(line: string): string {
  let out = line;
  for (const [from, to] of VALEXY.typos) {
    if (Math.random() < 0.45) {
      out = out.replace(new RegExp(`\\b${from}\\b`, 'i'), to);
    }
  }
  return out;
}

function humanize(line: string): string {
  let out = valexyTypos(line.trim());
  const r = Math.random();

  // trailing dots like "girl.." / "just for now..."
  if (r < 0.3 && !/\.{2,}$/.test(out) && !out.endsWith('..')) {
    if (out.length > 30) out = `${out}...`;
    else out = `${out}..`;
  }
  // occasional mid-thought ellipsis already in corpus; add a soft trail
  if (r > 0.8 && out.length > 20 && !out.includes('...')) {
    const cut = out.lastIndexOf(' ');
    if (cut > 12) out = `${out.slice(0, cut)}...`;
  }
  if (r > 0.92) out = out.toUpperCase();
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

/**
 * Combine her private brain banks with the shared Valexy corpus.
 * Soft vs spicy tracks how deep the chat already is.
 */
export function replyFromBrain(
  seed: SeedProfile | undefined,
  userText: string,
  turnIndex: number,
  lastLine?: string
): string {
  const b = brainOf(seed);
  const text = userText.toLowerCase();
  const deep = turnIndex >= 4 || /nasty|daddy|ride|moan|wild|location|kiss|touch/.test(text);

  if (turnIndex === 0) return humanize(pick([...VALEXY.openers, ...b.openers], lastLine));

  if (/\b(sad|scared|alone|cry|thunder|lightning|ex|tired|stress|rough)\b/.test(text)) {
    return humanize(
      pick(
        [
          'ooh sorry about that 😔',
          'i am here for you',
          'Beb...come here 🫣',
          'you sleep alone? 🥺 I get that',
          pick(VALEXY.soft),
        ],
        lastLine
      )
    );
  }

  if (/\b(voice|song|sing|music|note|sounds)\b/.test(text)) {
    return humanize(
      pick(
        [
          'the voice 🥵🥵🥵...what did you take for lunch girl..??',
          'marize🤤🎼',
          "That's my favourite song tot for life",
          'send that again...I need it 🫣',
        ],
        lastLine
      )
    );
  }

  if (/\b(love|cute|beautiful|hot|pretty|blush|miss)\b/.test(text)) {
    return humanize(
      pick(
        [
          'Really 😊 you are making me blush',
          "mmhnh🤫 flatter box 😂",
          'wayy too sweet...stop it 🫣',
          "you've completed my day girl..",
        ],
        lastLine
      )
    );
  }

  if (/\b(nasty|daddy|master|good girl|wild|ride|moan|location|sexy|hot)\b/.test(text) || deep && Math.random() < 0.35) {
    return humanize(
      pick(
        [
          'yah🫣...but you are wayy too nastier😘',
          'I mean for your age😏',
          'Oky my apologies daddy or should I say master',
          "Next time you will be saying yeaaa right there my good girl🔞😍",
          "You're tempting me to push you past your limits, but I'll keep it just for now...",
          'cant wait',
          'Same here I’m going so wild right now',
          'location 🤭',
        ],
        lastLine
      )
    );
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

  if (Math.random() < 0.28) {
    return humanize(pick([...VALEXY.questions, ...b.questions], lastLine));
  }

  // default: her soft / reaction banks mixed with this person’s brain
  return humanize(
    pick(
      [...VALEXY.reactions, ...VALEXY.soft, ...b.replies],
      lastLine
    )
  );
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
              ...VALEXY.openers.slice(0, 3),
              ...VALEXY.soft.slice(0, 3),
              ...VALEXY.flirty.slice(0, 2),
              ...VALEXY.reactions.slice(0, 2),
            ],
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
    // local Valexy corpus
  }

  return replyFromBrain(seed, userText, turnIndex, lastBot);
}

export async function openerFor(seedUid: string, _userName: string): Promise<string> {
  return openerFromBrain(seedUid);
}
