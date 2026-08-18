import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getUserTickets } from '../services/ticketsService';
import Navbar from '../components/Navbar';
import ProfileSidebar from '../components/profile/ProfileSidebar';
import TicketCard from '../components/tickets/TicketCard';
import TicketDetailsModal from '../components/tickets/TicketDetailsModal';
import TicketsEmptyState from '../components/tickets/TicketsEmptyState';
import TicketsSkeleton from '../components/tickets/TicketsSkeleton';

const FILTERS = ['all', 'upcoming', 'past', 'cancelled'];

const MyTicketsPage = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchTickets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await getUserTickets(user.id);
      if (fetchError) throw fetchError;
      setTickets(data || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('We couldn\'t load your tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedTicket(null);
    };
    if (selectedTicket) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedTicket]);

  const getFilteredTickets = () => {
    const now = new Date();
    switch (filter) {
      case 'upcoming':
        return tickets.filter((t) => {
          if (t.status !== 'active') return false;
          const eventDate = t.events?.event_date;
          if (!eventDate) return false;
          return new Date(eventDate) >= now;
        }).sort((a, b) => new Date(a.events?.event_date) - new Date(b.events?.event_date));

      case 'past':
        return tickets.filter((t) => {
          if (t.status === 'cancelled') return false;
          const eventDate = t.events?.event_date;
          if (!eventDate) return t.status === 'used' || t.status === 'expired';
          return new Date(eventDate) < now || t.status === 'used' || t.status === 'expired';
        }).sort((a, b) => new Date(b.events?.event_date) - new Date(a.events?.event_date));

      case 'cancelled':
        return tickets.filter((t) => t.status === 'cancelled');

      default:
        return tickets;
    }
  };

  const filteredTickets = getFilteredTickets();

  const FILTER_LABELS = {
    all: 'All',
    upcoming: 'Upcoming',
    past: 'Past',
    cancelled: 'Cancelled',
  };

  return (
    <div className="bg-premium-noise min-h-screen selection:bg-champagne/30 selection:text-charcoal pt-32 px-6 pb-24 font-sans">
      <Navbar />

      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-playfair text-3xl md:text-4xl text-charcoal font-semibold tracking-wide">
            My Tickets
          </h1>
          <p className="text-charcoal/60 mt-2">View and manage your event tickets.</p>
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
            {/* Filter Pills */}
            <div className="flex gap-2 flex-wrap mb-6">
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

            {/* Content Area */}
            {loading ? (
              <TicketsSkeleton />
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <p className="text-charcoal/60">{error}</p>
                <button
                  onClick={fetchTickets}
                  className="flex items-center gap-2 px-5 py-2.5 border border-beige rounded-full text-sm font-medium text-charcoal hover:bg-ivory transition-colors"
                >
                  <RefreshCw size={14} />
                  Try Again
                </button>
              </div>
            ) : filteredTickets.length === 0 ? (
              <TicketsEmptyState filter={tickets.length === 0 ? 'all' : filter} />
            ) : (
              <div className="flex flex-col gap-4">
                {filteredTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onView={(t) => setSelectedTicket(t)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Details Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <TicketDetailsModal
            ticket={selectedTicket}
            user={user}
            onClose={() => setSelectedTicket(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyTicketsPage;
