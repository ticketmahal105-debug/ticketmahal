import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WishlistEmptyState = ({ filter = 'all' }) => {
  const navigate = useNavigate();

  const messages = {
    all: {
      heading: 'Your Wishlist Is Waiting',
      body: "Save the events you love, and they'll be right here whenever you're ready.",
      showCTA: true,
    },
    upcoming: {
      heading: 'No upcoming saved events',
      body: 'You have no upcoming events in your wishlist.',
      showCTA: true,
    },
    past: {
      heading: 'No past saved events',
      body: 'Events you saved that have already occurred will appear here.',
      showCTA: false,
    },
  };

  const content = messages[filter] || messages.all;

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6 bg-ticket-white/70 border border-ticket-beige/60 rounded-3xl shadow-sm backdrop-blur-sm">
      <div className="w-20 h-20 rounded-full bg-ticket-burgundy/5 border border-ticket-burgundy/10 flex items-center justify-center mb-6 shadow-inner">
        <Heart size={36} className="text-ticket-burgundy" strokeWidth={1.5} />
      </div>

      <h3 className="font-playfair text-2xl md:text-3xl text-ticket-charcoal font-semibold mb-3 tracking-tight">
        {content.heading}
      </h3>
      <p className="text-ticket-charcoal/60 text-sm md:text-base max-w-md leading-relaxed mb-8">
        {content.body}
      </p>

      {content.showCTA && (
        <button
          onClick={() => navigate('/')}
          className="px-8 py-3.5 bg-ticket-burgundy text-ticket-white text-xs tracking-wider uppercase font-semibold rounded-full hover:bg-ticket-burgundy/90 shadow-[0_4px_14px_rgba(122,31,43,0.25)] hover:shadow-[0_6px_20px_rgba(122,31,43,0.35)] hover:-translate-y-0.5 transition-all duration-300"
        >
          EXPLORE EVENTS
        </button>
      )}
    </div>
  );
};

export default WishlistEmptyState;
