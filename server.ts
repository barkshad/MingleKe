import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import axios from "axios";
const pendingPayments = new Map<string, any>();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Route: M-Pesa STK Push
  app.post("/api/mpesa/stkpush", async (req, res) => {
    const { phoneNumber, amount } = req.body;

    // Track payment
    const formattedPhone = '+' + phoneNumber.replace('+', '').replace(/^0/, '254');
    pendingPayments.set(formattedPhone, { status: 'pending', timestamp: Date.now() });

    try {
      const lipanaApiKey = process.env.LIPANA_API_KEY;
      
      if (!lipanaApiKey) {
        console.warn("LIPANA_API_KEY not found, simulating success.");
        return res.json({
          MerchantRequestID: "12345-67890",
          CheckoutRequestID: "ws_CO_123456789",
          ResponseCode: "0",
          ResponseDescription: "Success. Request accepted for processing",
          CustomerMessage: "Success. Request accepted for processing"
        });
      }

      // Lipana.dev STK Push via Payment Links
      let slug = process.env.LIPANA_PAYMENT_LINK_SLUG || 'mingleke';
      // If the slug is provided as a full URL, extract just the slug
      if (slug.includes('/')) {
        slug = slug.split('/').pop() || 'mingleke';
      }
      
      const response = await axios.post(`https://api.lipana.dev/api/payment-links/public/${slug}/pay`, {
        phone: formattedPhone,
        amount: amount
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': lipanaApiKey
        }
      });

      console.log("Lipana Response:", response.data);
      res.json(response.data);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || "Unknown error";
      const errorDetails = typeof error.response?.data === 'string' && error.response.data.includes('<html') 
        ? "Received HTML error page from payment gateway (invalid endpoint or configuration)."
        : (error.response?.data || error.message);
        
      console.error("Lipana error details:", errorDetails);
      res.status(500).json({ 
        error: errorMsg, 
        details: errorDetails 
      });
    }
  });

  // Check Payment Status (Polling endpoint)
  app.get("/api/mpesa/status", (req, res) => {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: 'Phone query parameter is required' });
    
    // Check with the same phone format
    const formattedPhone = '+' + String(phone).replace('+', '').replace(/^0/, '254');
    const payment = pendingPayments.get(formattedPhone);
    
    res.json({ 
      status: payment?.status || 'not_found',
      data: payment 
    });
  });

  // M-Pesa Callback Webhook
  app.post("/api/mpesa/callback", (req, res) => {
    console.log("M-Pesa Callback received:", JSON.stringify(req.body, null, 2));
    
    try {
      // Intentionally lenient to catch various Lipana and Safaricom formats
      const bodyStr = JSON.stringify(req.body);
      
      // Iterate through pending payments and see if the webhook belongs to one of them
      for (const [phone, payment] of pendingPayments.entries()) {
        const cleanPhone = phone.replace('+', ''); // Without the plus
        
        // If the phone number is found anywhere in the payload string, we mark it success
        // This is a naive but robust way to handle unknown payload shapes!
        if (bodyStr.includes(cleanPhone)) {
           console.log(`Matched callback to pending payment for ${phone}`);
           
           // Make sure it's a successful transaction (usually contains "Success", "Completed", or ResultCode: 0)
           if (bodyStr.toLowerCase().includes('success') || bodyStr.includes('"ResultCode":0') || bodyStr.includes('"ResultCode": 0')) {
             pendingPayments.set(phone, { status: 'success', data: req.body, timestamp: Date.now() });
           } else {
             pendingPayments.set(phone, { status: 'failed', data: req.body, timestamp: Date.now() });
           }
           break;
        }
      }
    } catch (e) {
      console.error("Error processing callback", e);
    }

    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
