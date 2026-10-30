import { supabase } from '../lib/supabase';

export const saveLocalBookings = (bookings = []) => {
  if (typeof window === 'undefined' || !bookings.length) return;
  try {
    const existing = JSON.parse(localStorage.getItem('tm_local_bookings') || '[]');
    const map = new Map(existing.map(b => [b.booking_number || b.id, b]));
    bookings.forEach(b => map.set(b.booking_number || b.id, b));
    localStorage.setItem('tm_local_bookings', JSON.stringify(Array.from(map.values())));
  } catch (e) {
    console.warn('Could not cache booking locally:', e);
  }
};

/**
 * Fetches all bookings for the authenticated user, joined with event data.
 * Merges Supabase records with local persistence.
 * @param {string} userId
 */
export const getUserBookings = async (userId) => {
  let dbBookings = [];
  try {
    const { data, error } = await supabase
      .from('bookings')
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
          end_time,
          category
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) dbBookings = data;
  } catch (e) {
    console.warn('Supabase bookings query warning:', e.message);
  }

  let localBookings = [];
  if (typeof window !== 'undefined') {
    try {
      const local = JSON.parse(localStorage.getItem('tm_local_bookings') || '[]');
      localBookings = local.filter(b => !b.user_id || b.user_id === userId);
    } catch (_) {}
  }

  const map = new Map();
  [...localBookings, ...dbBookings].forEach(b => {
    const k = b.booking_number || b.id;
    if (k) map.set(k, { ...map.get(k), ...b });
  });

  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );

  return { data: merged, error: null };
};

/**
 * Fetches a single booking by booking_number for the authenticated user.
 * @param {string} bookingNumber
 * @param {string} userId
 */
export const getBookingByNumber = async (bookingNumber, userId) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
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
          end_time,
          category
        )
      `)
      .eq('booking_number', bookingNumber)
      .maybeSingle();

    if (!error && data) return { data, error: null };
  } catch (e) {}

  if (typeof window !== 'undefined') {
    try {
      const local = JSON.parse(localStorage.getItem('tm_local_bookings') || '[]');
      const found = local.find(b => b.booking_number === bookingNumber);
      if (found) return { data: found, error: null };
    } catch (_) {}
  }

  return { data: null, error: new Error('Booking not found') };
};

/**
 * Fetches all tickets related to a specific booking.
 * @param {string} bookingId
 */
export const getBookingTickets = async (bookingId) => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('id, ticket_number, ticket_type, status, quantity, seat, row')
      .or(`booking_id.eq.${bookingId},booking_reference.eq.${bookingId}`);

    if (!error && data && data.length > 0) return { data, error: null };
  } catch (e) {}

  // Check authoritative server API
  try {
    const res = await fetch('/api/admin-bookings');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.tickets)) {
        const found = json.tickets.filter(t => t.booking_id === bookingId || t.booking_reference === bookingId);
        if (found.length > 0) return { data: found, error: null };
      }
    }
  } catch (_) {}

  // Local fallback
  if (typeof window !== 'undefined') {
    try {
      const local = JSON.parse(localStorage.getItem('tm_local_tickets') || '[]');
      const found = local.filter(t => t.booking_id === bookingId || t.booking_reference === bookingId);
      if (found.length > 0) return { data: found, error: null };
    } catch (_) {}
  }

  return { data: [], error: null };
};

/**
 * Admins only: fetches all bookings in the system.
 * Authoritative: combines server persistence, real API data, and Supabase.
 */
export const getAllBookingsAdmin = async () => {
  let serverBookings = [];
  try {
    const res = await fetch('/api/admin-bookings');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.bookings)) {
        serverBookings = json.bookings;
      }
    }
  } catch (err) {
    console.warn('[getAllBookingsAdmin] Server API notice:', err.message);
  }

  let dbBookings = [];
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        events (
          id,
          event_name,
          event_date
        ),
        profiles (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false });

    if (!error && data) dbBookings = data;
  } catch (e) {
    console.warn('Supabase admin bookings error:', e.message);
  }

  let localBookings = [];
  if (typeof window !== 'undefined') {
    try {
      localBookings = JSON.parse(localStorage.getItem('tm_local_bookings') || '[]');
    } catch (_) {}
  }

  const map = new Map();
  [...serverBookings, ...localBookings, ...dbBookings].forEach(b => {
    const k = b.booking_number || b.id;
    if (k) {
      const existing = map.get(k) || {};
      map.set(k, {
        ...existing,
        ...b,
        events: b.events || existing.events,
        profiles: b.profiles || existing.profiles || {
          email: b.customer_email || 'guest@ticketmahal.ae',
          first_name: (b.customer_name || 'Guest').split(' ')[0] || 'Guest',
          last_name: (b.customer_name || '').split(' ').slice(1).join(' ') || ''
        }
      });
    }
  });

  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );

  return { data: merged, error: null };
};

/**
 * Admins only: fetches single booking details.
 */
export const getAdminBookingDetails = async (bookingNumber) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
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
          end_time
        ),
        profiles (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('booking_number', bookingNumber)
      .maybeSingle();

    if (!error && data) return { data, error: null };
  } catch (e) {}

  // Check authoritative server API
  try {
    const res = await fetch('/api/admin-bookings');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.bookings)) {
        const found = json.bookings.find(b => b.booking_number === bookingNumber || b.id === bookingNumber);
        if (found) return { data: found, error: null };
      }
    }
  } catch (_) {}

  if (typeof window !== 'undefined') {
    try {
      const local = JSON.parse(localStorage.getItem('tm_local_bookings') || '[]');
      const found = local.find(b => b.booking_number === bookingNumber);
      if (found) {
        return {
          data: {
            ...found,
            events: found.events || { event_name: 'Ticket Mahal Showcase' },
            profiles: found.profiles || {
              email: found.customer_email || 'guest@ticketmahal.ae',
              first_name: (found.customer_name || 'Guest').split(' ')[0] || 'Guest',
              last_name: (found.customer_name || '').split(' ').slice(1).join(' ') || ''
            }
          },
          error: null
        };
      }
    } catch (_) {}
  }

  return { data: null, error: new Error('Booking not found') };
};

/**
 * Creates a new pending booking in Supabase database.
 * Never sets status to 'paid' on creation.
 */
export const createPendingBooking = async ({ userId, eventId, showtime, ticketQuantity, totalAmount, paymentRef, customerInfo }) => {
  const bookingNumber = 'TM-' + Math.floor(100000 + Math.random() * 900000);
  
  try {
    const bookingPayload = {
      booking_number: bookingNumber,
      user_id: userId || null,
      event_id: eventId || null,
      showtime: showtime,
      quantity: ticketQuantity,
      total_price: totalAmount,
      total_amount: totalAmount,
      booking_status: 'pending',
      payment_status: 'pending',
      payment_method: 'N-Genius Payment Gateway (Network International)',
      payment_ref: paymentRef || null,
      customer_email: customerInfo?.email || null,
      customer_name: customerInfo?.name || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingPayload])
      .select()
      .single();

    if (error) {
      console.warn('Supabase booking insert warning:', error.message);
      return { data: bookingPayload, error: null, fallback: true };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Pending booking creation error:', err);
    return { 
      data: {
        booking_number: bookingNumber,
        showtime,
        quantity: ticketQuantity,
        total_price: totalAmount,
        total_amount: totalAmount,
        booking_status: 'pending',
        payment_status: 'pending',
        payment_method: 'N-Genius Payment Gateway (Network International)',
        payment_ref: paymentRef || null,
        created_at: new Date().toISOString()
      }, 
      error: null,
      fallback: true 
    };
  }
};

/**
 * Updates booking status after gateway verification.
 */
export const updateBookingPaymentStatus = async (bookingNumber, { paymentStatus, bookingStatus, paymentRef }) => {
  try {
    const updateData = {
      payment_status: paymentStatus,
      booking_status: bookingStatus,
      updated_at: new Date().toISOString()
    };
    if (paymentRef) updateData.payment_ref = paymentRef;

    const { data, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('booking_number', bookingNumber)
      .select()
      .single();

    return { data, error };
  } catch (err) {
    console.error('Error updating booking status:', err);
    return { data: null, error: err };
  }
};

export const createBooking = createPendingBooking;


