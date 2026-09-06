import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WishlistEmptyState = ({ filter = 'all' }) => {
  const navigate = useNavigate();

  const messages = {
    all: {
      heading: 'Your wishlist is empty',
      body: 'Save events you love and find them here anytime.',
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
    <div className="flex flex-col items-center justify-center text-center py-24 px-6 bg-ticket-white border border-ticket-beige/60 rounded-3xl shadow-sm">
      <div className="w-20 h-20 rounded-full bg-ticket-burgundy/10 border border-ticket-gold/20 flex items-center justify-center mb-6">
        <Heart size={32} className="text-ticket-burgundy" strokeWidth={1.5} />
      </div>

      <h3 className="font-playfair text-2xl text-ticket-charcoal font-semibold mb-3">
        {content.heading}
      </h3>
      <p className="text-ticket-charcoal/50 text-sm max-w-sm leading-relaxed mb-8">
        {content.body}
      </p>

      {content.showCTA && (
        <button
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-ticket-charcoal text-ticket-white text-sm font-medium rounded-full hover:bg-ticket-charcoal/80 hover:shadow-lg transition-all duration-300"
        >
          Explore Events
        </button>
      )}
    </div>
  );
};

export default WishlistEmptyState;
