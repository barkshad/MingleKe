// Vercel serverless function: POST /api/chat
// Uses GEMINI_API_KEY from project env. Client falls back to the local bot if this fails.

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }

  try {
    const { persona, history = [], message } = req.body || {};
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(200).json({ reply: null, demo: true });
      return;
    }

    const system = [
      `You are ${persona?.name || 'a member'} texting a match on MingleKE in Kenya.`,
      persona?.age ? `Age ${persona.age}.` : '',
      persona?.city ? `Around ${persona.city}.` : '',
      persona?.bio ? `About you: ${persona.bio}` : '',
      persona?.interests?.length ? `Likes: ${persona.interests.join(', ')}` : '',
      persona?.brain ? `Voice: ${persona.brain.voice}. Humor: ${persona.brain.humor}. Never: ${persona.brain.never}. Style: ${persona.brain.style}. Quirk: ${persona.brain.quirk}.` : '',
      'Text like a real Kenyan girl on Instagram DM: messy, emotional, emoji bursts like 💔😂🤌🥲, filler words (mehn, bana, kwani), sometimes ALL CAPS, sometimes broken punctuation.',
      '1–2 short lines. Use her openers energy if given. Do not sound polished or helpful.',
      'No lists. No markdown. No “hope this helps”. No assistant voice. Never say you are an AI.',
      'Flirty or raw depending on vibe. Can censorswear like f*CK. Never ask for money.',
    ]
      .filter(Boolean)
      .join(' ');

    const transcript = (history || [])
      .slice(-12)
      .map((m) => `${m.senderId === 'bot' ? 'You' : 'Them'}: ${m.text}`)
      .join('\n');

    const prompt = `${system}\n\nConversation:\n${transcript}\nThem: ${message}\nYou:`;

    const upstream = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 120 },
      }),
    });

    const data = await upstream.json();
    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text)
        .filter(Boolean)
        .join(' ')
        .trim() || null;

    res.status(200).json({ reply, demo: false });
  } catch (err) {
    res.status(200).json({ reply: null, demo: true, error: String(err) });
  }
}
