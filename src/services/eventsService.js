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
    ticket_types: [
      { id: `${m.id}-std`, name: 'Standard', price: m.startingPrice, capacity: 60, sold_quantity: 12 },
      { id: `${m.id}-prem`, name: 'Premium', price: m.startingPrice + 40, capacity: 40, sold_quantity: 8 },
      { id: `${m.id}-vip`, name: 'VIP', price: m.startingPrice + 100, capacity: 20, sold_quantity: 4 }
    ]
  };
}

// Event queries
export const getAdminEvents = async () => {
  let dbEvents = [];
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        ticket_types (
          id,
          name,
          price,
          capacity,
          sold_quantity
        )
      `)
      .order('event_date', { ascending: false });
    if (!error && data) dbEvents = data;
  } catch (_) {}

  // Local storage overrides/edits
  let localEvents = [];
  if (typeof window !== 'undefined') {
    try {
      localEvents = JSON.parse(localStorage.getItem('tm_local_events') || '[]');
    } catch (_) {}
  }

  // Base verified catalog
  const catalogEvents = dummyMovies.map(mapCatalogToAdminEvent);

  const map = new Map();
  [...catalogEvents, ...dbEvents, ...localEvents].forEach(e => {
    const k = e.slug || e.id;
    if (k) map.set(k, { ...map.get(k), ...e });
  });

  return { data: Array.from(map.values()), error: null };
};

export const getAdminEventById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        ticket_types (*)
      `)
      .or(`id.eq.${id},slug.eq.${id}`)
      .single();
    if (!error && data) return { data, error: null };
  } catch (_) {}

  if (typeof window !== 'undefined') {
    try {
      const local = JSON.parse(localStorage.getItem('tm_local_events') || '[]');
      const found = local.find(e => e.id === id || e.slug === id);
      if (found) return { data: found, error: null };
    } catch (_) {}
  }

  const catalogMovie = dummyMovies.find(m => m.id === id || m.slug === id);
  if (catalogMovie) {
    return { data: mapCatalogToAdminEvent(catalogMovie), error: null };
  }

  return { data: null, error: new Error('Event not found') };
};

export const createEvent = async (eventData, ticketTypes = []) => {
  // 1. Insert Event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert([eventData])
    .select()
    .single();

  if (eventError) return { error: eventError };

  // 2. Insert Ticket Types
  if (ticketTypes.length > 0) {
    const preparedTickets = ticketTypes.map(t => ({
      ...t,
      event_id: event.id
    }));
    const { error: ticketError } = await supabase
      .from('ticket_types')
      .insert(preparedTickets);

    if (ticketError) return { error: ticketError };
  }

  return { data: event };
};

export const updateEvent = async (id, eventData, ticketTypes = []) => {
  // Save to local persistence
  if (typeof window !== 'undefined') {
    try {
      const local = JSON.parse(localStorage.getItem('tm_local_events') || '[]');
      const index = local.findIndex(e => e.id === id || e.slug === id);
      const updatedItem = { ...(local[index] || {}), ...eventData, id, ticket_types: ticketTypes.length > 0 ? ticketTypes : undefined };
      if (index >= 0) local[index] = updatedItem;
      else local.push(updatedItem);
      localStorage.setItem('tm_local_events', JSON.stringify(local));
    } catch (_) {}
  }

  try {
    const { data: event, error: eventError } = await supabase
      .from('events')
      .update(eventData)
      .eq('id', id)
      .select()
      .single();

    if (!eventError && event) return { data: event, error: null };
  } catch (_) {}

  return { data: { id, ...eventData }, error: null };
};

export const deleteTicketType = async (ticketTypeId) => {
  return await supabase.from('ticket_types').delete().eq('id', ticketTypeId);
};

export const getVenues = async () => {
  return await supabase.from('venues').select('*').order('name');
};

export const getCategories = async () => {
  // Fetch distinct categories from events or a static list if table doesn't exist
  return ['Concerts', 'Sports', 'Theatre', 'Culture', 'Dining', 'Entertainment', 'Family'];
};
