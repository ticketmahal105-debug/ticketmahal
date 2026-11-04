import crypto from 'crypto';
import { getSupabaseAdmin, serverTicketRegistry, serverBookingRegistry, serverBookingTicketsMap } from '../server/services/fulfillmentService.js';
import { logActivity } from '../server/services/activityService.js';
import { dummyMovies } from '../src/data/dummyMovies.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  const isVerify = req.query?.action === 'verify' || req.body?.checkIn !== undefined;
  const token = req.method === 'GET'
    ? req.query?.token || new URL(req.url, 'http://localhost').searchParams.get('token')
    : req.body?.token;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({
      valid: false,
      success: false,
      error: 'Missing ticket token or credential.'
    });
  }

  // Handle Verify / Check-in Mode
  if (isVerify) {
    let lookupToken = token.trim();
    if (lookupToken.includes('/verify-ticket/')) {
      lookupToken = lookupToken.split('/verify-ticket/').pop().split('?')[0];
    }

    const supabase = getSupabaseAdmin();
    const nowIso = new Date().toISOString();

    try {
      let ticketRecord = null;
      if (serverTicketRegistry.has(lookupToken)) {
        ticketRecord = serverTicketRegistry.get(lookupToken);
      } else if (serverTicketRegistry.has(token.trim())) {
        ticketRecord = serverTicketRegistry.get(token.trim());
      }

      if (supabase && !ticketRecord) {
        const { data: directMatch } = await supabase
          .from('tickets')
          .select('*, events (*), bookings (*)')
          .or(`qr_token.eq.${lookupToken},ticket_number.eq.${lookupToken}`)
          .limit(1)
          .maybeSingle();

        if (directMatch) {
          ticketRecord = directMatch;
        } else {
          const tokenHash = crypto.createHash('sha256').update(lookupToken).digest('hex');
          const { data: hashMatch } = await supabase
            .from('tickets')
            .select('*, events (*), bookings (*)')
            .eq('qr_token_hash', tokenHash)
            .limit(1)
            .maybeSingle();
          if (hashMatch) ticketRecord = hashMatch;
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
      const isAlreadyCheckedIn = ticketRecord.status === 'used' || ticketRecord.status === 'checked_in' || Boolean(ticketRecord.checked_in_at || ticketRecord.used_at);

      if (isCancelled) {
        return res.status(200).json({
          valid: false,
          status: 'CANCELLED',
          message: 'This ticket has been cancelled and is invalid for entry.'
        });
      }

      if (isAlreadyCheckedIn) {
        return res.status(200).json({
          valid: false,
          status: 'ALREADY_USED',
          message: 'This ticket was already checked in at the entrance.',
          checkedInAt: ticketRecord.checked_in_at || ticketRecord.used_at
        });
      }

      const shouldCheckIn = req.method === 'POST' && req.body?.checkIn === true;
      if (shouldCheckIn) {
        ticketRecord.status = 'used';
        ticketRecord.checked_in_at = nowIso;
        if (supabase) {
          try {
            await supabase.from('tickets').update({ status: 'used', checked_in_at: nowIso }).eq('id', ticketRecord.id);
          } catch (_) {}
        }
        try {
          await logActivity({
            action: 'ticket_checked_in',
            customer: booking.customer_name || 'Guest',
            event: event.event_name || 'Event',
            bookingReference: ticketRecord.booking_reference,
            status: 'success',
            details: `Ticket ${ticketRecord.ticket_number} checked in successfully.`
          });
        } catch (_) {}

        return res.status(200).json({
          valid: true,
          status: 'CHECKED_IN',
          message: 'Admission verified! Ticket checked in successfully.',
          ticket: ticketRecord
        });
      }

      return res.status(200).json({
        valid: true,
        status: 'VALID',
        message: 'Ticket is valid and ready for admission.',
        ticket: ticketRecord
      });
    } catch (e) {
      return res.status(500).json({ valid: false, error: e.message });
    }
  }

  const cleanToken = token.trim();
  const tokenHash = crypto.createHash('sha256').update(cleanToken).digest('hex');
  const supabase = getSupabaseAdmin();

  try {
    let booking = null;
    let tickets = [];
    let event = null;

    // 1. Check in-memory authoritative registry first
    if (serverBookingRegistry?.has(cleanToken)) {
      booking = serverBookingRegistry.get(cleanToken);
    } else if (serverBookingRegistry?.has(tokenHash)) {
      booking = serverBookingRegistry.get(tokenHash);
    }

    if (serverBookingTicketsMap?.has(cleanToken)) {
      tickets = serverBookingTicketsMap.get(cleanToken);
    } else if (serverBookingTicketsMap?.has(tokenHash)) {
      tickets = serverBookingTicketsMap.get(tokenHash);
    } else if (serverBookingTicketsMap?.has(booking?.booking_number)) {
      tickets = serverBookingTicketsMap.get(booking.booking_number);
    } else if (serverTicketRegistry?.has(cleanToken)) {
      const singleTicket = serverTicketRegistry.get(cleanToken);
      tickets = [singleTicket];
      if (!booking && singleTicket.booking_reference) {
        booking = serverBookingRegistry?.get(singleTicket.booking_reference) || {
          booking_number: singleTicket.booking_reference,
          customer_name: singleTicket.customer_name || 'Valued Guest',
          total_amount: singleTicket.price || 0,
          payment_mode: singleTicket.payment_mode || 'demo',
          showtime: singleTicket.events?.start_time || '07:30 PM'
        };
      }
    }

    // 2. Query Supabase if needed
    if (!booking && supabase) {
      // Query booking by access_token, access_token_hash, or booking_number
      const { data: dbBooking } = await supabase
        .from('bookings')
        .select('*')
        .or(`access_token.eq.${cleanToken},access_token_hash.eq.${tokenHash},booking_number.eq.${cleanToken}`)
        .limit(1)
        .maybeSingle();

      if (dbBooking) {
        booking = dbBooking;
      }
    }

    if ((!tickets || tickets.length === 0) && booking && supabase) {
      const { data: dbTickets } = await supabase
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
          )
        `)
        .or(`booking_reference.eq.${booking.booking_number},booking_id.eq.${booking.id}`);

      if (dbTickets && dbTickets.length > 0) {
        tickets = dbTickets;
      }
    }

    // 3. Fallback: single ticket direct lookup if token was a ticket ID
    if ((!tickets || tickets.length === 0) && supabase) {
      const { data: singleTicket } = await supabase
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
            customer_phone,
            total_amount,
            payment_mode,
            payment_status,
            showtime,
            created_at
          )
        `)
        .or(`ticket_number.eq.${cleanToken},qr_token_hash.eq.${tokenHash}`)
        .limit(1)
        .maybeSingle();

      if (singleTicket) {
        tickets = [singleTicket];
        booking = singleTicket.bookings || booking || {
          booking_number: singleTicket.booking_reference,
          customer_name: singleTicket.customer_name || 'Valued Guest',
          total_amount: singleTicket.price || 0,
          payment_mode: singleTicket.payment_mode || 'demo',
          showtime: singleTicket.events?.start_time || '07:30 PM'
        };
      }
    }

    if (!tickets || tickets.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found or access token has expired.'
      });
    }

    // Resolve event details (from ticket attachment or local catalog)
    const firstTicket = tickets[0];
    const eventId = firstTicket.event_id || booking?.event_id;
    const attachedEvent = firstTicket.events;

    if (attachedEvent && attachedEvent.event_name) {
      event = attachedEvent;
    } else {
      const movie = dummyMovies.find(m => m.id === eventId || m.slug === eventId);
      if (movie) {
        event = {
          id: movie.id,
          event_name: movie.title,
          event_image: movie.image,
          venue_name: movie.venue,
          city: movie.city,
          event_date: movie.releaseDate,
          start_time: booking?.showtime || '07:30 PM',
          category: movie.category
        };
      } else {
        event = {
          id: eventId || 'event-tm',
          event_name: 'Ticket Mahal Live Event',
          event_image: 'https://res.cloudinary.com/tejjggbw/image/upload/1.png',
          venue_name: 'Ticket Mahal Main Stage',
          city: 'Dubai',
          event_date: 'Upcoming',
          start_time: booking?.showtime || '07:30 PM',
          category: 'Events'
        };
      }
    }

    // Sanitize output (Do not expose sensitive secrets)
    const sanitizedBooking = {
      booking_number: booking?.booking_number || firstTicket.booking_reference,
      customer_name: booking?.customer_name || firstTicket.customer_name || 'Valued Guest',
      total_amount: booking?.total_amount || firstTicket.price * tickets.length,
      payment_mode: booking?.payment_mode || firstTicket.payment_mode || 'demo',
      showtime: booking?.showtime || event?.start_time || '07:30 PM',
      created_at: booking?.created_at || firstTicket.created_at
    };

    const sanitizedTickets = tickets.map(t => ({
      id: t.id || t.ticket_number,
      ticket_number: t.ticket_number,
      booking_reference: t.booking_reference || sanitizedBooking.booking_number,
      ticket_type: t.ticket_type || 'Standard Admission',
      seat: t.seat || null,
      row: t.row || (t.seat ? t.seat.charAt(0) : null),
      seat_number: t.seat_number || (t.seat ? t.seat.slice(1) : null),
      price: t.price || 0,
      qr_token: t.qr_token,
      status: t.status || 'valid',
      checked_in_at: t.checked_in_at || null,
      created_at: t.created_at,
      events: event
    }));

    return res.status(200).json({
      success: true,
      booking: sanitizedBooking,
      event,
      tickets: sanitizedTickets
    });

  } catch (error) {
    console.error('Ticket Access Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error loading ticket access: ' + error.message
    });
  }
}
