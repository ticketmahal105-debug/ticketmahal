import { createClient } from '@supabase/supabase-js';
import { dummyMovies } from '../src/data/dummyMovies.js';

// Helper to initialize Supabase client safely server-side
function getSupabaseClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    return createClient(url, key);
  } catch (e) {
    console.warn('Supabase init warning in create-ngenius-order:', e.message);
    return null;
  }
}

// Recalculate / validate event price server-side
async function getValidatedEventPrice(eventId, supabase) {
  // 1. Check local catalog
  const movie = dummyMovies.find(m => m.id === eventId || m.slug === eventId);
  if (movie && typeof movie.startingPrice === 'number' && movie.startingPrice > 0) {
    return {
      price: movie.startingPrice,
      currency: movie.currency || 'AED',
      title: movie.title
    };
  }

  // 2. Query Supabase events table if available
  if (supabase) {
    try {
      const { data } = await supabase
        .from('events')
        .select('id, starting_price, ticket_price, event_name, currency')
        .or(`id.eq.${eventId},slug.eq.${eventId}`)
        .single();
      if (data) {
        const price = Number(data.starting_price || data.ticket_price || 0);
        if (price > 0) {
          return {
            price,
            currency: data.currency || 'AED',
            title: data.event_name || 'Event Ticket'
          };
        }
      }
    } catch (e) {
      console.warn('Supabase event fetch error:', e.message);
    }
  }

  // Fallback standard price if event catalog match fails
  return { price: 120, currency: 'AED', title: 'Ticket Mahal Admission' };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { eventId, showtime, ticketQuantity = 1, customerInfo = {}, redirectUrl, userId } = req.body || {};

    const apiKey = process.env.NGENIUS_API_KEY || process.env.VITE_NGENIUS_API_KEY;
    const outletId = process.env.NGENIUS_OUTLET_ID || process.env.VITE_NGENIUS_OUTLET_ID || '77df254a-a9c0-4b1c-88d5-6b3f2c8e35ac';
    const ngeniusEnv = (process.env.NGENIUS_ENV || process.env.VITE_NGENIUS_ENV || 'live').toLowerCase();

    if (!apiKey || !outletId) {
      return res.status(500).json({ 
        success: false, 
        error: 'N-Genius credentials not configured. Please set NGENIUS_API_KEY and NGENIUS_OUTLET_ID in server environment.' 
      });
    }

    const qty = Math.max(1, parseInt(ticketQuantity, 10) || 1);
    const supabase = getSupabaseClient();
    const eventInfo = await getValidatedEventPrice(eventId, supabase);

    // Calculate validated total amount (Price * Quantity + 5% UAE VAT)
    const subtotal = eventInfo.price * qty;
    const vat = Math.round(subtotal * 0.05 * 100) / 100;
    const totalAmount = Math.round((subtotal + vat) * 100) / 100;
    const amountInFils = Math.round(totalAmount * 100);
    const currency = 'AED';

    // Generate unique booking number and merchant order reference
    const bookingNumber = 'TM-' + Math.floor(100000 + Math.random() * 900000);
    const orderRef = `TM-ORD-${bookingNumber}`;

    // 1. Create a PENDING booking record in Supabase
    const bookingPayload = {
      booking_number: bookingNumber,
      user_id: userId || null,
      event_id: eventId || null,
      showtime: showtime || 'Standard Entry',
      quantity: qty,
      total_price: totalAmount,
      total_amount: totalAmount,
      currency: currency,
      booking_status: 'pending',
      payment_status: 'pending',
      payment_method: 'N-Genius Payment Gateway (Network International)',
      payment_ref: orderRef,
      customer_email: customerInfo.email || null,
      customer_name: customerInfo.name || null,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      try {
        await supabase.from('bookings').insert([bookingPayload]);
      } catch (dbErr) {
        console.warn('Could not insert pending booking in DB:', dbErr.message);
      }
    }

    // 2. Request Access Token from N-Genius Identity API
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
      const errText = await tokenRes.text();
      // Update pending booking to failed
      if (supabase) {
        try {
          await supabase.from('bookings')
            .update({ booking_status: 'cancelled', payment_status: 'payment_failed' })
            .eq('booking_number', bookingNumber);
        } catch (_) {}
      }
      return res.status(502).json({ 
        success: false, 
        error: 'N-Genius Identity Auth Error: ' + errText 
      });
    }

    const { access_token } = await tokenRes.json();

    // 3. Build Redirect & Cancel Callbacks
    // Network International strictly rejects http://, localhost, or 127.0.0.1
    let returnUrl = process.env.NGENIUS_REDIRECT_URL || 'https://ticketmahal.ae/payment/callback';
    if (redirectUrl && redirectUrl.startsWith('https://') && !redirectUrl.includes('localhost') && !redirectUrl.includes('127.0.0.1')) {
      returnUrl = redirectUrl;
    }
    const separator = returnUrl.includes('?') ? '&' : '?';
    const callbackWithParams = `${returnUrl}${separator}booking=${bookingNumber}&ref=${orderRef}`;
    const cancelWithParams = `${returnUrl}${separator}booking=${bookingNumber}&cancelled=true`;

    // 4. Create Order on N-Genius Transactions API
    const firstName = customerInfo.name?.split(' ')[0] || 'Customer';
    const lastName = customerInfo.name?.split(' ').slice(1).join(' ') || 'Guest';

    const orderPayload = {
      action: 'PURCHASE',
      amount: {
        currencyCode: currency,
        value: amountInFils
      },
      language: 'en',
      merchantOrderReference: orderRef,
      emailAddress: customerInfo.email || 'customer@ticketmahal.ae',
      billingAddress: {
        firstName,
        lastName,
        address1: 'Dubai',
        city: 'Dubai',
        countryCode: 'AE'
      },
      merchantAttributes: {
        redirectUrl: callbackWithParams,
        cancelUrl: cancelWithParams
      }
    };

    // Safe server-side request diagnostic logging (no secrets or sensitive data)
    console.log('[N-Genius Diagnostic - Request]', {
      environment: ngeniusEnv,
      apiBaseUrl,
      outletId,
      currency: orderPayload.amount.currencyCode,
      amountInMinorUnits: orderPayload.amount.value,
      action: orderPayload.action,
      merchantOrderReference: orderPayload.merchantOrderReference,
      redirectUrl: orderPayload.merchantAttributes?.redirectUrl
    });

    const orderRes = await fetch(`${apiBaseUrl}/transactions/outlets/${outletId}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + access_token,
        'Content-Type': 'application/vnd.ni-payment.v2+json',
        'Accept': 'application/vnd.ni-payment.v2+json'
      },
      body: JSON.stringify(orderPayload)
    });

    const orderData = await orderRes.json();

    // Safe server-side response diagnostic logging
    console.log('[N-Genius Diagnostic - Response]', {
      httpStatus: orderRes.status,
      ok: orderRes.ok,
      errorCode: orderData.errors?.[0]?.errorCode || orderData.code,
      errorMessage: orderData.errors?.[0]?.message || orderData.message,
      errorDomain: orderData.errors?.[0]?.domain,
      reference: orderData.reference || null,
      hasPaymentUrl: Boolean(orderData._links?.payment?.href)
    });

    if (!orderRes.ok) {
      const errorMsg = orderData.errors?.[0]?.message || orderData.message || 'N-Genius order creation rejected';
      if (supabase) {
        try {
          await supabase.from('bookings')
            .update({ booking_status: 'cancelled', payment_status: 'payment_failed' })
            .eq('booking_number', bookingNumber);
        } catch (_) {}
      }
      return res.status(orderRes.status).json({ 
        success: false, 
        error: errorMsg, 
        raw: orderData,
        bookingNumber 
      });
    }

    const paymentUrl = orderData._links?.payment?.href || orderData._links?.['tenant-brand-payment-url']?.href;
    const gatewayOrderRef = orderData.reference || orderRef;

    if (!paymentUrl) {
      return res.status(502).json({
        success: false,
        error: 'N-Genius did not return a valid hosted payment URL.'
      });
    }

    // Save gateway reference on pending booking
    if (supabase) {
      try {
        await supabase.from('bookings')
          .update({ payment_ref: gatewayOrderRef })
          .eq('booking_number', bookingNumber);
      } catch (_) {}
    }

    return res.status(200).json({
      success: true,
      paymentUrl,
      orderRef: gatewayOrderRef,
      bookingNumber,
      totalAmount,
      currency
    });

  } catch (e) {
    console.error('N-Genius Order API Server Exception:', e);
    return res.status(500).json({ success: false, error: e.message });
  }
}
