import { createClient } from '@supabase/supabase-js';
import { fulfillConfirmedOrder } from '../server/services/fulfillmentService.js';

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
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { bookingNumber, orderRef } = req.body || {};

    if (!bookingNumber && !orderRef) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing bookingNumber or orderRef for verification' 
      });
    }

    const apiKey = process.env.NGENIUS_API_KEY || process.env.VITE_NGENIUS_API_KEY;
    const outletId = process.env.NGENIUS_OUTLET_ID || process.env.VITE_NGENIUS_OUTLET_ID || '77df254a-a9c0-4b1c-88d5-6b3f2c8e35ac';
    const ngeniusEnv = (process.env.NGENIUS_ENV || process.env.VITE_NGENIUS_ENV || 'live').toLowerCase();

    if (!apiKey || !outletId) {
      return res.status(500).json({ 
        success: false, 
        error: 'Gateway credentials missing on verification server' 
      });
    }

    const apiBaseUrl = ngeniusEnv === 'sandbox'
      ? 'https://api-gateway.sandbox.ngenius-payments.com'
      : 'https://api-gateway.ngenius-payments.com';

    // 1. Authenticate with N-Genius Identity API
    const tokenRes = await fetch(`${apiBaseUrl}/identity/auth/access-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.ni-identity.v1+json',
        'Accept': 'application/vnd.ni-identity.v1+json',
        'Authorization': 'Basic ' + apiKey
      }
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      return res.status(502).json({ 
        success: false, 
        error: 'Failed to authenticate with N-Genius Identity: ' + errText 
      });
    }

    const { access_token } = await tokenRes.json();

    // 2. Fetch Order Details from N-Genius Transactions API
    const queryRef = orderRef || bookingNumber;
    const orderRes = await fetch(`${apiBaseUrl}/transactions/outlets/${outletId}/orders/${queryRef}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + access_token,
        'Accept': 'application/vnd.ni-payment.v2+json'
      }
    });

    if (!orderRes.ok) {
      const errData = await orderRes.json().catch(() => ({}));
      return res.status(404).json({
        success: false,
        verified: false,
        status: 'unverified',
        error: errData.message || 'Transaction reference not found on N-Genius gateway'
      });
    }

    const orderData = await orderRes.json();

    // 3. Inspect Payment State
    const paymentItem = orderData._embedded?.payment?.[0] || orderData.payment?.[0];
    const paymentState = (paymentItem?.state || orderData.state || '').toUpperCase();

    const isPaid = paymentState === 'PURCHASED' || paymentState === 'CAPTURED' || paymentState === 'AUTHORISED';
    const isFailed = paymentState === 'FAILED' || paymentState === 'DECLINED';
    const isProcessing = paymentState === 'AWAIT_3DS' || paymentState === 'STARTED';

    const supabase = getSupabaseClient();
    let currentBooking = null;

    if (supabase && bookingNumber) {
      const { data: bData } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_number', bookingNumber)
        .single();
      currentBooking = bData;
    }

    // 4. Update Database only based on verified gateway state
    if (isPaid) {
      let fulfilledData = null;
      if (currentBooking) {
        // Authoritative convergence: post-payment booking service
        fulfilledData = await fulfillConfirmedOrder({
          eventId: currentBooking.event_id,
          showtime: currentBooking.showtime,
          ticketQuantity: currentBooking.quantity || 1,
          ticketType: currentBooking.ticket_type || 'Standard Admission',
          customerInfo: {
            name: currentBooking.customer_name,
            email: currentBooking.customer_email,
            phone: currentBooking.customer_phone
          },
          userId: currentBooking.user_id,
          paymentProvider: 'ngenius',
          paymentMode: 'ngenius',
          paymentStatus: 'paid',
          paymentRef: orderData.reference || queryRef
        });
      } else if (supabase && bookingNumber) {
        await supabase
          .from('bookings')
          .update({
            booking_status: 'confirmed',
            payment_status: 'paid',
            payment_provider: 'ngenius',
            payment_mode: 'ngenius',
            payment_ref: orderData.reference || queryRef,
            updated_at: new Date().toISOString()
          })
          .eq('booking_number', bookingNumber);
      }

      return res.status(200).json({
        success: true,
        verified: true,
        status: 'paid',
        paymentState,
        booking: fulfilledData?.booking || {
          ...(currentBooking || {}),
          booking_number: bookingNumber || orderData.merchantOrderReference,
          payment_status: 'paid',
          payment_provider: 'ngenius',
          payment_mode: 'ngenius',
          booking_status: 'confirmed',
          payment_ref: orderData.reference || queryRef,
          total_amount: (orderData.amount?.value ? orderData.amount.value / 100 : currentBooking?.total_amount),
          currency: orderData.amount?.currencyCode || 'AED'
        },
        tickets: fulfilledData?.tickets || []
      });
    }

    if (isFailed) {
      if (supabase && bookingNumber) {
        await supabase
          .from('bookings')
          .update({
            booking_status: 'cancelled',
            payment_status: 'payment_failed',
            updated_at: new Date().toISOString()
          })
          .eq('booking_number', bookingNumber);
      }

      return res.status(200).json({
        success: false,
        verified: true,
        status: 'payment_failed',
        paymentState,
        error: 'Payment declined or aborted by cardholder.'
      });
    }

    if (isProcessing) {
      return res.status(200).json({
        success: false,
        verified: false,
        status: 'payment_processing',
        paymentState,
        message: 'Transaction is currently awaiting 3D-Secure authentication.'
      });
    }

    return res.status(200).json({
      success: false,
      verified: false,
      status: 'unverified',
      paymentState,
      error: `Unsettled payment state from N-Genius: ${paymentState}`
    });

  } catch (e) {
    console.error('N-Genius Payment Verification Exception:', e);
    return res.status(500).json({ success: false, error: e.message });
  }
}
