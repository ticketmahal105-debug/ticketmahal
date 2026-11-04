import { 
  getAllBookingsFromStore, 
  getAllTicketsFromStore, 
  getAllActivitiesFromStore,
  saveBookingToStore 
} from '../server/services/persistenceService.js';
import { 
  serverBookingRegistry, 
  serverBookingTicketsMap,
  getSupabaseAdmin 
} from '../server/services/fulfillmentService.js';
import { getActivities } from '../server/services/activityService.js';
import { dummyMovies } from '../src/data/dummyMovies.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'POST') {
    const { action, booking, tickets, ticket_number } = req.body || {};

    // Allows checking in or reactivating tickets
    if (action === 'check_in' || action === 'reactivate' || action === 'cancel_ticket') {
      const newStatus = action === 'check_in' ? 'used' : (action === 'cancel_ticket' ? 'cancelled' : 'valid');
      const usedAt = action === 'check_in' ? new Date().toISOString() : null;

      // Update in persistence store
      const persistentTickets = getAllTicketsFromStore();
      const target = persistentTickets.find(t => t.ticket_number === ticket_number || t.id === ticket_number);
      if (target) {
        target.status = newStatus;
        target.checked_in_at = usedAt;
      }

      // Update in Supabase
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase
            .from('tickets')
            .update({ status: newStatus, checked_in_at: usedAt })
            .or(`ticket_number.eq.${ticket_number},id.eq.${ticket_number}`);
        } catch (_) {}
      }

      return res.status(200).json({ 
        success: true, 
        message: `Ticket ${ticket_number} marked as ${newStatus}`,
        status: newStatus 
      });
    }

    // Allows client to sync a newly created booking into the authoritative persistent store
    if (booking) {
      saveBookingToStore(booking, tickets || []);
      if (booking.booking_number) {
        serverBookingRegistry.set(booking.booking_number, booking);
      }
      if (Array.isArray(tickets) && booking.booking_number) {
        serverBookingTicketsMap.set(booking.booking_number, tickets);
      }
      return res.status(200).json({ success: true, message: 'Booking synced to admin store.' });
    }
  }

  try {
    const supabase = getSupabaseAdmin();

    // 1. Collect bookings from persistence store and in-memory registry
    const persistentBookings = getAllBookingsFromStore();
    const memoryBookings = Array.from(serverBookingRegistry.values()).filter(b => b && b.booking_number);

    let dbBookings = [];
    if (supabase) {
      try {
        const { data } = await supabase
          .from('bookings')
          .select(`
            *,
            events (
              id,
              event_name,
              event_date,
              venue_name,
              city,
              event_image
            )
          `)
          .order('created_at', { ascending: false });
        if (data) dbBookings = data;
      } catch (_) {}
    }

    // Merge and deduplicate bookings
    const bookingsMap = new Map();
    [...persistentBookings, ...memoryBookings, ...dbBookings].forEach(b => {
      const key = b.booking_number || b.id;
      if (!key) return;

      const existing = bookingsMap.get(key) || {};
      const resolvedEvent = b.events || existing.events || (() => {
        const movie = dummyMovies.find(m => m.id === b.event_id || m.slug === b.event_id);
        if (movie) {
          return {
            id: movie.id,
            event_name: movie.title,
            event_image: movie.image,
            venue_name: movie.venue,
            city: movie.city,
            event_date: movie.releaseDate
          };
        }
        return { event_name: 'Ticket Mahal Live Presentation' };
      })();

      const resolvedProfile = b.profiles || existing.profiles || {
        email: b.customer_email || 'guest@ticketmahal.ae',
        first_name: (b.customer_name || 'Valued').split(' ')[0] || 'Valued',
        last_name: (b.customer_name || 'Guest').split(' ').slice(1).join(' ') || 'Guest'
      };

      bookingsMap.set(key, {
        ...existing,
        ...b,
        purchased_at: b.purchased_at || existing.purchased_at || b.confirmed_at || b.created_at,
        events: resolvedEvent,
        profiles: resolvedProfile
      });
    });

    const allBookings = Array.from(bookingsMap.values()).sort(
      (a, b) => new Date(b.purchased_at || b.confirmed_at || b.created_at || 0) - new Date(a.purchased_at || a.confirmed_at || a.created_at || 0)
    );

    // 2. Collect tickets
    const persistentTickets = getAllTicketsFromStore();
    const memoryTickets = Array.from(serverBookingTicketsMap.values()).flat();

    let dbTickets = [];
    if (supabase) {
      try {
        const { data } = await supabase.from('tickets').select('*');
        if (data) dbTickets = data;
      } catch (_) {}
    }

    const ticketsMap = new Map();
    [...persistentTickets, ...memoryTickets, ...dbTickets].forEach(t => {
      const key = t.ticket_number || t.id;
      if (!key) return;
      const parentBooking = bookingsMap.get(t.booking_reference || t.booking_id);
      const purchasedAt = t.purchased_at || parentBooking?.purchased_at || parentBooking?.confirmed_at || parentBooking?.created_at || t.created_at;
      ticketsMap.set(key, { 
        ...ticketsMap.get(key), 
        ...t,
        purchased_at: purchasedAt 
      });
    });

    const allTickets = Array.from(ticketsMap.values()).sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );

    // 3. User count from profiles
    let userCount = 0;
    if (supabase) {
      try {
        const { count } = await supabase.from('profiles').select('id', { count: 'exact' });
        userCount = count || 0;
      } catch (_) {}
    }

    // 4. Real Stats Calculation
    const realPaidBookings = allBookings.filter(b => 
      (b.payment_status === 'paid' || b.booking_status === 'completed') &&
      b.payment_provider !== 'demo' &&
      b.payment_mode !== 'demo' &&
      b.payment_status !== 'demo_paid'
    );

    const demoBookings = allBookings.filter(b => 
      b.payment_status === 'demo_paid' ||
      b.payment_provider === 'demo' ||
      b.payment_mode === 'demo'
    );

    const totalRealRevenue = realPaidBookings.reduce((sum, b) => sum + Number(b.total_amount || b.total_price || 0), 0);
    const totalTicketsSold = allBookings.reduce((sum, b) => sum + Number(b.quantity || b.ticket_quantity || 1), 0);

    // 5. Activities (Real Audit Trail)
    const storeActivities = getAllActivitiesFromStore();
    const runtimeActivities = getActivities();
    const activitiesMap = new Map();
    [...storeActivities, ...runtimeActivities].forEach(a => {
      if (a && a.id) activitiesMap.set(a.id, a);
    });

    // Also synthesise real activities from confirmed bookings if activity list is fresh
    allBookings.forEach(b => {
      const actId = `act-bkg-${b.booking_number}`;
      if (!activitiesMap.has(actId)) {
        activitiesMap.set(actId, {
          id: actId,
          timestamp: b.created_at || new Date().toISOString(),
          action: 'booking_confirmed',
          customer: b.customer_name || `${b.profiles?.first_name || ''} ${b.profiles?.last_name || ''}`.trim() || 'Guest',
          email: b.customer_email || b.profiles?.email || '—',
          event: b.events?.event_name || 'Ticket Mahal Event',
          bookingReference: b.booking_number,
          status: 'success',
          details: `${b.quantity || 1} ticket(s) ${b.seats ? `[${b.seats}]` : ''} confirmed via ${b.payment_mode || 'demo'} mode. Total: AED ${b.total_amount || 0}`
        });
      }
    });

    const activities = Array.from(activitiesMap.values())
      .filter(a => a.action !== 'system_initialized') // Exclude mock system initializer
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    return res.status(200).json({
      success: true,
      bookings: allBookings,
      tickets: allTickets,
      activities: activities,
      stats: {
        revenue: totalRealRevenue,
        bookings: allBookings.length,
        demoBookings: demoBookings.length,
        tickets: totalTicketsSold,
        users: userCount
      }
    });

  } catch (error) {
    console.error('[Admin Bookings API Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
