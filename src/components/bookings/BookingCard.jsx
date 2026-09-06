import { motion } from 'framer-motion';
import { MapPin, Calendar, Clock, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BookingStatusBadge from './BookingStatusBadge';
import PaymentStatusBadge from './PaymentStatusBadge';

const BookingCard = ({ booking }) => {
  const navigate = useNavigate();
  const event = booking.events;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(':');
    const d = new Date();
    d.setHours(+h, +m);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatBookingDate = (isoStr) => {
    if (!isoStr) return '—';
    return new Date(isoStr).toLocaleDateString('en-US', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const formatAmount = (amount, currency = 'AED') => {
    if (amount == null) return '—';
    return `${currency} ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      className="bg-ticket-white border border-ticket-beige/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col md:flex-row"
    >
      {/* Event Image */}
      <div className="w-full md:w-[200px] h-48 md:h-auto shrink-0 overflow-hidden bg-ticket-beige/30">
        {event?.event_image ? (
          <img src={event.event_image} alt={event.event_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ticket-burgundy/10 to-beige/30">
            <span className="font-playfair text-4xl text-ticket-burgundy/40 font-semibold select-none">
              {event?.event_name?.charAt(0) || 'T'}
            </span>
          </div>
        )}
      </div>

      {/* Center: Booking details */}
      <div className="flex-1 p-5 flex flex-col justify-between gap-3 min-w-0">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <BookingStatusBadge status={booking.booking_status} />
            <PaymentStatusBadge status={booking.payment_status} />
          </div>
          <h3 className="font-playfair text-xl text-ticket-charcoal font-semibold truncate">
            {event?.event_name || 'Event'}
          </h3>
          {event?.category && (
            <span className="text-xs text-ticket-burgundy font-medium uppercase tracking-wider">{event.category}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          {event?.event_date && (
            <div className="flex items-center gap-2 text-sm text-ticket-charcoal/60">
              <Calendar size={13} className="text-ticket-burgundy shrink-0" />
              <span>{formatDate(event.event_date)}</span>
              {event?.start_time && (
                <span className="flex items-center gap-1 ml-1">
                  <Clock size={13} className="text-ticket-burgundy" />
                  {formatTime(event.start_time)}
                </span>
              )}
            </div>
          )}
          {(event?.venue_name || event?.city) && (
            <div className="flex items-center gap-2 text-sm text-ticket-charcoal/60">
              <MapPin size={13} className="text-ticket-burgundy shrink-0" />
              <span className="truncate">{event.venue_name}{event.city ? `, ${event.city}` : ''}</span>
            </div>
          )}
          {booking.quantity && (
            <div className="flex items-center gap-2 text-sm text-ticket-charcoal/60">
              <Ticket size={13} className="text-ticket-burgundy shrink-0" />
              <span>{booking.quantity} Ticket{booking.quantity !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-4 pt-2 border-t border-ticket-beige/40 text-xs text-ticket-charcoal/50 font-medium">
          <span className="font-mono">
            <span className="uppercase tracking-wide text-ticket-charcoal/30 font-sans mr-1">Booking:</span>
            {booking.booking_number}
          </span>
          <span>
            <span className="uppercase tracking-wide text-ticket-charcoal/30 mr-1">Booked:</span>
            {formatBookingDate(booking.created_at)}
          </span>
        </div>
      </div>

      {/* Right: Total + Action */}
      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center p-5 gap-3 shrink-0 border-t md:border-t-0 md:border-l border-ticket-beige/40">
        <div className="text-right">
          <p className="text-xs text-ticket-charcoal/40 uppercase tracking-wide mb-0.5">Total</p>
          <p className="text-lg font-semibold text-ticket-charcoal font-playfair">
            {formatAmount(booking.total_amount, booking.currency)}
          </p>
        </div>
        <button
          onClick={() => navigate(`/bookings/${booking.booking_number}`)}
          className="px-5 py-2 rounded-full text-sm font-medium bg-ticket-charcoal text-ticket-white hover:bg-ticket-charcoal/80 hover:shadow transition-all duration-300 whitespace-nowrap"
        >
          View Booking
        </button>
      </div>
    </motion.div>
  );
};

export default BookingCard;
