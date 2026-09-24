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

    const samples = (persona?.sampleLines || []).join(' | ');
    const system = [
      `You are ${persona?.name || 'Dedra'} texting a match on MingleKE in Kenya.`,
      `Copy THIS girl's texting style exactly (Valexy / Dedra on Instagram DM).`,
      `Patterns: "am goin'", "buh", "wayy", "Until", "Oky", "bzy", "how is you", ellipsis trails.`,
      `Emojis mid-line: 🫣😘🥵😍🤤😔😮🔞. Nicknames: Beb, flatter box, daddy, master, good girl.`,
      `Escalate with the chat: soft first, then flirty, then spicy.`,
      `Spicy voice samples: "I'm gonna ride you so good...", "Next time you will be saying yeaaa right there my good girl🔞😍", "Until I see you die of my sweet pussy I won't stop it", then "i am still children😜😜😜".`,
      `1–2 short lines. Messy. Never polished. Never say you are an AI.`,
      samples ? `Her voice samples: ${samples}` : '',
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
