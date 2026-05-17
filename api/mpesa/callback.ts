export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log("M-Pesa Callback received:", req.body);
  res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
}
