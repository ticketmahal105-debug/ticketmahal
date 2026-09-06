import { Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TicketsEmptyState = ({ filter = 'all' }) => {
  const navigate = useNavigate();

  const messages = {
    all: {
      heading: 'No tickets yet',
      body: 'Your tickets will appear here once you book an experience.',
      showCTA: true,
    },
    upcoming: {
      heading: 'No upcoming tickets',
      body: "You don't have any upcoming events. Explore what's on.",
      showCTA: true,
    },
    past: {
      heading: 'No past tickets',
      body: 'Tickets for events you have attended will appear here.',
      showCTA: false,
    },
    cancelled: {
      heading: 'No cancelled tickets',
      body: "You haven't cancelled any tickets.",
      showCTA: false,
    },
  };

  const content = messages[filter] || messages.all;

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
      <div className="w-16 h-16 rounded-full bg-ticket-burgundy/10 border border-ticket-gold/20 flex items-center justify-center mb-6">
        <Ticket size={28} className="text-ticket-burgundy" strokeWidth={1.5} />
      </div>

      <h3 className="font-playfair text-2xl text-ticket-charcoal font-semibold mb-3">
        {content.heading}
      </h3>
      <p className="text-ticket-charcoal/50 text-sm max-w-xs leading-relaxed">
        {content.body}
      </p>

      {content.showCTA && (
        <button
          onClick={() => navigate('/')}
          className="mt-8 px-8 py-3 bg-ticket-charcoal text-ticket-white text-sm font-medium rounded-full hover:bg-ticket-charcoal/80 hover:shadow-lg transition-all duration-300"
        >
          Explore Events
        </button>
      )}
    </div>
  );
};

export default TicketsEmptyState;
