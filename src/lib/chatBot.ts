import { SEED_PROFILES, type SeedProfile } from './seedProfiles';
import { fetchJsonWithTimeout, isLowBandwidth } from './network';

const OPENERS = [
  'Okay you got my attention. What are you up to this weekend?',
  'Hey. That was smooth. I will allow it.',
  'Hi there. Coffee or chapati first date?',
  'You look like trouble in a good way. Talk to me.',
  'Finally, someone interesting. What is your name again?',
];

const FALLBACKS = [
  'Tell me more — I am listening while my tea boils.',
  'Haha okay. And then what happened?',
  'You are funny. Dangerous combo with that face.',
  'I can work with that. What does a normal Tuesday look like for you?',
  'Noted. What is the most Kenyan thing about you?',
  'If we swapped phones right now, what is the worst thing I would find?',
  'Weekend plans: honest answers only.',
  'I was going to say something cute but you go first.',
  'Voice note or type? I judge people who only type “hey”.',
  'Do you cook or are we ordering in forever?',
];

const QUESTION_TIPS = [
  'What is your go-to spot in town?',
  'Music taste — one artist, no essays.',
  'Early bird or you become human at noon?',
  'Beach day or plot day?',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function nameFrom(seed?: SeedProfile) {
  return seed?.name || 'They';
}

/** Local personality bot — works offline. */
function localReply(seed: SeedProfile | undefined, userText: string, turnIndex: number): string {
  const text = userText.toLowerCase();
  if (turnIndex === 0) return pick(OPENERS);

  if (/\b(hi|hey|hello|niaje|sasa)\b/.test(text)) {
    return 'Sasa — I mean, hey. What made you swipe right?';
  }
  if (/\b(how are you|how's it going|habari)\b/.test(text)) {
    return 'Good. Sun is out in ' + (seed?.location?.city || 'Nairobi') + ' and I am avoiding my chores. You?';
  }
  if (/\b(love|marry|beautiful|cute|hot)\b/.test(text)) {
    return 'Easy, we just met. Buy me food first.';
  }
  if (/\?(.*)?$/.test(text.trim()) && text.trim().endsWith('?')) {
    return pick(FALLBACKS) + ' ' + pick(QUESTION_TIPS);
  }
  if (/\b(food|ugali|nyama|choma|cook)\b/.test(text)) {
    return 'Now we are talking. I take my food seriously. What is your signature dish?';
  }
  if (/\b(job|work|career|boss)\b/.test(text)) {
    return 'Work talk already? Fine. I like people who have something going on. What keeps you busy?';
  }
  if (/\b(weekend|saturday|sunday)\b/.test(text)) {
    return 'Weekend energy. I am either at a quiet bar or asleep by 9. Join which?';
  }

  if (Math.random() < 0.35) return pick(QUESTION_TIPS);
  return pick(FALLBACKS);
}

/**
 * Prefer Gemini when the API is configured and the link can carry it.
 * Falls back to the local bot on low bandwidth, timeout, or missing key.
 */
export async function botReply(seedUid: string, history: Array<{ senderId: string; text: string }>, userText: string): Promise<string> {
  const seed = SEED_PROFILES.find((s) => s.uid === seedUid);
  const turnIndex = history.filter((m) => m.senderId !== 'bot').length;

  if (isLowBandwidth() || !navigator.onLine) {
    return localReply(seed, userText, turnIndex);
  }

  try {
    const data = await fetchJsonWithTimeout<{ reply?: string; demo?: boolean }>(
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
          },
          history: history.slice(-12),
          message: userText,
        }),
      },
      6000
    );
    if (data?.reply && typeof data.reply === 'string') return data.reply.slice(0, 500);
  } catch {
    // network or server without Gemini
  }

  return localReply(seed, userText, turnIndex);
}

export async function openerFor(seedUid: string, userName: string): Promise<string> {
  const seed = SEED_PROFILES.find((s) => s.uid === seedUid);
  return `${nameFrom(seed)} here. ${pick([
    `You matched with me, ${userName} — say something better than “hey”.`,
    'We matched. I am judging your first message already.',
    'Hey. I am real enough for a chat. What are we doing tonight — just talking or plans?',
  ])}`;
}
