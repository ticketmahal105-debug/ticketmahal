import { 
  getAllTicketsFromStore, 
  updateTicketStatusInStore, 
  recordActivityToStore,
  getAllBookingsFromStore 
} from './services/persistenceService.js';
import { getSupabaseAdmin, serverBookingTicketsMap } from './services/fulfillmentService.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    const supabase = getSupabaseAdmin();

    // GET: List all tickets
    if (req.method === 'GET') {
      const storeTickets = getAllTicketsFromStore();
      const memTickets = Array.from(serverBookingTicketsMap.values()).flat();

      let dbTickets = [];
      if (supabase) {
        try {
          const { data } = await supabase.from('tickets').select('*');
          if (Array.isArray(data)) dbTickets = data;
        } catch (_) {}
      }

      const map = new Map();
      [...storeTickets, ...memTickets, ...dbTickets].forEach(t => {
        const k = t.ticket_number || t.id;
        if (k) map.set(k, { ...map.get(k), ...t });
      });

      const tickets = Array.from(map.values()).sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );

      return res.status(200).json({ success: true, tickets });
    }

    // POST: Update Ticket (Check-In toggle or Mark Cancelled)
    if (req.method === 'POST') {
      const { ticket_number, action, status } = req.body || {};

      if (!ticket_number) {
        return res.status(400).json({ success: false, error: 'Ticket number is required' });
      }

      let newStatus = status;
      let usedAt = null;

      if (action === 'check_in') {
        newStatus = 'used';
        usedAt = new Date().toISOString();
      } else if (action === 'cancel') {
        newStatus = 'cancelled';
      } else if (action === 'reactivate') {
        newStatus = 'valid';
      }

      const updated = updateTicketStatusInStore(ticket_number, newStatus, usedAt);

      // Also update in Supabase if present
      if (supabase) {
        try {
          await supabase
            .from('tickets')
            .update({ 
              status: newStatus,
              used_at: usedAt,
              updated_at: new Date().toISOString()
            })
            .or(`ticket_number.eq.${ticket_number},id.eq.${ticket_number}`);
        } catch (dbErr) {
          console.warn('[AdminTickets] Supabase update notice:', dbErr.message);
        }
      }

      recordActivityToStore({
        id: `act-tkt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: newStatus === 'used' ? 'ticket_checked_in' : 'ticket_cancelled',
        customer: updated?.customer_name || 'Admin',
        bookingReference: updated?.booking_reference,
        status: 'success',
        details: `Ticket #${ticket_number} marked as ${newStatus}`
      });

      return res.status(200).json({ success: true, ticket: updated });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('[Admin Tickets API Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
