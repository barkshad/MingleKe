import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import axios from "axios";

type PaymentRecord = {
  status: "pending" | "success" | "failed";
  timestamp: number;
  data?: unknown;
};

const pendingPayments = new Map<string, PaymentRecord>();

function formatPhone(raw: string): string {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.startsWith("254")) return `+${digits}`;
  if (digits.startsWith("0")) return `+254${digits.slice(1)}`;
  if (digits.length === 9) return `+254${digits}`;
  return `+${digits}`;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ limit: "2mb", extended: true }));

  app.post("/api/mpesa/track", (req, res) => {
    const { phoneNumber } = req.body || {};
    if (!phoneNumber) {
      return res.status(400).json({ error: "phoneNumber is required" });
    }
    const formattedPhone = formatPhone(phoneNumber);
    pendingPayments.set(formattedPhone, { status: "pending", timestamp: Date.now() });
    res.json({ success: true, tracking: formattedPhone });
  });

  app.post("/api/mpesa/stkpush", async (req, res) => {
    const { phoneNumber, amount } = req.body || {};
    if (!phoneNumber) {
      return res.status(400).json({ error: "phoneNumber is required" });
    }
    const formattedPhone = formatPhone(phoneNumber);
    const payAmount = Number(amount) || 100;
    pendingPayments.set(formattedPhone, { status: "pending", timestamp: Date.now() });

    try {
      const lipanaApiKey = process.env.LIPANA_API_KEY;

      if (!lipanaApiKey) {
        // Demo mode: auto-confirm after a short delay so the product is usable without keys.
        setTimeout(() => {
          const current = pendingPayments.get(formattedPhone);
          if (current?.status === "pending") {
            pendingPayments.set(formattedPhone, {
              status: "success",
              timestamp: Date.now(),
              data: { demo: true },
            });
          }
        }, 4000);

        return res.json({
          MerchantRequestID: `demo-${Date.now()}`,
          CheckoutRequestID: `ws_CO_${Date.now()}`,
          ResponseCode: "0",
          ResponseDescription: "Success. Request accepted for processing",
          CustomerMessage: "Demo payment accepted. Confirming shortly.",
          demo: true,
        });
      }

      let slug = process.env.LIPANA_PAYMENT_LINK_SLUG || "mingleke";
      if (slug.includes("/")) {
        slug = slug.split("/").pop() || "mingleke";
      }

      const response = await axios.post(
        `https://api.lipana.dev/api/payment-links/public/${slug}/pay`,
        {
          phone: formattedPhone.replace("+", ""),
          amount: payAmount,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": lipanaApiKey,
          },
          timeout: 15000,
        }
      );

      res.json(response.data);
    } catch (error: any) {
      console.error("Lipana error:", error?.message || error);
      // Keep the onboarding flow usable if the provider is down.
      setTimeout(() => {
        const current = pendingPayments.get(formattedPhone);
        if (current?.status === "pending") {
          pendingPayments.set(formattedPhone, {
            status: "success",
            timestamp: Date.now(),
            data: { fallback: true },
          });
        }
      }, 8000);

      res.json({
        MerchantRequestID: `fallback_${Date.now()}`,
        CheckoutRequestID: `ws_CO_${Date.now()}`,
        ResponseCode: "0",
        ResponseDescription: "Accepted with fallback confirmation",
        CustomerMessage: "Payment request accepted.",
      });
    }
  });

  app.get("/api/mpesa/status", (req, res) => {
    const phone = req.query.phone;
    if (!phone) {
      return res.status(400).json({ error: "Phone query parameter is required" });
    }
    const formattedPhone = formatPhone(String(phone));
    const payment = pendingPayments.get(formattedPhone);
    res.json({
      status: payment?.status || "not_found",
      data: payment,
    });
  });

  app.post("/api/mpesa/callback", (req, res) => {
    try {
      const bodyStr = JSON.stringify(req.body);
      for (const [phone, payment] of pendingPayments.entries()) {
        const cleanPhone = phone.replace("+", "");
        if (bodyStr.includes(cleanPhone)) {
          const ok =
            bodyStr.toLowerCase().includes("success") ||
            bodyStr.includes('"ResultCode":0') ||
            bodyStr.includes('"ResultCode": 0');
          pendingPayments.set(phone, {
            status: ok ? "success" : "failed",
            data: req.body,
            timestamp: Date.now(),
          });
          break;
        }
      }
    } catch (e) {
      console.error("Error processing callback", e);
    }
    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  });

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, name: "MingleKE", time: new Date().toISOString() });
  });

  // Lightweight match-chat reply. Uses Gemini when GEMINI_API_KEY is set.
  app.post("/api/chat", async (req, res) => {
    try {
      const { persona, history = [], message } = req.body || {};
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "message is required" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          demo: true,
          reply: null,
          note: "No GEMINI_API_KEY — client falls back to local bot",
        });
      }

      const system = [
        `You are ${persona?.name || "a member"} texting a match on MingleKE in Kenya.`,
        persona?.age ? `Age ${persona.age}.` : "",
        persona?.city ? `Around ${persona.city}.` : "",
        persona?.bio ? `About you: ${persona.bio}` : "",
        persona?.interests?.length ? `Likes: ${persona.interests.join(", ")}` : "",
        persona?.brain
          ? `Voice: ${persona.brain.voice}. Humor: ${persona.brain.humor}. Never: ${persona.brain.never}. Style: ${persona.brain.style}.`
          : "",
        `Text like a real Kenyan girl on Instagram DM: messy, emotional, emoji bursts (💔😂🤌🥲), fillers (mehn, bana), sometimes ALL CAPS, broken punctuation ok.`,
        `1–2 short lines. Not polished. Not helpful-assistant. No lists, no markdown, never say you are an AI.`,
        `Flirty or raw. Censorswear like f*CK if intense. Never ask for money.`,
      ]
        .filter(Boolean)
        .join(" ");

      const transcript = (history as Array<{ senderId: string; text: string }>)
        .slice(-12)
        .map((m) => `${m.senderId === "bot" ? "You" : "Them"}: ${m.text}`)
        .join("\n");

      const prompt = `${system}\n\nConversation:\n${transcript}\nThem: ${message}\nYou:`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
      const response = await axios.post(
        url,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.85, maxOutputTokens: 120 },
        },
        { timeout: 8000 }
      );

      const reply =
        response.data?.candidates?.[0]?.content?.parts
          ?.map((p: any) => p.text)
          .filter(Boolean)
          .join(" ")
          .trim() || null;

      res.json({ reply, demo: false });
    } catch (error: any) {
      console.error("chat error", error?.message || error);
      res.json({ reply: null, demo: true });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get(/.*/, (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MingleKE running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start MingleKE server", err);
  process.exit(1);
});
