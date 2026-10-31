import { fulfillConfirmedOrder } from './services/fulfillmentService.js';

// Server-side idempotency cache to prevent double-charging or duplicate creation
const idempotencyStore = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const paymentMode = (process.env.PAYMENT_MODE || 'demo').toLowerCase();
    if (paymentMode === 'ngenius') {
      return res.status(403).json({
        success: false,
        error: 'Demo payment mode is disabled. Production N-Genius gateway is active.'
      });
    }

    const { 
      eventId, 
      showtime, 
      ticketQuantity = 1, 
      ticketType,
      ticketTier,
      seats = [],
      holdReference,
      customerInfo = {}, 
      userId,
      idempotencyKey,
      promoCode
    } = req.body || {};

    if (!eventId) {
      return res.status(400).json({ success: false, error: 'Missing required eventId.' });
    }

    if (!customerInfo.email || !customerInfo.email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please provide a valid customer email.' });
    }

    // Check Idempotency: prevent double-clicks, page refreshes, and duplicate submissions
    const key = idempotencyKey || req.headers['x-idempotency-key'];
    if (key && idempotencyStore.has(key)) {
      console.log('[Idempotency] Returning cached booking for key:', key);
      return res.status(200).json(idempotencyStore.get(key));
    }

    // Call unified fulfillment service with strictly DEMO status
    const result = await fulfillConfirmedOrder({
      eventId,
      showtime,
      ticketQuantity: seats.length > 0 ? seats.length : ticketQuantity,
      ticketType: ticketTier || ticketType || 'Standard',
      ticketTier: ticketTier || ticketType || 'Standard',
      seats,
      customerInfo,
      userId,
      paymentProvider: 'demo',
      paymentMode: 'demo',
      paymentStatus: 'demo_paid', // Clearly separated from live 'paid'
      paymentRef: null, // Will generate internal DEMO-TM-XXXXXXXX
      promoCode
    });

    const responsePayload = {
      success: true,
      booking: result.booking,
      tickets: result.tickets,
      event: result.event,
      guestAccessToken: result.guestAccessToken,
      ticketAccessUrl: result.ticketAccessUrl,
      paymentMode: 'demo',
      emailSent: result.emailResult?.sent ?? false,
      emailResult: result.emailResult
    };

    if (key) {
      idempotencyStore.set(key, responsePayload);
      // Clean up after 15 minutes
      setTimeout(() => idempotencyStore.delete(key), 15 * 60 * 1000);
    }

    return res.status(200).json(responsePayload);

  } catch (err) {
    console.error('[Demo Booking Error]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error processing demo booking.' });
  }
}
