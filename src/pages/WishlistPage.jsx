import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getWishlist } from '../services/wishlistService';
import Navbar from '../components/Navbar';
import ProfileSidebar from '../components/profile/ProfileSidebar';
import WishlistEventCard from '../components/wishlist/WishlistEventCard';
import WishlistEmptyState from '../components/wishlist/WishlistEmptyState';
import WishlistSkeleton from '../components/wishlist/WishlistSkeleton';

const FILTERS = ['all', 'upcoming', 'past'];
const FILTER_LABELS = { all: 'All', upcoming: 'Upcoming', past: 'Past' };

const WishlistPage = () => {
  const { user } = useAuth();
  const [savedEvents, setSavedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchWishlist = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await getWishlist(user.id);
      if (fetchError) throw fetchError;
      setSavedEvents(data || []);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      setError("We couldn't load your wishlist. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // Remove item from local state if it was un-wishlisted
  const handleRemoveLocal = (eventId) => {
    setSavedEvents(prev => prev.filter(item => item.event_id !== eventId));
  };

  const getFilteredEvents = () => {
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        return savedEvents.filter(item => {
          if (!item.events?.event_date) return false;
          return new Date(item.events.event_date) >= now;
        }).sort((a, b) => new Date(a.events?.event_date) - new Date(b.events?.event_date));
        
      case 'past':
        return savedEvents.filter(item => {
          if (!item.events?.event_date) return false;
          return new Date(item.events.event_date) < now;
        });

      default:
        return savedEvents;
    }
  };

  const filteredEvents = getFilteredEvents();

  return (
    <div className="bg-premium-noise min-h-screen selection:bg-ticket-burgundy/30 selection:text-charcoal pt-32 px-6 pb-24 font-sans">
      <Navbar />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-playfair text-3xl md:text-4xl text-ticket-charcoal font-semibold tracking-wide">Wishlist</h1>
          <p className="text-ticket-charcoal/60 mt-2">
            Your saved events and experiences, all in one place.
            {!loading && !error && savedEvents.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-ticket-burgundy/10 text-ticket-burgundy rounded-full text-xs font-medium border border-ticket-gold/20">
                {savedEvents.length} saved
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-[280px] shrink-0">
            <div className="bg-ticket-white border border-ticket-beige rounded-3xl p-4 shadow-sm sticky top-32">
              <ProfileSidebar />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            
            {/* Filters */}
            {savedEvents.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-8">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      filter === f
                        ? 'bg-ticket-burgundy/10 text-ticket-burgundy border border-ticket-gold/25 shadow-sm'
                        : 'bg-ticket-white text-ticket-charcoal/60 border border-ticket-beige hover:bg-ivory hover:text-ticket-charcoal'
                    }`}
                  >
                    {FILTER_LABELS[f]}
                  </button>
                ))}
              </div>
            )}

            {/* List */}
            {loading ? (
              <WishlistSkeleton />
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-ticket-white border border-ticket-beige/60 rounded-3xl shadow-sm">
                <p className="text-ticket-charcoal/60">{error}</p>
                <button onClick={fetchWishlist} className="flex items-center gap-2 px-5 py-2.5 border border-ticket-beige rounded-full text-sm font-medium text-ticket-charcoal hover:bg-ivory transition-colors">
                  <RefreshCw size={14} /> Try Again
                </button>
              </div>
            ) : savedEvents.length === 0 ? (
              <WishlistEmptyState filter="all" />
            ) : filteredEvents.length === 0 ? (
              <WishlistEmptyState filter={filter} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredEvents.map((item) => (
                    <div key={item.id} onClick={() => handleRemoveLocal(item.event_id)}>
                      {/* Using a wrapper to easily intercept removal and update local state without full refetch */}
                      <WishlistEventCard event={item.events} />
                    </div>
                  ))}
                </AnimatePresence>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;
