import axios from 'axios';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { phoneNumber, amount } = req.body;

  try {
    const lipanaApiKey = process.env.LIPANA_API_KEY;
    
    if (!lipanaApiKey) {
      console.warn("LIPANA_API_KEY not found, simulating success.");
      return res.status(200).json({
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
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error("Lipana error details:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Payment request failed", 
      details: error.response?.data || error.message 
    });
  }
}
