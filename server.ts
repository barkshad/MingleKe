import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Cloudinary config
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  // API Route: Upload Image to Cloudinary
  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.warn("Cloudinary env vars missing. using fallback image url.");
        const seed = Math.random().toString(36).substring(7);
        return res.json({ url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}` });
      }

      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
      
      const uploadResponse = await cloudinary.uploader.upload(dataURI, {
        folder: 'mingleke',
      });
      console.log('Cloudinary upload success');
      res.json({ url: uploadResponse.secure_url });
    } catch (error: any) {
      console.error("Cloudinary upload failed:", error);
      res.status(500).json({ error: error.message || "Upload failed" });
    }
  });

  // API Route: M-Pesa STK Push
  app.post("/api/mpesa/stkpush", async (req, res) => {
    const { phoneNumber, amount } = req.body;

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
      // Format phone as +254...
      const formattedPhone = '+' + phoneNumber.replace('+', '').replace(/^0/, '254');
      const slug = process.env.LIPANA_PAYMENT_LINK_SLUG || 'mingleke';
      
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
      console.error("Lipana error details:", error.response?.data || error.message);
      res.status(500).json({ 
        error: "Payment request failed", 
        details: error.response?.data || error.message 
      });
    }
  });

  // M-Pesa Callback (Placeholder)
  app.post("/api/mpesa/callback", (req, res) => {
    console.log("M-Pesa Callback received:", req.body);
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
