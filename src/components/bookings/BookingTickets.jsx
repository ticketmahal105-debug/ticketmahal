import { Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BookingTickets = ({ tickets, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-white border border-beige rounded-2xl p-5 shadow-sm animate-pulse">
        <div className="h-5 w-32 bg-beige/40 rounded mb-4" />
        {[1, 2].map((i) => (
          <div key={i} className="h-12 bg-beige/20 rounded-xl mb-2" />
        ))}
      </div>
    );
  }

  if (!tickets || tickets.length === 0) {
    return (
      <div className="bg-white border border-beige rounded-2xl p-5 shadow-sm">
        <h4 className="font-playfair text-lg text-charcoal font-semibold mb-3">Your Tickets</h4>
        <p className="text-sm text-charcoal/50">No tickets have been issued for this booking yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-beige rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-playfair text-lg text-charcoal font-semibold">Your Tickets</h4>
        <button
          onClick={() => navigate('/my-tickets')}
          className="text-xs font-medium text-champagne hover:text-charcoal transition-colors"
        >
          View All Tickets →
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="flex items-center justify-between px-4 py-3 bg-ivory border border-beige/40 rounded-xl text-sm"
          >
            <div className="flex items-center gap-3">
              <Ticket size={14} className="text-champagne" />
              <span className="font-mono text-charcoal/80">{ticket.ticket_number}</span>
            </div>
            <div className="flex items-center gap-3 text-charcoal/50">
              <span>{ticket.ticket_type || 'General'}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${
                  ticket.status === 'active'
                    ? 'bg-champagne/10 text-champagne border border-champagne/20'
                    : 'bg-beige/60 text-charcoal/40 border border-beige'
                }`}
              >
                {ticket.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookingTickets;
