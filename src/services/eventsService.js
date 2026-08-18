import { supabase } from '../lib/supabase';

// Event queries
export const getAdminEvents = async () => {
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
  return { data, error };
};

export const getAdminEventById = async (id) => {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      ticket_types (*)
    `)
    .eq('id', id)
    .single();
  return { data, error };
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
  // 1. Update Event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .update(eventData)
    .eq('id', id)
    .select()
    .single();

  if (eventError) return { error: eventError };

  // 2. Update Ticket Types (for simplicity, replace existing ones or update if ID exists)
  // For standard admin, deleting and inserting or updating can be handled. Let's support upsert:
  if (ticketTypes.length > 0) {
    const preparedTickets = ticketTypes.map(t => ({
      ...t,
      event_id: id
    }));
    const { error: ticketError } = await supabase
      .from('ticket_types')
      .upsert(preparedTickets, { onConflict: 'id' });

    if (ticketError) return { error: ticketError };
  }

  return { data: event };
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
