import { supabase } from '../lib/supabase';

/**
 * Fetches all tickets for the currently authenticated user,
 * joined with related event information.
 * @param {string} userId - The authenticated user's UUID
 * @returns {{ data: Array, error: object|null }}
 */
export const getUserTickets = async (userId) => {
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

  return { data, error };
};

/**
 * Admins only: fetches all tickets in the system.
 */
export const getAllTicketsAdmin = async () => {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      events (
        id,
        event_name
      ),
      profiles (
        id,
        email,
        first_name,
        last_name
      )
    `)
    .order('created_at', { ascending: false });

  return { data, error };
};

