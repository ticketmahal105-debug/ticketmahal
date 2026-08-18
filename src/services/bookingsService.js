import { supabase } from '../lib/supabase';

/**
 * Fetches all bookings for the authenticated user, joined with event data.
 * @param {string} userId
 */
export const getUserBookings = async (userId) => {
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

  return { data, error };
};

/**
 * Fetches a single booking by booking_number for the authenticated user.
 * @param {string} bookingNumber
 * @param {string} userId
 */
export const getBookingByNumber = async (bookingNumber, userId) => {
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
    .eq('user_id', userId)
    .single();

  return { data, error };
};

/**
 * Fetches all tickets related to a specific booking.
 * @param {string} bookingId
 */
export const getBookingTickets = async (bookingId) => {
  const { data, error } = await supabase
    .from('tickets')
    .select('id, ticket_number, ticket_type, status, quantity')
    .eq('booking_id', bookingId);

  return { data, error };
};

/**
 * Admins only: fetches all bookings in the system.
 */
export const getAllBookingsAdmin = async () => {
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

  return { data, error };
};

/**
 * Admins only: fetches single booking details.
 */
export const getAdminBookingDetails = async (bookingNumber) => {
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
    .single();

  return { data, error };
};

