import { supabase } from '../lib/supabase';

/**
 * Saves tickets locally so they are guaranteed to appear immediately in My Tickets
 * even if Supabase free-tier project is asleep or in transition.
 */
export const saveLocalTickets = (tickets = []) => {
  if (typeof window === 'undefined' || !tickets.length) return;
  try {
    const existing = JSON.parse(localStorage.getItem('tm_local_tickets') || '[]');
    const existingMap = new Map(existing.map(t => [t.ticket_number || t.id, t]));
    
    tickets.forEach(t => {
      existingMap.set(t.ticket_number || t.id, t);
    });

    localStorage.setItem('tm_local_tickets', JSON.stringify(Array.from(existingMap.values())));
  } catch (e) {
    console.warn('Could not cache tickets locally:', e);
  }
};

/**
 * Fetches all tickets for the user, merging Supabase records with local persistence.
 * @param {string} userId - The authenticated user's UUID
 * @returns {{ data: Array, error: object|null }}
 */
export const getUserTickets = async (userId) => {
  let dbTickets = [];
  try {
    const { data, error } = await supabase
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
          end_time,
          category
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      dbTickets = data;
    }
  } catch (err) {
    console.warn('Notice querying Supabase tickets:', err.message);
  }

  // Merge with locally persisted tickets for instant availability
  let localTickets = [];
  if (typeof window !== 'undefined') {
    try {
      const local = JSON.parse(localStorage.getItem('tm_local_tickets') || '[]');
      localTickets = local.filter(t => !t.user_id || t.user_id === userId);
    } catch (_) {}
  }

  // Combine and deduplicate by ticket_number
  const mergedMap = new Map();
  [...localTickets, ...dbTickets].forEach(t => {
    const key = t.ticket_number || t.id;
    if (key) mergedMap.set(key, { ...mergedMap.get(key), ...t });
  });

  const merged = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );

  return { data: merged, error: null };
};

/**
 * Admins only: fetches all tickets in the system.
 */
export const getAllTicketsAdmin = async () => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        events (
          id,
          event_name,
          event_date,
          start_time
        ),
        bookings (
          id,
          booking_number,
          customer_name,
          customer_email,
          payment_status,
          payment_mode
        ),
        profiles (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false });

    if (!error && data) return { data, error: null };
  } catch (e) {}

  // Local fallback
  const local = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('tm_local_tickets') || '[]') : [];
  return { data: local, error: null };
};
