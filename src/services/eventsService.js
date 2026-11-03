import { supabase } from '../lib/supabase';
import { dummyMovies } from '../data/dummyMovies';

function mapCatalogToAdminEvent(m) {
  return {
    id: m.id,
    event_name: m.title,
    slug: m.slug,
    event_image: m.image,
    backdrop_image: m.backdrop,
    category: m.category || 'Movies',
    venue_name: m.venue,
    city: m.city || 'Dubai',
    event_date: m.releaseDate,
    start_time: '07:30 PM',
    end_time: '10:00 PM',
    description: m.shortDescription,
    status: 'published',
    starting_price: Number(m.startingPrice) || 120,
    ticket_types: [
      { id: `${m.id}-std`, name: 'Standard Admission', price: Number(m.startingPrice) || 120, capacity: 60, sold_quantity: 0, status: 'active', section: 'Main Hall' },
      { id: `${m.id}-prem`, name: 'Premium Tier', price: (Number(m.startingPrice) || 120) + 40, capacity: 40, sold_quantity: 0, status: 'active', section: 'Balcony' },
      { id: `${m.id}-vip`, name: 'VIP Royal Box', price: (Number(m.startingPrice) || 120) + 100, capacity: 20, sold_quantity: 0, status: 'active', section: 'Royal Box' }
    ]
  };
}

// Fetch all events for Admin
export const getAdminEvents = async () => {
  // 1. Authoritative Server API
  try {
    const res = await fetch('/api/admin-events');
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const json = await res.json();
      if (json.success && Array.isArray(json.events) && json.events.length > 0) {
        return { data: json.events, error: null };
      }
    }
  } catch (err) {
    console.warn('[eventsService] Server API notice:', err.message);
  }

  // 2. Supabase Fallback
  let dbEvents = [];
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*, ticket_types(*)')
      .order('event_date', { ascending: false });
    if (!error && data) dbEvents = data;
  } catch (_) {}

  // 3. Fallback Catalog
  const catalogEvents = dummyMovies.map(mapCatalogToAdminEvent);

  const map = new Map();
  [...catalogEvents, ...dbEvents].forEach(e => {
    const k = e.slug || e.id;
    if (k) map.set(k, { ...map.get(k), ...e });
  });

  return { data: Array.from(map.values()), error: null };
};

// Fetch single event for Admin Edit / Details
export const getAdminEventById = async (id) => {
  // 1. Authoritative Server API
  try {
    const res = await fetch(`/api/admin-events?id=${encodeURIComponent(id)}`);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const json = await res.json();
      if (json.success && json.event) {
        return { data: json.event, error: null };
      }
    }
  } catch (err) {
    console.warn('[eventsService] Server API single event notice:', err.message);
  }

  // 2. Supabase Fallback
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*, ticket_types(*)')
      .or(`id.eq.${id},slug.eq.${id}`)
      .single();
    if (!error && data) return { data, error: null };
  } catch (_) {}

  // 3. Catalog Fallback
  const catalogMovie = dummyMovies.find(m => m.id === id || m.slug === id);
  if (catalogMovie) {
    return { data: mapCatalogToAdminEvent(catalogMovie), error: null };
  }

  return { data: null, error: new Error('Event not found') };
};

// Create new event
export const createEvent = async (eventData, ticketTypes = []) => {
  try {
    const res = await fetch('/api/admin-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: eventData,
        ticket_types: ticketTypes
      })
    });
    const json = await res.json();
    if (json.success) {
      return { data: json.event, error: null };
    }
    return { data: null, error: new Error(json.error || 'Failed to create event') };
  } catch (err) {
    console.error('[createEvent] Network error:', err);
    return { data: null, error: err };
  }
};

// Update existing event
export const updateEvent = async (id, eventData, ticketTypes = []) => {
  try {
    const res = await fetch('/api/admin-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: { ...eventData, id },
        ticket_types: ticketTypes
      })
    });
    const json = await res.json();
    if (json.success) {
      return { data: json.event, error: null };
    }
    return { data: null, error: new Error(json.error || 'Failed to update event') };
  } catch (err) {
    console.error('[updateEvent] Network error:', err);
    return { data: null, error: err };
  }
};

// Toggle event status (e.g. published, draft, cancelled, sold_out)
export const setEventStatus = async (id, status) => {
  try {
    const res = await fetch('/api/admin-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_status', id, status })
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// Duplicate event
export const duplicateEvent = async (id) => {
  try {
    const res = await fetch('/api/admin-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'duplicate', id })
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// Safe Delete / Archive Event
export const deleteEvent = async (id) => {
  try {
    const res = await fetch('/api/admin-events', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// Delete ticket category from event configuration
export const deleteTicketType = async (ticketTypeId) => {
  try {
    if (supabase) {
      await supabase.from('ticket_types').delete().eq('id', ticketTypeId);
    }
  } catch (_) {}
  return { success: true };
};

// Fetch Venues for event creation/editing
export const getVenues = async () => {
  try {
    const res = await fetch('/api/admin-venues');
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const json = await res.json();
      if (json.success && Array.isArray(json.venues)) {
        return { data: json.venues, error: null };
      }
    }
  } catch (_) {}

  return { data: [], error: null };
};

// Fetch Categories for event creation/editing
export const getCategories = async () => {
  try {
    const res = await fetch('/api/admin-categories');
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const json = await res.json();
      if (json.success && Array.isArray(json.categories)) {
        return { data: json.categories.map(c => c.name), error: null };
      }
    }
  } catch (_) {}

  return { data: ['Movies', 'Live In Rhythm', 'The Laugh Lounge', 'Theatre & Plays', 'Experiences & Attractions', 'Beyond The Walls'], error: null };
};
