import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';

const BookingEmptyState = ({ filter = 'all' }) => {
  const navigate = useNavigate();

  const messages = {
    all:       { heading: 'No bookings yet',          body: 'Your bookings will appear here once you reserve an experience.', showCTA: true },
    upcoming:  { heading: 'No upcoming bookings',     body: "You don't have any upcoming bookings right now.",                showCTA: true },
    completed: { heading: 'No completed bookings',    body: 'Bookings for past events will show up here.',                    showCTA: false },
    cancelled: { heading: 'No cancelled bookings',    body: "You haven't cancelled any bookings.",                            showCTA: false },
  };

  const content = messages[filter] || messages.all;

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
      <div className="w-16 h-16 rounded-full bg-champagne/10 border border-champagne/20 flex items-center justify-center mb-6">
        <Calendar size={28} className="text-champagne" strokeWidth={1.5} />
      </div>
      <h3 className="font-playfair text-2xl text-charcoal font-semibold mb-3">{content.heading}</h3>
      <p className="text-charcoal/50 text-sm max-w-xs leading-relaxed">{content.body}</p>
      {content.showCTA && (
        <button
          onClick={() => navigate('/')}
          className="mt-8 px-8 py-3 bg-charcoal text-white text-sm font-medium rounded-full hover:bg-charcoal/80 hover:shadow-lg transition-all duration-300"
        >
          Explore Events
        </button>
      )}
    </div>
  );
};

export default BookingEmptyState;
