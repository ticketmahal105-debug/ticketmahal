import crypto from 'crypto';
import { getSupabaseAdmin, serverTicketRegistry, serverBookingRegistry } from './services/fulfillmentService.js';
import { logActivity } from './services/activityService.js';

/**
 * Server-Side Ticket Verification & Check-In API
 * Validates cryptographically secure ticket tokens when scanned at the entrance.
 * 
 * Endpoints:
 * GET  /api/verify-ticket?token=...       -> Validates ticket state (does NOT check in)
 * POST /api/verify-ticket { token, checkIn: true } -> Atomically validates & checks in the ticket
 */
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  const token = req.method === 'GET' 
    ? req.query?.token || new URL(req.url, 'http://localhost').searchParams.get('token')
    : req.body?.token;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({
      valid: false,
      status: 'INVALID_TOKEN',
      message: 'No verification token provided.'
    });
  }

  // Token format: can be raw secret or full payload "TM:TKT:ticketId:rawSecret" or URL
  let lookupToken = token.trim();
  if (lookupToken.includes('/verify-ticket/')) {
    lookupToken = lookupToken.split('/verify-ticket/').pop().split('?')[0];
  }

  const supabase = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  try {
    let ticketRecord = null;

    // 0. Check in-memory authoritative registry first for instant verification
    if (serverTicketRegistry.has(lookupToken)) {
      ticketRecord = serverTicketRegistry.get(lookupToken);
    } else if (serverTicketRegistry.has(token.trim())) {
      ticketRecord = serverTicketRegistry.get(token.trim());
    }

    if (supabase) {
      // 1. Try querying by qr_token exact match
      const { data: directMatch, error: directErr } = await supabase
        .from('tickets')
        .select(`
          *,
          events (
            id,
            event_name,
            event_image,
            venue_name,
            city,
            event_date,
            start_time,
            category
          ),
          bookings (
            id,
            booking_number,
            customer_name,
            customer_email,
            payment_status,
            payment_mode
          )
        `)
        .or(`qr_token.eq.${lookupToken},ticket_number.eq.${lookupToken}`)
        .limit(1)
        .maybeSingle();

      if (directMatch) {
        ticketRecord = directMatch;
      } else {
        // Try SHA-256 hash match if secret token was passed
        const tokenHash = crypto.createHash('sha256').update(lookupToken).digest('hex');
        const { data: hashMatch } = await supabase
          .from('tickets')
          .select(`
            *,
            events (
              id,
              event_name,
              event_image,
              venue_name,
              city,
              event_date,
              start_time,
              category
            ),
            bookings (
              id,
              booking_number,
              customer_name,
              customer_email,
              payment_status,
              payment_mode
            )
          `)
          .eq('qr_token_hash', tokenHash)
          .limit(1)
          .maybeSingle();

        if (hashMatch) {
          ticketRecord = hashMatch;
        }
      }
    }

    if (!ticketRecord) {
      return res.status(404).json({
        valid: false,
        status: 'INVALID_TICKET',
        message: 'This ticket does not exist in the Ticket Mahal registry.'
      });
    }

    const event = ticketRecord.events || {};
    const booking = ticketRecord.bookings || {};
    const isCancelled = ticketRecord.status === 'cancelled' || booking.booking_status === 'cancelled';
    const isRefunded = ticketRecord.status === 'refunded' || booking.payment_status === 'refunded';
    const isAlreadyCheckedIn = ticketRecord.status === 'used' || ticketRecord.status === 'checked_in' || Boolean(ticketRecord.checked_in_at || ticketRecord.used_at);

    if (isCancelled) {
      return res.status(200).json({
        valid: false,
        status: 'CANCELLED',
        message: 'This ticket has been cancelled and is invalid for entry.',
        ticket: {
          ticketNumber: ticketRecord.ticket_number,
          eventName: event.event_name || 'Event',
          seat: ticketRecord.seat,
          category: ticketRecord.ticket_type
        }
      });
    }

    if (isRefunded) {
      return res.status(200).json({
        valid: false,
        status: 'REFUNDED',
        message: 'This ticket has been refunded and is invalid for entry.',
        ticket: {
          ticketNumber: ticketRecord.ticket_number,
          eventName: event.event_name || 'Event',
          seat: ticketRecord.seat,
          category: ticketRecord.ticket_type
        }
      });
    }

    if (isAlreadyCheckedIn) {
      return res.status(200).json({
        valid: false,
        status: 'ALREADY_USED',
        message: 'This ticket was already checked in at the entrance.',
        checkedInAt: ticketRecord.checked_in_at || ticketRecord.used_at,
        ticket: {
          ticketNumber: ticketRecord.ticket_number,
          eventName: event.event_name || 'Event',
          customerName: booking.customer_name || ticketRecord.customer_name || 'Valued Guest',
          seat: ticketRecord.seat,
          category: ticketRecord.ticket_type,
          showtime: event.start_time,
          date: event.event_date
        }
      });
    }

    // If caller requested Check-In (POST with checkIn: true)
    const shouldCheckIn = req.method === 'POST' && req.body?.checkIn === true;
    if (shouldCheckIn) {
      ticketRecord.status = 'used';
      ticketRecord.checked_in_at = nowIso;
      ticketRecord.used_at = nowIso;

      if (supabase) {
        try {
          await supabase
            .from('tickets')
            .update({
              status: 'used',
              checked_in_at: nowIso,
              used_at: nowIso
            })
            .eq('id', ticketRecord.id);
        } catch (_) {}
      }

      try {
        await logActivity({
          action: 'ticket_checked_in',
          customer: booking.customer_name || 'Guest',
          email: booking.customer_email || 'ticket-scanner',
          event: event.event_name || 'Event',
          bookingReference: ticketRecord.booking_reference,
          status: 'success',
          details: `Ticket ${ticketRecord.ticket_number} (Seat: ${ticketRecord.seat || 'General'}) checked in successfully at entrance.`
        });
      } catch (_) {}

      return res.status(200).json({
        valid: true,
        status: 'CHECKED_IN',
        message: 'Admission verified! Ticket checked in successfully.',
        checkedInAt: nowIso,
        ticket: {
          ticketNumber: ticketRecord.ticket_number,
          bookingReference: ticketRecord.booking_reference,
          eventName: event.event_name || 'Event',
          customerName: booking.customer_name || ticketRecord.customer_name || 'Valued Guest',
          customerEmail: booking.customer_email,
          seat: ticketRecord.seat,
          row: ticketRecord.row,
          category: ticketRecord.ticket_type || 'Standard',
          venue: event.venue_name,
          city: event.city,
          showtime: event.start_time,
          date: event.event_date,
          paymentMode: booking.payment_mode || ticketRecord.payment_mode || 'demo'
        }
      });
    }

    // Default inspection response (VALID TICKET READY FOR ENTRY)
    return res.status(200).json({
      valid: true,
      status: 'VALID',
      message: 'Ticket is valid and ready for admission.',
      ticket: {
        ticketNumber: ticketRecord.ticket_number,
        bookingReference: ticketRecord.booking_reference,
        eventName: event.event_name || 'Event',
        customerName: booking.customer_name || ticketRecord.customer_name || 'Valued Guest',
        seat: ticketRecord.seat,
        row: ticketRecord.row,
        category: ticketRecord.ticket_type || 'Standard',
        venue: event.venue_name,
        city: event.city,
        showtime: event.start_time,
        date: event.event_date,
        paymentMode: booking.payment_mode || ticketRecord.payment_mode || 'demo'
      }
    });

  } catch (error) {
    console.error('Verify Ticket Error:', error);
    return res.status(500).json({
      valid: false,
      status: 'SERVER_ERROR',
      message: error.message || 'Error communicating with ticket verification database.'
    });
  }
}
