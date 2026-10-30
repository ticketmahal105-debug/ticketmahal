export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const paymentMode = (process.env.PAYMENT_MODE || 'demo').toLowerCase();

  return res.status(200).json({
    success: true,
    paymentMode, // 'demo' | 'ngenius'
    gatewayProvider: paymentMode === 'ngenius' ? 'Network International N-Genius' : 'Ticket Mahal Demo'
  });
}
