import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    return createClient(url, key);
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const webhookSecret = process.env.NGENIUS_WEBHOOK_SECRET;
    if (webhookSecret) {
      const authHeader = req.headers['x-ngenius-webhook-secret'] || req.headers['authorization'];
      if (!authHeader || !authHeader.includes(webhookSecret)) {
        console.warn('Unauthorized webhook attempt to /api/ngenius-webhook');
        return res.status(401).json({ message: 'Unauthorized webhook signature' });
      }
    }

    const payload = req.body || {};
    const orderRef = payload.order?.reference || payload.orderReference || payload.reference;
    const merchantOrderRef = payload.order?.merchantOrderReference || payload.merchantOrderReference;
    const bookingNumber = merchantOrderRef?.replace('TM-ORD-', '');

    if (!orderRef) {
      return res.status(200).json({ received: true, note: 'No order reference to process' });
    }

    // Authenticate and independently verify status with N-Genius
    const apiKey = process.env.NGENIUS_API_KEY || process.env.VITE_NGENIUS_API_KEY;
    const outletId = process.env.NGENIUS_OUTLET_ID || process.env.VITE_NGENIUS_OUTLET_ID || '77df254a-a9c0-4b1c-88d5-6b3f2c8e35ac';
    const ngeniusEnv = (process.env.NGENIUS_ENV || process.env.VITE_NGENIUS_ENV || 'live').toLowerCase();

    if (!apiKey || !outletId) {
      return res.status(200).json({ received: true, warning: 'Credentials missing on server' });
    }

    const apiBaseUrl = ngeniusEnv === 'sandbox'
      ? 'https://api-gateway.sandbox.ngenius-payments.com'
      : 'https://api-gateway.ngenius-payments.com';

    const tokenRes = await fetch(`${apiBaseUrl}/identity/auth/access-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.ni-identity.v1+json',
        'Accept': 'application/vnd.ni-identity.v1+json',
        'Authorization': 'Basic ' + apiKey
      }
    });

    if (!tokenRes.ok) {
      return res.status(200).json({ received: true, error: 'Could not fetch identity token' });
    }

    const { access_token } = await tokenRes.json();

    const orderRes = await fetch(`${apiBaseUrl}/transactions/outlets/${outletId}/orders/${orderRef}`, {
      headers: {
        'Authorization': 'Bearer ' + access_token,
        'Accept': 'application/vnd.ni-payment.v2+json'
      }
    });

    if (!orderRes.ok) {
      return res.status(200).json({ received: true, error: 'Order not found on N-Genius' });
    }

    const orderData = await orderRes.json();
    const paymentItem = orderData._embedded?.payment?.[0] || orderData.payment?.[0];
    const state = (paymentItem?.state || orderData.state || '').toUpperCase();

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(200).json({ received: true, state });
    }

    // Query booking
    let bookingQuery = supabase.from('bookings').select('*');
    if (bookingNumber) {
      bookingQuery = bookingQuery.eq('booking_number', bookingNumber);
    } else {
      bookingQuery = bookingQuery.eq('payment_ref', orderRef);
    }

    const { data: booking } = await bookingQuery.maybeSingle();

    if (booking) {
      if (state === 'PURCHASED' || state === 'CAPTURED' || state === 'AUTHORISED') {
        // Idempotent update
        if (booking.payment_status !== 'paid') {
          await supabase
            .from('bookings')
            .update({
              payment_status: 'paid',
              booking_status: 'confirmed',
              payment_ref: orderRef,
              updated_at: new Date().toISOString()
            })
            .eq('id', booking.id);

          // Issue tickets
          const { data: existing } = await supabase
            .from('tickets')
            .select('id')
            .eq('booking_id', booking.id);

          if (!existing || existing.length === 0) {
            const count = booking.quantity || 1;
            const tickets = Array.from({ length: count }).map((_, i) => ({
              booking_id: booking.id,
              user_id: booking.user_id,
              event_id: booking.event_id,
              ticket_number: `TKT-${booking.booking_number}-${i + 1}`,
              ticket_type: 'Standard Admission',
              status: 'active',
              price: Math.round(((booking.total_amount || 0) / count) * 100) / 100,
              created_at: new Date().toISOString()
            }));
            await supabase.from('tickets').insert(tickets);
          }
        }
      } else if (state === 'FAILED' || state === 'DECLINED') {
        await supabase
          .from('bookings')
          .update({
            payment_status: 'payment_failed',
            booking_status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', booking.id);
      }
    }

    return res.status(200).json({ received: true, state });
  } catch (err) {
    console.error('N-Genius Webhook error:', err);
    return res.status(200).json({ received: true, error: err.message });
  }
}
