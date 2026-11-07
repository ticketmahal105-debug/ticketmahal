import { motion } from 'framer-motion';
import { MapPin, Calendar, Clock, Heart, ArrowRight, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../../hooks/useWishlist';

const WishlistEventCard = ({ event, onSelectTickets }) => {
  const navigate = useNavigate();
  const { toggleWishlist, isWishlisted } = useWishlist();

  if (!event) return null;

  const eventId = event.id;
  const isSaved = isWishlisted(eventId);

  const handleHeartClick = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    await toggleWishlist(eventId);
  };

  const handleViewDetails = (e) => {
    e.stopPropagation();
    navigate(`/events/${event.slug || event.id}`);
  };

  const handleBookTickets = (e) => {
    e.stopPropagation();
    if (isUnavailable) return;
    if (onSelectTickets) {
      onSelectTickets(event);
    } else {
      navigate(`/events/${event.slug || event.id}`);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return null;
    if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
    const [h, m] = timeStr.split(':');
    if (!h) return timeStr;
    const d = new Date();
    d.setHours(+h, +m || 0);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Status handling
  const status = (event.status || 'published').toLowerCase();
  const isSoldOut = status === 'sold_out' || status === 'soldout';
  const isCancelled = status === 'cancelled';
  const isCompleted = status === 'completed';
  const isUnavailable = isSoldOut || isCancelled || isCompleted;

  const getStatusBadge = () => {
    if (isCancelled) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
          Cancelled
        </span>
      );
    }
    if (isSoldOut) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-charcoal/80 text-white border border-charcoal">
          Sold Out
        </span>
      );
    }
    if (isCompleted) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
          Ended
        </span>
      );
    }
    if (event.badge) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-ticket-gold/15 text-ticket-burgundy border border-ticket-gold/30">
          {event.badge}
        </span>
      );
    }
    return null;
  };

  const eventImage = event.event_image || event.image;
  const eventName = event.event_name || event.title || 'Untitled Event';
  const startingPrice = Number(event.starting_price || event.startingPrice || 120);
  const currency = event.currency || 'AED';
  const eventDate = event.event_date || event.releaseDate;
  const venueDisplay = [event.venue_name || event.venue, event.city].filter(Boolean).join(', ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      whileHover={{ y: -4 }}
      onClick={handleViewDetails}
      className="group relative flex flex-col bg-ticket-white border border-ticket-beige/70 hover:border-ticket-gold/50 rounded-[24px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
    >
      {/* Poster Container (un-cropped with elegant ambient background) */}
      <div className="relative aspect-[3/4] w-full bg-[#1A1A1A] overflow-hidden shrink-0 flex items-center justify-center">
        {eventImage ? (
          <>
            {/* Ambient subtle blur glow behind uncropped poster */}
            <img
              src={eventImage}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-30 scale-110 pointer-events-none select-none"
            />
            {/* Uncropped full image */}
            <img
              src={eventImage}
              alt={eventName}
              className="relative z-0 max-h-full max-w-full w-auto h-full object-contain group-hover:scale-[1.02] transition-transform duration-500 ease-out"
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ticket-burgundy/15 to-ticket-beige/40">
            <span className="font-playfair text-4xl text-ticket-burgundy/40 font-bold select-none">
              {eventName.charAt(0)}
            </span>
          </div>
        )}

        {/* Top Badges: Status (Left) & Filled Heart (Right) */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10 pointer-events-none">
          <div className="pointer-events-auto">
            {getStatusBadge()}
          </div>

          {/* Heart Button */}
          <button
            type="button"
            onClick={handleHeartClick}
            aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
            className="pointer-events-auto w-9 h-9 rounded-full bg-white/90 backdrop-blur-md border border-ticket-beige/80 flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all duration-200"
          >
            <Heart
              size={18}
              className={`transition-colors duration-200 ${
                isSaved
                  ? 'fill-[#7A1F2B] text-[#7A1F2B]'
                  : 'text-ticket-charcoal/50 hover:text-[#7A1F2B]'
              }`}
              strokeWidth={isSaved ? 0 : 2}
            />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between bg-ticket-white">
        <div>
          {/* Category */}
          {event.category && (
            <span className="text-[11px] font-semibold tracking-wider text-ticket-burgundy uppercase block mb-1.5">
              {event.category}
            </span>
          )}

          {/* Title */}
          <h3 className="font-playfair text-lg sm:text-xl font-semibold text-ticket-charcoal line-clamp-2 leading-snug mb-3 group-hover:text-ticket-burgundy transition-colors">
            {eventName}
          </h3>

          {/* Date & Time */}
          <div className="flex flex-col gap-1.5 text-xs text-ticket-charcoal/70 mb-2">
            {eventDate && (
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-ticket-burgundy shrink-0" />
                <span className="font-medium">{formatDate(eventDate)}</span>
                {event.start_time && (
                  <span className="flex items-center gap-1 text-ticket-charcoal/50">
                    • <Clock size={12} className="shrink-0" /> {formatTime(event.start_time)}
                  </span>
                )}
              </div>
            )}

            {/* Venue */}
            {venueDisplay && (
              <div className="flex items-center gap-2">
                <MapPin size={13} className="text-ticket-burgundy shrink-0" />
                <span className="truncate">{venueDisplay}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer: Starting Price & Dual Actions (View Details & Select Tickets) */}
        <div className="mt-4 pt-4 border-t border-ticket-beige/50 flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] uppercase tracking-wider text-ticket-charcoal/50 font-medium">
              Starting from
            </span>
            <span className="text-base font-semibold text-ticket-charcoal font-playfair">
              {currency} {startingPrice.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleViewDetails}
              className="w-full py-2.5 px-3 rounded-full text-xs font-semibold border border-ticket-charcoal/20 text-ticket-charcoal hover:bg-ticket-ivory hover:border-ticket-gold/60 transition-all duration-200 flex items-center justify-center gap-1"
            >
              <span>View Details</span>
              <ArrowRight size={12} />
            </button>

            <button
              type="button"
              onClick={handleBookTickets}
              disabled={isUnavailable}
              className={`w-full py-2.5 px-3 rounded-full text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1 shadow-sm ${
                isUnavailable
                  ? 'bg-ticket-charcoal/10 text-ticket-charcoal/40 cursor-not-allowed border border-ticket-beige'
                  : 'bg-ticket-burgundy text-ticket-white hover:bg-ticket-burgundy/90 hover:shadow-md active:scale-98'
              }`}
            >
              <Ticket size={12} />
              <span>{isUnavailable ? 'Unavailable' : 'Select Tickets'}</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WishlistEventCard;
