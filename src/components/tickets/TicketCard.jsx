import { motion } from 'framer-motion';
import { MapPin, Calendar, Clock } from 'lucide-react';
import TicketStatusBadge from './TicketStatusBadge';

const TicketCard = ({ ticket, onView }) => {
  const event = ticket.events;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(':');
    const d = new Date();
    d.setHours(+h, +m);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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
          <img
            src={event.event_image}
            alt={event.event_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ticket-burgundy/10 to-beige/30">
            <span className="font-playfair text-4xl text-ticket-burgundy/40 font-semibold select-none">
              {event?.event_name?.charAt(0) || 'T'}
            </span>
          </div>
        )}
      </div>

      {/* Center: Event details */}
      <div className="flex-1 p-5 flex flex-col justify-between gap-3 min-w-0">
        <div>
          <TicketStatusBadge status={ticket.status} />
          <h3 className="font-playfair text-xl text-ticket-charcoal font-semibold mt-2 truncate">
            {event?.event_name || 'Event'}
          </h3>
          {event?.category && (
            <span className="text-xs text-ticket-burgundy font-medium uppercase tracking-wider">
              {event.category}
            </span>
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
              <span className="truncate">
                {event.venue_name}
                {event.city ? `, ${event.city}` : ''}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-4 pt-1 border-t border-ticket-beige/40 text-xs text-ticket-charcoal/50 font-medium">
          <span>
            <span className="uppercase tracking-wide text-ticket-charcoal/30 mr-1">Type:</span>
            {ticket.ticket_type || 'General'}
          </span>
          <span>
            <span className="uppercase tracking-wide text-ticket-charcoal/30 mr-1">Qty:</span>
            {ticket.quantity || 1}
          </span>
          <span className="font-mono">
            <span className="uppercase tracking-wide text-ticket-charcoal/30 mr-1 font-sans">Ticket:</span>
            {ticket.ticket_number}
          </span>
        </div>
      </div>

      {/* Right: Action */}
      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center p-5 gap-3 shrink-0 border-t md:border-t-0 md:border-l border-ticket-beige/40">
        <button
          onClick={() => onView(ticket)}
          className="px-5 py-2 rounded-full text-sm font-medium bg-ticket-charcoal text-ticket-white hover:bg-ticket-charcoal/80 hover:shadow transition-all duration-300 whitespace-nowrap"
        >
          View Ticket
        </button>
      </div>
    </motion.div>
  );
};

export default TicketCard;
