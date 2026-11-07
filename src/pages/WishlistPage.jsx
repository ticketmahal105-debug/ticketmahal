import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { RefreshCw, Heart } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useWishlist } from '../hooks/useWishlist';
import { getWishlist } from '../services/wishlistService';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProfileSidebar from '../components/profile/ProfileSidebar';
import WishlistEventCard from '../components/wishlist/WishlistEventCard';
import WishlistEmptyState from '../components/wishlist/WishlistEmptyState';
import WishlistSkeleton from '../components/wishlist/WishlistSkeleton';
import UnifiedBookingModal from '../components/booking/UnifiedBookingModal';

const FILTERS = ['all', 'upcoming', 'past'];
const FILTER_LABELS = { all: 'All Events', upcoming: 'Upcoming', past: 'Past Events' };

const WishlistPage = () => {
  const { user } = useAuth();
  const { wishlistEventIds, refreshWishlist } = useWishlist();
  const [savedEvents, setSavedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  // Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedEventForBooking, setSelectedEventForBooking] = useState(null);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setSavedEvents([]);
      setLoading(false);
      return;
    }
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

  // Keep savedEvents synchronized with global wishlistEventIds set
  useEffect(() => {
    if (!loading && wishlistEventIds) {
      setSavedEvents(prev => prev.filter(item => wishlistEventIds.has(item.event_id)));
    }
  }, [wishlistEventIds, loading]);

  const handleOpenBooking = (event) => {
    if (!event) return;
    // Format event for UnifiedBookingModal
    const formattedMovie = {
      ...event,
      title: event.event_name || event.title,
      image: event.event_image || event.image,
      backdrop: event.backdrop_image || event.image || event.event_image,
      venue: event.venue_name || event.venue,
      city: event.city || 'Dubai',
      startingPrice: Number(event.starting_price || event.startingPrice || 120),
      currency: event.currency || 'AED',
      releaseDate: event.event_date || event.releaseDate,
    };
    setSelectedEventForBooking(formattedMovie);
    setIsBookingOpen(true);
  };

  const getFilteredEvents = () => {
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        return savedEvents.filter(item => {
          const dateStr = item.events?.event_date || item.events?.releaseDate;
          if (!dateStr) return true;
          const d = new Date(dateStr);
          return isNaN(d.getTime()) || d >= now;
        });
        
      case 'past':
        return savedEvents.filter(item => {
          const dateStr = item.events?.event_date || item.events?.releaseDate;
          if (!dateStr) return false;
          const d = new Date(dateStr);
          return !isNaN(d.getTime()) && d < now;
        });

      default:
        return savedEvents;
    }
  };

  const filteredEvents = getFilteredEvents();

  return (
    <div className="bg-[#FAF7F2] min-h-screen selection:bg-ticket-burgundy/30 selection:text-charcoal pt-32 px-4 sm:px-6 pb-24 font-sans text-ticket-charcoal">
      <Navbar />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="font-playfair text-3xl md:text-4xl text-ticket-charcoal font-semibold tracking-wide">
              My Wishlist
            </h1>
            {!loading && !error && savedEvents.length > 0 && (
              <span className="px-3 py-1 bg-[#7A1F2B]/10 text-[#7A1F2B] rounded-full text-xs font-semibold border border-[#7A1F2B]/20">
                {savedEvents.length} {savedEvents.length === 1 ? 'event' : 'events'}
              </span>
            )}
          </div>
          <p className="text-ticket-charcoal/60 mt-2 text-sm sm:text-base">
            Your saved events, shows, and experiences, all in one place.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Sidebar */}
          <div className="w-full md:w-[280px] shrink-0">
            <div className="bg-ticket-white border border-ticket-beige/70 rounded-3xl p-4 shadow-sm sticky top-32">
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
                    className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
                      filter === f
                        ? 'bg-[#7A1F2B] text-white shadow-md'
                        : 'bg-ticket-white text-ticket-charcoal/70 border border-ticket-beige/80 hover:bg-ticket-ivory hover:text-ticket-charcoal'
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
                <button
                  onClick={() => {
                    fetchWishlist();
                    refreshWishlist?.();
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-ticket-charcoal text-white rounded-full text-xs font-semibold hover:bg-ticket-charcoal/90 transition-colors shadow-sm"
                >
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
                    <WishlistEventCard
                      key={item.id || item.event_id}
                      event={item.events}
                      onSelectTickets={handleOpenBooking}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Reused Unified Booking Modal */}
      {selectedEventForBooking && (
        <UnifiedBookingModal
          isOpen={isBookingOpen}
          onClose={() => {
            setIsBookingOpen(false);
            setSelectedEventForBooking(null);
          }}
          movie={selectedEventForBooking}
          selectedShowtime={selectedEventForBooking?.start_time || '07:30 PM'}
          user={user}
        />
      )}

      <Footer />
    </div>
  );
};

export default WishlistPage;
