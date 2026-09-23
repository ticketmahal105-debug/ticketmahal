import { motion } from 'framer-motion';
import { MapPin, Calendar, Clock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../../hooks/useWishlist';

const WishlistEventCard = ({ event }) => {
  const navigate = useNavigate();
  const { toggleWishlist } = useWishlist();

  const handleRemove = async (e) => {
    e.stopPropagation();
    await toggleWishlist(event.id);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(':');
    const d = new Date(); d.setHours(+h, +m);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      onClick={() => navigate(`/events/${event.id}`)} // Or whatever the event route is
      className="bg-ticket-white border border-ticket-beige/60 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col group relative"
    >
      {/* Remove Button */}
      <button
        onClick={handleRemove}
        className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-ticket-beige flex items-center justify-center text-ticket-charcoal/40 hover:text-red-500 hover:bg-white transition-all opacity-0 group-hover:opacity-100 shadow-sm"
        aria-label="Remove from wishlist"
      >
        <X size={16} />
      </button>

      <div className="relative aspect-[3/4] w-full bg-neutral-900 overflow-hidden shrink-0">
        {event.event_image ? (
          <>
            <img src={event.event_image} alt="" className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-40 pointer-events-none select-none" />
            <img src={event.event_image} alt={event.event_name} className="relative z-0 w-full h-full object-contain group-hover:scale-105 transition-transform duration-700" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ticket-burgundy/10 to-beige/30">
            <span className="font-playfair text-4xl text-ticket-burgundy/40 font-semibold select-none">{event.event_name?.charAt(0)}</span>
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {event.category && (
            <span className="text-xs text-ticket-burgundy font-medium uppercase tracking-wider mb-2 block">
              {event.category}
            </span>
          )}
          <h3 className="font-playfair text-xl text-ticket-charcoal font-semibold mb-3 line-clamp-2">
            {event.event_name}
          </h3>
          <div className="flex flex-col gap-2 text-sm text-ticket-charcoal/60">
            {event.event_date && (
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-ticket-burgundy shrink-0" />
                <span>{formatDate(event.event_date)}</span>
                {event.start_time && (
                  <span className="flex items-center gap-1 ml-1">
                    <Clock size={14} className="text-ticket-burgundy shrink-0" />
                    {formatTime(event.start_time)}
                  </span>
                )}
              </div>
            )}
            {(event.venue_name || event.city) && (
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-ticket-burgundy shrink-0" />
                <span className="truncate">{event.venue_name}{event.city ? `, ${event.city}` : ''}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-ticket-beige/40 flex items-center justify-between">
          {/* Mock price, replace with real if available */}
          <span className="text-lg font-semibold text-ticket-charcoal font-playfair">
             Starting from AED 150
          </span>
          <span className="text-sm font-medium text-ticket-burgundy group-hover:text-ticket-charcoal transition-colors">
            View Event →
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default WishlistEventCard;
