import { supabase } from '../lib/supabase';

export const getWishlist = async (userId) => {
  const { data, error } = await supabase
    .from('wishlist')
    .select(`
      id,
      event_id,
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

export const getWishlistEventIds = async (userId) => {
  const { data, error } = await supabase
    .from('wishlist')
    .select('event_id')
    .eq('user_id', userId);

  return { data: data?.map((row) => row.event_id) || [], error };
};

export const addToWishlist = async (userId, eventId) => {
  const { data, error } = await supabase
    .from('wishlist')
    .insert([{ user_id: userId, event_id: eventId }])
    .select()
    .single();

  return { data, error };
};

export const removeFromWishlist = async (userId, eventId) => {
  const { error } = await supabase
    .from('wishlist')
    .delete()
    .match({ user_id: userId, event_id: eventId });

  return { error };
};
