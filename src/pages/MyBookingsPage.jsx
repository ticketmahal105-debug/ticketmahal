import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getUserBookings } from '../services/bookingsService';
import Navbar from '../components/Navbar';
import ProfileSidebar from '../components/profile/ProfileSidebar';
import BookingCard from '../components/bookings/BookingCard';
import BookingEmptyState from '../components/bookings/BookingEmptyState';
import BookingSkeleton from '../components/bookings/BookingSkeleton';

const FILTERS = ['all', 'upcoming', 'completed', 'cancelled'];
const FILTER_LABELS = { all: 'All', upcoming: 'Upcoming', completed: 'Completed', cancelled: 'Cancelled' };

const MyBookingsPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await getUserBookings(user.id);
      if (fetchError) throw fetchError;
      setBookings(data || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('We couldn\'t load your bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const getFilteredBookings = () => {
    const now = new Date();
    
    // First apply text search
    let filtered = bookings;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.booking_number?.toLowerCase().includes(q) ||
        b.events?.event_name?.toLowerCase().includes(q) ||
        b.events?.venue_name?.toLowerCase().includes(q)
      );
    }

    // Then apply status/time filter
    switch (filter) {
      case 'upcoming':
        return filtered.filter(b => {
          if (b.booking_status !== 'confirmed') return false;
          if (!b.events?.event_date) return false;
          return new Date(b.events.event_date) >= now;
        }).sort((a, b) => new Date(a.events?.event_date) - new Date(b.events?.event_date));
        
      case 'completed':
        return filtered.filter(b => {
          if (b.booking_status === 'completed') return true;
          if (b.booking_status === 'cancelled' || b.booking_status === 'refunded') return false;
          if (!b.events?.event_date) return false;
          return new Date(b.events.event_date) < now;
        });

      case 'cancelled':
        return filtered.filter(b => b.booking_status === 'cancelled' || b.booking_status === 'refunded');

      default:
        return filtered;
    }
  };

  const filteredBookings = getFilteredBookings();

  return (
    <div className="bg-premium-noise min-h-screen selection:bg-champagne/30 selection:text-charcoal pt-32 px-6 pb-24 font-sans">
      <Navbar />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-playfair text-3xl md:text-4xl text-charcoal font-semibold tracking-wide">My Bookings</h1>
          <p className="text-charcoal/60 mt-2">View and manage your Ticket Mahal bookings.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-[280px] shrink-0">
            <div className="bg-white border border-beige rounded-3xl p-4 shadow-sm sticky top-32">
              <ProfileSidebar />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            
            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex gap-2 flex-wrap">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      filter === f
                        ? 'bg-champagne/10 text-champagne border border-champagne/25'
                        : 'bg-white text-charcoal/60 border border-beige hover:bg-ivory hover:text-charcoal'
                    }`}
                  >
                    {FILTER_LABELS[f]}
                  </button>
                ))}
              </div>
              
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40" />
                <input 
                  type="text" 
                  placeholder="Search bookings..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-beige rounded-full text-sm outline-none focus:border-champagne focus:ring-1 focus:ring-champagne/30 transition-all placeholder:text-charcoal/30"
                />
              </div>
            </div>

            {/* List */}
            {loading ? (
              <BookingSkeleton />
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <p className="text-charcoal/60">{error}</p>
                <button onClick={fetchBookings} className="flex items-center gap-2 px-5 py-2.5 border border-beige rounded-full text-sm font-medium text-charcoal hover:bg-ivory transition-colors">
                  <RefreshCw size={14} /> Try Again
                </button>
              </div>
            ) : filteredBookings.length === 0 ? (
              <BookingEmptyState filter={bookings.length === 0 && !searchQuery ? 'all' : filter} />
            ) : (
              <div className="flex flex-col gap-4">
                {filteredBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default MyBookingsPage;
