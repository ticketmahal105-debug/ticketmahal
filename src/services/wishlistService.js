import { supabase } from '../lib/supabase.js';
import { dummyMovies } from '../data/dummyMovies.js';

// Helper to resolve an event by ID or slug from catalog and database
export const resolveEventDetails = async (eventId) => {
  if (!eventId) return null;

  // 1. Check local catalog dummyMovies first (covers canonical Ticket Mahal events)
  const movie = dummyMovies.find(m => m.id === eventId || m.slug === eventId);
  if (movie) {
    return {
      id: movie.id,
      slug: movie.slug,
      event_name: movie.title,
      title: movie.title,
      event_image: movie.image,
      image: movie.image,
      backdrop_image: movie.backdrop,
      venue_name: movie.venue,
      venue: movie.venue,
      city: movie.city || 'Dubai',
      event_date: movie.releaseDate,
      releaseDate: movie.releaseDate,
      start_time: '07:30 PM',
      end_time: '10:00 PM',
      category: movie.category || 'Movies',
      starting_price: Number(movie.startingPrice) || 120,
      startingPrice: Number(movie.startingPrice) || 120,
      currency: movie.currency || 'AED',
      badge: movie.badge || null,
      status: 'published'
    };
  }

  // 2. Query Supabase events table if available
  if (supabase) {
    try {
      const { data } = await supabase
        .from('events')
        .select('*')
        .or(`id.eq.${eventId},slug.eq.${eventId}`)
        .maybeSingle();

      if (data) {
        return {
          id: data.id,
          slug: data.slug || data.id,
          event_name: data.event_name || data.title,
          title: data.event_name || data.title,
          event_image: data.event_image || data.image,
          image: data.event_image || data.image,
          backdrop_image: data.backdrop_image,
          venue_name: data.venue_name || data.venue,
          venue: data.venue_name || data.venue,
          city: data.city || 'Dubai',
          event_date: data.event_date || data.releaseDate,
          releaseDate: data.event_date || data.releaseDate,
          start_time: data.start_time || '07:30 PM',
          end_time: data.end_time || '10:00 PM',
          category: data.category || 'Events',
          starting_price: Number(data.starting_price) || 120,
          startingPrice: Number(data.starting_price) || 120,
          currency: data.currency || 'AED',
          status: data.status || 'published'
        };
      }
    } catch (_) {}
  }

  // Fallback placeholder event object
  return {
    id: eventId,
    slug: eventId,
    event_name: 'Ticket Mahal Event',
    title: 'Ticket Mahal Event',
    event_image: 'https://res.cloudinary.com/tejjggbw/image/upload/1.png',
    venue_name: 'Ticket Mahal Main Stage',
    city: 'Dubai',
    event_date: 'Upcoming',
    starting_price: 120,
    category: 'Events',
    status: 'published'
  };
};

// Local storage key for offline and instant cache
const getLocalKey = (userId) => `tm_wishlist_${userId}`;
const memoryFallback = new Map();

const getLocalWishlist = (userId) => {
  if (!userId) return [];
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(getLocalKey(userId));
      return raw ? JSON.parse(raw) : [];
    }
  } catch {}
  return memoryFallback.get(getLocalKey(userId)) || [];
};

const setLocalWishlist = (userId, items) => {
  if (!userId) return;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(getLocalKey(userId), JSON.stringify(items));
    }
  } catch {}
  memoryFallback.set(getLocalKey(userId), items);
};

/**
 * Fetch full wishlist for a user (with enriched event metadata)
 */
export const getWishlist = async (userId) => {
  if (!userId) return { data: [], error: null };

  let records = [];
  let fetchError = null;

  // 1. Try Supabase query (try wishlists, then fallback to wishlist)
  if (supabase) {
    let res = await supabase
      .from('wishlists')
      .select('id, event_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (res.error && res.error.message?.includes('Could not find the table')) {
      res = await supabase
        .from('wishlist')
        .select('id, event_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    }

    if (!res.error && Array.isArray(res.data)) {
      records = res.data;
      // Sync to local cache
      setLocalWishlist(userId, records.map(r => r.event_id));
    } else {
      fetchError = res.error;
    }
  }

  // 2. Fallback to local cache if Supabase had an error or table not yet migrated
  if (records.length === 0 && fetchError) {
    const localIds = getLocalWishlist(userId);
    records = localIds.map(eventId => ({
      id: `local-${eventId}`,
      event_id: eventId,
      created_at: new Date().toISOString()
    }));
  }

  // 3. Enrich each wishlist entry with full event details
  const enriched = await Promise.all(
    records.map(async (row) => {
      const eventDetails = await resolveEventDetails(row.event_id);
      return {
        id: row.id,
        event_id: row.event_id,
        created_at: row.created_at,
        events: eventDetails,
        ...eventDetails
      };
    })
  );

  return { data: enriched, error: null };
};

/**
 * Fetch only the array of event_ids in the user's wishlist
 */
export const getWishlistEventIds = async (userId) => {
  if (!userId) return { data: [], error: null };

  if (supabase) {
    let res = await supabase
      .from('wishlists')
      .select('event_id')
      .eq('user_id', userId);

    if (res.error && res.error.message?.includes('Could not find the table')) {
      res = await supabase
        .from('wishlist')
        .select('event_id')
        .eq('user_id', userId);
    }

    if (!res.error && Array.isArray(res.data)) {
      const ids = res.data.map(r => r.event_id);
      setLocalWishlist(userId, ids);
      return { data: ids, error: null };
    }
  }

  // Fallback to local cache
  const localIds = getLocalWishlist(userId);
  return { data: localIds, error: null };
};

/**
 * Add an event to the customer's wishlist
 */
export const addToWishlist = async (userId, eventId) => {
  if (!userId || !eventId) {
    return { data: null, error: new Error('User ID and Event ID are required.') };
  }

  // Update local cache immediately
  const localIds = getLocalWishlist(userId);
  if (!localIds.includes(eventId)) {
    setLocalWishlist(userId, [eventId, ...localIds]);
  }

  if (supabase) {
    try {
      // Try wishlists first
      let res = await supabase
        .from('wishlists')
        .insert([{ user_id: userId, event_id: eventId }])
        .select()
        .maybeSingle();

      if (res.error && res.error.message?.includes('Could not find the table')) {
        res = await supabase
          .from('wishlist')
          .insert([{ user_id: userId, event_id: eventId }])
          .select()
          .maybeSingle();
      }

      // If duplicate (23505), ignore error and treat as success
      if (res.error && (res.error.code === '23505' || res.error.message?.includes('duplicate'))) {
        return { data: { user_id: userId, event_id: eventId }, error: null };
      }

      if (!res.error) {
        return { data: res.data, error: null };
      }
    } catch (_) {}
  }

  return { data: { user_id: userId, event_id: eventId }, error: null };
};

/**
 * Remove an event from the customer's wishlist
 */
export const removeFromWishlist = async (userId, eventId) => {
  if (!userId || !eventId) {
    return { error: new Error('User ID and Event ID are required.') };
  }

  // Update local cache
  const localIds = getLocalWishlist(userId);
  setLocalWishlist(userId, localIds.filter(id => id !== eventId));

  if (supabase) {
    try {
      let res = await supabase
        .from('wishlists')
        .delete()
        .match({ user_id: userId, event_id: eventId });

      if (res.error && res.error.message?.includes('Could not find the table')) {
        res = await supabase
          .from('wishlist')
          .delete()
          .match({ user_id: userId, event_id: eventId });
      }

      return { error: res.error };
    } catch (err) {
      return { error: err };
    }
  }

  return { error: null };
};

/**
 * Admin: Get aggregated wishlist statistics (Most wishlisted events, counts)
 * Strictly does not expose individual customers' private information.
 */
export const getWishlistAnalyticsAdmin = async () => {
  try {
    let records = [];
    if (supabase) {
      let res = await supabase.from('wishlists').select('event_id, created_at');
      if (res.error && res.error.message?.includes('Could not find the table')) {
        res = await supabase.from('wishlist').select('event_id, created_at');
      }
      if (res.data) records = res.data;
    }

    const countMap = {};
    for (const r of records) {
      if (r.event_id) {
        countMap[r.event_id] = (countMap[r.event_id] || 0) + 1;
      }
    }

    const aggregated = await Promise.all(
      Object.entries(countMap).map(async ([eventId, count]) => {
        const details = await resolveEventDetails(eventId);
        return {
          eventId,
          eventName: details?.event_name || details?.title || eventId,
          category: details?.category || 'Events',
          totalSaves: count
        };
      })
    );

    aggregated.sort((a, b) => b.totalSaves - a.totalSaves);
    return { data: aggregated, error: null };
  } catch (err) {
    return { data: [], error: err };
  }
};

