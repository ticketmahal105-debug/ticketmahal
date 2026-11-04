import { 
  getAllEventsFromStore, 
  getEventFromStore, 
  saveEventToStore, 
  deleteEventFromStore,
  getAllBookingsFromStore,
  recordActivityToStore
} from './services/persistenceService.js';
import { getSupabaseAdmin } from './services/fulfillmentService.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    const supabase = getSupabaseAdmin();

    // GET: Fetch all events
    if (req.method === 'GET') {
      const id = req.query?.id || (req.url ? new URL(req.url, 'http://localhost').searchParams.get('id') : null);
      if (id) {
        const event = getEventFromStore(id);
        if (!event) {
          return res.status(404).json({ success: false, error: 'Event not found' });
        }
        return res.status(200).json({ success: true, event });
      }

      const storeEvents = getAllEventsFromStore();
      let dbEvents = [];
      if (supabase) {
        try {
          const { data } = await supabase.from('events').select('*, ticket_types(*)');
          if (Array.isArray(data)) dbEvents = data;
        } catch (_) {}
      }

      // Merge store events with Supabase events
      const eventsMap = new Map();
      storeEvents.forEach(e => {
        if (e && e.id) eventsMap.set(e.id, e);
      });
      dbEvents.forEach(e => {
        if (e && e.id) {
          const existing = eventsMap.get(e.id) || {};
          eventsMap.set(e.id, { ...existing, ...e });
        }
      });

      const merged = Array.from(eventsMap.values());
      return res.status(200).json({ success: true, events: merged });
    }

    // POST: Create, Update, Duplicate, or Toggle status
    if (req.method === 'POST') {
      const { action, event, ticket_types, id } = req.body || {};

      // 1. Toggle status / Publish / Unpublish / Cancel
      if (action === 'set_status') {
        const existing = getEventFromStore(id);
        if (!existing) {
          return res.status(404).json({ success: false, error: 'Event not found' });
        }
        const updated = saveEventToStore({
          ...existing,
          status: req.body.status || 'published'
        });

        recordActivityToStore({
          id: `act-evt-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'event_updated',
          customer: 'Admin',
          event: existing.event_name,
          status: 'success',
          details: `Event "${existing.event_name}" status changed to ${req.body.status}`
        });

        return res.status(200).json({ success: true, event: updated });
      }

      // 2. Duplicate event
      if (action === 'duplicate') {
        const original = getEventFromStore(id);
        if (!original) {
          return res.status(404).json({ success: false, error: 'Event not found to duplicate' });
        }

        const newId = `event-${Date.now()}`;
        const duplicated = saveEventToStore({
          ...original,
          id: newId,
          slug: `${original.slug || original.id}-copy-${Date.now().toString().slice(-4)}`,
          event_name: `${original.event_name} (Copy)`,
          status: 'draft',
          created_at: new Date().toISOString()
        }, original.ticket_types || []);

        recordActivityToStore({
          id: `act-evt-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'event_created',
          customer: 'Admin',
          event: duplicated.event_name,
          status: 'success',
          details: `Duplicated event from "${original.event_name}"`
        });

        return res.status(201).json({ success: true, event: duplicated });
      }

      // 3. Normal Create or Update
      if (!event || !event.event_name) {
        return res.status(400).json({ success: false, error: 'Event name is required' });
      }

      const saved = saveEventToStore(event, ticket_types || event.ticket_types || []);

      // Also try sync to Supabase if schema supports it
      if (supabase) {
        try {
          const payload = {
            id: saved.id,
            event_name: saved.event_name,
            slug: saved.slug,
            description: saved.description,
            category: saved.category,
            venue_name: saved.venue_name,
            city: saved.city,
            event_date: saved.event_date,
            start_time: saved.start_time,
            end_time: saved.end_time,
            event_image: saved.event_image,
            backdrop_image: saved.backdrop_image,
            starting_price: saved.starting_price,
            status: saved.status,
            organizer: saved.organizer,
            age_restriction: saved.age_restriction,
            language: saved.language,
            duration: saved.duration,
            doors_open: saved.doors_open
          };
          await supabase.from('events').upsert([payload]);
        } catch (dbErr) {
          console.warn('[AdminEvents] Supabase sync notice:', dbErr.message);
        }
      }

      recordActivityToStore({
        id: `act-evt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: event.id ? 'event_updated' : 'event_created',
        customer: 'Admin',
        event: saved.event_name,
        status: 'success',
        details: `Saved event details for "${saved.event_name}" (Category: ${saved.category}, Venue: ${saved.venue_name})`
      });

      return res.status(200).json({ success: true, event: saved });
    }

    // DELETE: Safe deletion / Archive
    if (req.method === 'DELETE') {
      const { id } = req.body || req.query || {};
      if (!id) {
        return res.status(400).json({ success: false, error: 'Event ID is required' });
      }

      // Safety check: Are there any bookings referencing this event?
      const allBookings = getAllBookingsFromStore();
      const hasBookings = allBookings.some(b => b.event_id === id || b.events?.id === id);

      if (hasBookings) {
        // Requirement O: Never physically delete historical records with bookings
        const existing = getEventFromStore(id);
        if (existing) {
          const archived = saveEventToStore({ ...existing, status: 'cancelled' });
          return res.status(200).json({
            success: true,
            archived: true,
            message: 'Event has active booking history. To preserve audit and financial records, it has been marked Cancelled/Archived instead of being permanently deleted.',
            event: archived
          });
        }
      }

      const deleted = deleteEventFromStore(id);
      return res.status(200).json({ success: true, deleted: true, event: deleted });
    }

    // Category & Venue dispatch when consolidated
    const entity = req.query?.entity || req.body?.entity;

    if (entity === 'categories' || req.query?.category_id || req.body?.category) {
      const { getAllCategoriesFromStore, saveCategoryToStore, deleteCategoryFromStore } = await import('./services/persistenceService.js');
      if (req.method === 'GET') {
        const categories = getAllCategoriesFromStore();
        const events = getAllEventsFromStore();
        const enriched = categories.map(cat => ({
          ...cat,
          events_count: events.filter(e => e.category && (e.category.toLowerCase() === cat.name.toLowerCase() || e.category.toLowerCase() === cat.slug.toLowerCase())).length
        }));
        return res.status(200).json({ success: true, categories: enriched });
      }
      if (req.method === 'POST') {
        const { action, categories, category } = req.body || {};
        if (action === 'reorder' && Array.isArray(categories)) {
          categories.forEach((item, index) => saveCategoryToStore({ ...item, display_order: index + 1 }));
          return res.status(200).json({ success: true, categories: getAllCategoriesFromStore() });
        }
        const saved = saveCategoryToStore(category || req.body);
        return res.status(200).json({ success: true, category: saved });
      }
      if (req.method === 'DELETE') {
        const { id } = req.body || req.query || {};
        const events = getAllEventsFromStore();
        const target = getAllCategoriesFromStore().find(c => c.id === id || c.slug === id);
        if (target && events.some(e => e.category && (e.category.toLowerCase() === target.name.toLowerCase() || e.category.toLowerCase() === target.slug.toLowerCase()))) {
          return res.status(400).json({ success: false, error: 'Cannot delete category: existing events belong to it.' });
        }
        const deleted = deleteCategoryFromStore(id);
        return res.status(200).json({ success: true, category: deleted });
      }
    }

    if (entity === 'venues' || req.query?.venue_id || req.body?.venue) {
      const { getAllVenuesFromStore, saveVenueToStore, deleteVenueFromStore } = await import('./services/persistenceService.js');
      if (req.method === 'GET') {
        const venues = getAllVenuesFromStore();
        const events = getAllEventsFromStore();
        const enriched = venues.map(v => ({
          ...v,
          events_count: events.filter(e => (e.venue_name && e.venue_name.toLowerCase() === v.name.toLowerCase()) || e.venue_id === v.id).length
        }));
        return res.status(200).json({ success: true, venues: enriched });
      }
      if (req.method === 'POST') {
        const saved = saveVenueToStore(req.body?.venue || req.body);
        return res.status(200).json({ success: true, venue: saved });
      }
      if (req.method === 'DELETE') {
        const { id } = req.body || req.query || {};
        const deleted = deleteVenueFromStore(id);
        return res.status(200).json({ success: true, venue: deleted });
      }
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('[Admin Events API Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
