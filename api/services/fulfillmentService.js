import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { dummyMovies } from '../../src/data/dummyMovies.js';
import { logActivity, sendOwnerBookingNotification } from './activityService.js';
import { saveBookingToStore } from './persistenceService.js';

export function getSupabaseClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    return createClient(url, key);
  } catch (e) {
    console.warn('Supabase client init warning:', e.message);
    return null;
  }
}

export const getSupabaseAdmin = getSupabaseClient;

// Fast In-Memory Authoritative Registry for instant ticket verification & resilience
export const serverTicketRegistry = new Map();
export const serverBookingRegistry = new Map();
export const serverBookingTicketsMap = new Map();

/**
 * Validates event and calculates authoritative price server-side
 */
export async function getAuthoritativeEventDetails(eventId, supabase) {
  // 1. Search local verified catalog
  const movie = dummyMovies.find(m => m.id === eventId || m.slug === eventId);
  if (movie) {
    return {
      id: movie.id,
      title: movie.title,
      image: movie.image,
      startingPrice: Number(movie.startingPrice) || 120,
      currency: movie.currency || 'AED',
      venue: movie.venue || 'Ticket Mahal Main Stage',
      city: movie.city || 'Dubai',
      date: movie.releaseDate || 'Upcoming Show',
      category: movie.category || 'Cinema'
    };
  }

  // 2. Query Supabase events if available
  if (supabase) {
    try {
      const { data } = await supabase
        .from('events')
        .select('*')
        .or(`id.eq.${eventId},slug.eq.${eventId}`)
        .maybeSingle();

      if (data) {
        return {
          id: data.id,
          title: data.event_name || data.title,
          image: data.event_image || data.image,
          startingPrice: Number(data.starting_price || data.ticket_price || 120),
          currency: data.currency || 'AED',
          venue: data.venue_name || data.venue || 'Ticket Mahal Stage',
          city: data.city || 'Dubai',
          date: data.event_date || 'Upcoming Show',
          category: data.category || 'Events'
        };
      }
    } catch (e) {
      console.warn('Supabase event query notice:', e.message);
    }
  }

  // Default fallback for catalog safety
  return {
    id: eventId,
    title: 'Ticket Mahal Special Presentation',
    image: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?q=80&w=800&auto=format&fit=crop',
    startingPrice: 120,
    currency: 'AED',
    venue: 'Ticket Mahal Main Stage',
    city: 'Dubai',
    date: 'Upcoming Show',
    category: 'Events'
  };
}

/**
 * Generates cryptographically secure, non-predictable Ticket ID (e.g. TM-A7K9P2)
 */
export function generateSecureTicketId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous 0/O, 1/I
  const randomBytes = crypto.randomBytes(6);
  let id = 'TM-';
  for (let i = 0; i < 6; i++) {
    id += chars[randomBytes[i] % chars.length];
  }
  return id;
}

/**
 * Sends a confirmation email server-side via Resend.
 * Resilient: Failure to send does NOT break or roll back the booking.
 */
export async function sendConfirmationEmail({ customerEmail, customerName, event, showtime, booking, tickets, paymentMode, guestAccessToken }) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.log('[Email Notice] RESEND_API_KEY not configured. Email confirmation skipped safely.');
    return { sent: false, reason: 'RESEND_API_KEY_NOT_SET' };
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL || 'Ticket Mahal <onboarding@resend.dev>';
  const toAddress = customerEmail;
  if (!toAddress || !toAddress.includes('@')) {
    return { sent: false, reason: 'INVALID_RECIPIENT' };
  }

  const isDemo = paymentMode === 'demo';
  const subject = isDemo 
    ? `Your Ticket Mahal Tickets Are Here [Demo] 🎟️` 
    : `Your Ticket Mahal Tickets Are Here 🎟️`;

  const appBaseUrl = (process.env.APP_URL || 'https://ticketmahal.ae').replace(/\/+$/, '');
  const ticketAccessUrl = guestAccessToken
    ? `${appBaseUrl}/tickets/access/${guestAccessToken}`
    : `${appBaseUrl}/view-ticket/${booking.booking_number}`;

  const seatsDisplay = tickets.map(t => t.seat || 'Admission').join(', ');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FDFBF7; color: #1c1c1c; margin: 0; padding: 20px; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #EFE9DE; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #1c1c1c 0%, #2d181e 60%, #7A1F2B 100%); padding: 35px 30px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-family: Georgia, serif; font-size: 26px; color: #F5A300; letter-spacing: 1px; }
        .badge { display: inline-block; padding: 4px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; border-radius: 20px; background: rgba(245,163,0,0.2); color: #F5A300; margin-top: 8px; border: 1px solid rgba(245,163,0,0.4); }
        .demo-flag { display: inline-block; padding: 3px 10px; font-size: 10px; font-weight: bold; text-transform: uppercase; border-radius: 6px; background: #FEF3C7; color: #92400E; margin-bottom: 12px; border: 1px solid #FCD34D; }
        .body { padding: 30px; }
        .greeting { font-size: 18px; font-weight: 600; margin-bottom: 15px; color: #1c1c1c; }
        .event-card { background: #FDFBF7; border: 1px solid #EFE9DE; border-radius: 16px; padding: 20px; margin: 20px 0; }
        .event-title { font-size: 20px; font-weight: bold; color: #7A1F2B; margin: 0 0 10px 0; font-family: Georgia, serif; }
        .details-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .details-table td { padding: 8px 0; border-bottom: 1px solid #F4EFE6; }
        .details-table td.label { color: #736E65; width: 40%; font-weight: 500; }
        .details-table td.value { color: #1c1c1c; font-weight: 600; text-align: right; }
        .tickets-list { margin: 20px 0; }
        .ticket-item { background: #FFFFFF; border: 1px dashed #D5CBB9; border-radius: 12px; padding: 12px 16px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
        .btn-container { text-align: center; margin: 30px 0 15px 0; }
        .btn { display: inline-block; background: #7A1F2B; color: #ffffff !important; text-decoration: none; font-weight: bold; font-size: 14px; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(122,31,43,0.3); }
        .footer { background: #FDFBF7; border-top: 1px solid #EFE9DE; padding: 20px 30px; text-align: center; font-size: 12px; color: #A39D93; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TICKET MAHAL</h1>
          <div class="badge">Booking Confirmed ✓</div>
        </div>
        <div class="body">
          ${isDemo ? '<div class="demo-flag">Demo Booking Mode</div>' : ''}
          <div class="greeting">Hello ${customerName || 'Valued Guest'},</div>
          <p style="color: #57524A; line-height: 1.5; margin: 0 0 15px 0;">
            Your reservation is officially confirmed. Your digital ticket pass with secure QR entry is now ready in your Ticket Mahal account.
          </p>

          <div style="text-align: center; margin: 20px 0;">
            <img src="${event.image}" alt="${event.title}" style="width: 140px; height: 190px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 14px rgba(0,0,0,0.12); border: 1px solid #EFE9DE;" />
          </div>

          <div class="event-card">
            <div class="event-title">${event.title}</div>
            <table class="details-table">
              <tr>
                <td class="label">Showtime:</td>
                <td class="value">${showtime}</td>
              </tr>
              <tr>
                <td class="label">Venue:</td>
                <td class="value">${event.venue}, ${event.city}</td>
              </tr>
              <tr>
                <td class="label">Seats:</td>
                <td class="value" style="color: #7A1F2B; font-weight: bold;">${seatsDisplay}</td>
              </tr>
              <tr>
                <td class="label">Admissions:</td>
                <td class="value">${tickets.length} Ticket(s)</td>
              </tr>
              <tr>
                <td class="label">Booking Ref:</td>
                <td class="value" style="font-family: monospace; color: #7A1F2B;">${booking.booking_number}</td>
              </tr>
              <tr>
                <td class="label">Total Paid:</td>
                <td class="value" style="color: #10B981;">AED ${booking.total_amount}</td>
              </tr>
            </table>
          </div>

          <div class="tickets-list">
            <p style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #736E65; margin-bottom: 8px;">
              Individual Ticket Passes:
            </p>
            ${tickets.map((t) => `
              <div class="ticket-item">
                <span><strong>${t.seat ? `Seat ${t.seat}` : 'Admission'}:</strong> ${t.ticket_type}</span>
                <span style="font-family: monospace; font-weight: bold; color: #7A1F2B;">${t.ticket_number}</span>
              </div>
            `).join('')}
          </div>

          <div class="btn-container">
            <a href="${ticketAccessUrl}" class="btn" style="letter-spacing: 1px;">VIEW DIGITAL E-TICKETS</a>
          </div>

          <p style="font-size: 12px; color: #736E65; text-align: center; margin-top: 20px;">
            Please present your digital QR code pass upon arrival at the venue entrance.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Ticket Mahal L.L.C. Dubai, UAE.<br>
          Need assistance? Contact support@ticketmahal.ae
        </div>
      </div>
    </body>
    </html>
  `;

  const redactedUrl = ticketAccessUrl.replace(/\/tickets\/access\/.+$/, '/tickets/access/[SECURE_TOKEN_REDACTED]');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [toAddress],
        subject: subject,
        html: htmlContent
      })
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.warn('[Resend Email Notice]: Non-200 response:', res.status, errBody);
      console.log('[Confirmation Email Audit Log]:', JSON.stringify({
        bookingReference: booking.booking_number,
        recipientEmail: toAddress,
        ticketCount: tickets.length,
        ticketUrlGenerated: true,
        redactedUrl,
        deliveryStatus: 'FAILED',
        error: errBody,
        timestamp: new Date().toISOString()
      }));
      return { sent: false, error: errBody };
    }

    const data = await res.json();
    console.log('[Confirmation Email Audit Log]:', JSON.stringify({
      bookingReference: booking.booking_number,
      recipientEmail: toAddress,
      ticketCount: tickets.length,
      ticketUrlGenerated: true,
      redactedUrl,
      deliveryStatus: 'DELIVERED',
      resendMessageId: data.id,
      timestamp: new Date().toISOString()
    }));
    return { sent: true, messageId: data.id };
  } catch (err) {
    console.warn('[Resend Email Notice]: Network error sending confirmation:', err.message);
    console.log('[Confirmation Email Audit Log]:', JSON.stringify({
      bookingReference: booking.booking_number,
      recipientEmail: toAddress,
      ticketCount: tickets.length,
      ticketUrlGenerated: true,
      redactedUrl,
      deliveryStatus: 'NETWORK_ERROR',
      error: err.message,
      timestamp: new Date().toISOString()
    }));
    return { sent: false, error: err.message };
  }
}

/**
 * THE SINGLE, AUTHORITATIVE FULFILLMENT SERVICE.
 * Both DEMO and verified LIVE N-Genius flows converge here!
 */
export async function fulfillConfirmedOrder({
  eventId,
  showtime,
  ticketQuantity = 1,
  ticketType = 'Standard Admission',
  ticketTier = 'Standard',
  seats = [],
  customerInfo = {},
  userId = null,
  paymentProvider = 'demo',
  paymentMode = 'demo',
  paymentStatus = 'demo_paid',
  paymentRef = null
}) {
  const supabase = getSupabaseClient();
  const seatsList = Array.isArray(seats) && seats.length > 0 ? seats : [];
  const qty = seatsList.length > 0 ? seatsList.length : Math.max(1, parseInt(ticketQuantity, 10) || 1);

  // 1. Authoritative Server-side Price Calculation
  const event = await getAuthoritativeEventDetails(eventId, supabase);
  
  // Data-driven tier pricing
  let tierAddon = 0;
  const tierKey = (ticketTier || ticketType || 'Standard').toLowerCase();
  if (tierKey.includes('vip') || tierKey.includes('royal')) {
    tierAddon = 100;
  } else if (tierKey.includes('premium')) {
    tierAddon = 40;
  }

  const unitPrice = event.startingPrice + tierAddon;
  const subtotal = unitPrice * qty;
  const vat = Math.round(subtotal * 0.05 * 100) / 100; // 5% UAE VAT
  const totalAmount = Math.round((subtotal + vat) * 100) / 100;
  const currency = event.currency || 'AED';

  // 2. Generate Unique Booking Identifier & Reference
  const bookingNumber = 'TM-' + Math.floor(100000 + Math.random() * 900000);
  const assignedPaymentRef = paymentRef || (paymentMode === 'demo'
    ? `DEMO-TM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
    : `TM-ORD-${bookingNumber}`);

  // Cryptographically secure, unguessable guest access token (32 bytes URL-safe base64)
  const guestAccessToken = crypto.randomBytes(32).toString('base64url');
  const guestTokenHash = crypto.createHash('sha256').update(guestAccessToken).digest('hex');

  const nowIso = new Date().toISOString();

  // 3. Create Booking Record
  const bookingRecord = {
    booking_number: bookingNumber,
    access_token: guestAccessToken,
    access_token_hash: guestTokenHash,
    user_id: userId || null,
    event_id: event.id || eventId,
    showtime: showtime || '07:30 PM',
    quantity: qty,
    seats: seatsList.join(', ') || null,
    ticket_category: ticketTier || ticketType || 'Standard',
    total_price: totalAmount,
    total_amount: totalAmount,
    currency: currency,
    booking_status: 'confirmed',
    payment_provider: paymentProvider || 'demo',
    payment_mode: paymentMode || 'demo',
    payment_status: paymentStatus, // 'demo_paid' for demo, 'paid' for live
    payment_method: paymentProvider === 'demo' ? 'Ticket Mahal Demo Checkout' : 'N-Genius Payment Gateway',
    payment_ref: assignedPaymentRef,
    customer_name: customerInfo.name || 'Valued Guest',
    customer_email: customerInfo.email || null,
    customer_phone: customerInfo.phone || null,
    created_at: nowIso,
    confirmed_at: nowIso
  };

  let insertedBooking = bookingRecord;
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingRecord])
        .select()
        .single();
      if (!error && data) {
        insertedBooking = data;
      } else if (error) {
        console.warn('[Fulfillment] Supabase booking insert notice:', error.message);
      }
    } catch (e) {
      console.warn('[Fulfillment] Supabase booking exception:', e.message);
    }
  }

  // 4. Generate INDIVIDUAL Tickets with Secure Unique QR Tokens (ONE PER SEAT)
  const generatedTickets = [];
  for (let i = 0; i < qty; i++) {
    const seatId = seatsList[i] || null;
    const ticketId = generateSecureTicketId();
    // Cryptographically secure random QR token (24 bytes url-safe)
    const rawQrSecret = crypto.randomBytes(24).toString('base64url');
    // Verification URL encoded inside the QR for instant mobile scanning & server validation
    const qrPayload = `https://ticketmahal.ae/verify-ticket/${rawQrSecret}`;
    const tokenHash = crypto.createHash('sha256').update(rawQrSecret).digest('hex');

    const ticketRecord = {
      ticket_number: ticketId,
      booking_id: insertedBooking.id || insertedBooking.booking_number,
      booking_reference: bookingNumber,
      user_id: userId || null,
      event_id: event.id || eventId,
      ticket_type: ticketTier || ticketType || 'Standard',
      seat: seatId,
      row: seatId ? seatId.charAt(0) : null,
      seat_number: seatId ? seatId.slice(1) : null,
      quantity: 1, // Strictly 1 admission per ticket record
      price: unitPrice,
      qr_token: qrPayload,
      qr_token_hash: tokenHash,
      status: 'valid',
      checked_in_at: null,
      created_at: nowIso,
      // Attached event data for immediate UI hydration
      events: {
        id: event.id,
        event_name: event.title,
        event_image: event.image,
        venue_name: event.venue,
        city: event.city,
        event_date: event.date,
        start_time: showtime,
        category: event.category
      }
    };

    generatedTickets.push(ticketRecord);
    // Register ticket in authoritative server registry
    serverTicketRegistry.set(ticketId, ticketRecord);
    serverTicketRegistry.set(ticketRecord.qr_token, ticketRecord);
    serverTicketRegistry.set(rawQrSecret, ticketRecord);
  }

  // Register booking and tickets in authoritative server registry and persistent store
  serverBookingRegistry.set(bookingNumber, insertedBooking);
  serverBookingRegistry.set(guestAccessToken, insertedBooking);
  serverBookingRegistry.set(guestTokenHash, insertedBooking);
  serverBookingTicketsMap.set(bookingNumber, generatedTickets);
  serverBookingTicketsMap.set(guestAccessToken, generatedTickets);
  serverBookingTicketsMap.set(guestTokenHash, generatedTickets);
  saveBookingToStore(insertedBooking, generatedTickets);

  // Insert individual tickets into Supabase
  if (supabase) {
    try {
      const dbTickets = generatedTickets.map(({ events, ...rest }) => rest);
      const { error: tErr } = await supabase.from('tickets').insert(dbTickets);
      if (tErr) console.warn('[Fulfillment] Supabase tickets insert notice:', tErr.message);
    } catch (e) {
      console.warn('[Fulfillment] Supabase tickets insert exception:', e.message);
    }
  }

  // 5. Audit Logging
  try {
    await logActivity({
      action: 'booking_confirmed',
      customer: customerInfo.name || 'Guest User',
      email: customerInfo.email || 'anonymous',
      event: event.title,
      bookingReference: bookingNumber,
      status: 'success',
      details: `${qty} seat(s) [${seatsList.join(', ') || 'General'}] confirmed via ${paymentMode} mode. Total: AED ${totalAmount}`
    });
  } catch (_) {}

  // 6. Send Customer Confirmation Email (Resilient: failure will NOT destroy booking)
  let emailResult = { sent: false };
  try {
    emailResult = await sendConfirmationEmail({
      customerEmail: customerInfo.email,
      customerName: customerInfo.name,
      event,
      showtime,
      booking: insertedBooking,
      tickets: generatedTickets,
      paymentMode,
      guestAccessToken
    });
  } catch (mailErr) {
    console.warn('[Fulfillment] Customer email delivery failed safely:', mailErr.message);
  }

  // 7. Send Owner Notification Email (Resilient)
  let ownerEmailResult = { sent: false };
  try {
    ownerEmailResult = await sendOwnerBookingNotification({
      booking: insertedBooking,
      tickets: generatedTickets,
      event,
      seats: seatsList
    });
  } catch (ownerErr) {
    console.warn('[Fulfillment] Owner notification delivery notice:', ownerErr.message);
  }

  const appBaseUrl = (process.env.APP_URL || 'https://ticketmahal.ae').replace(/\/+$/, '');
  const ticketAccessUrl = `${appBaseUrl}/tickets/access/${guestAccessToken}`;

  return {
    success: true,
    booking: insertedBooking,
    tickets: generatedTickets,
    event,
    guestAccessToken,
    ticketAccessUrl,
    emailResult,
    ownerEmailResult
  };
}
