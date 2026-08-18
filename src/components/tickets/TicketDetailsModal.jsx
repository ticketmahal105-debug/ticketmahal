import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Calendar, Clock, User, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const TicketDetailsModal = ({ ticket, user, onClose }) => {
  if (!ticket) return null;

  const event = ticket.events;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    const [h, m] = timeStr.split(':');
    const d = new Date();
    d.setHours(+h, +m);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getFullName = () => {
    const first = user?.user_metadata?.first_name || '';
    const last = user?.user_metadata?.last_name || '';
    return `${first} ${last}`.trim() || user?.email?.split('@')[0] || 'Guest';
  };

  const isCancelled = ticket.status === 'cancelled';

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label={`Ticket details for ${event?.event_name}`}
      >
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md bg-ivory rounded-3xl overflow-hidden shadow-2xl border border-beige/40"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close ticket modal"
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 border border-beige/40 flex items-center justify-center text-charcoal/50 hover:text-charcoal hover:bg-white transition-all"
          >
            <X size={16} />
          </button>

          {/* Event Image Header */}
          <div className="relative h-44 w-full overflow-hidden bg-beige/30">
            {event?.event_image ? (
              <img
                src={event.event_image}
                alt={event.event_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-champagne/20 to-beige/30">
                <span className="font-playfair text-3xl text-champagne/50 font-semibold">
                  {event?.event_name?.charAt(0) || 'T'}
                </span>
              </div>
            )}
            {/* Cancelled overlay */}
            {isCancelled && (
              <div className="absolute inset-0 bg-charcoal/50 flex items-center justify-center">
                <span className="text-white font-semibold text-xl tracking-wider uppercase border-2 border-white/50 px-4 py-2 rounded-lg">
                  Cancelled
                </span>
              </div>
            )}
          </div>

          {/* Ticket body */}
          <div className="px-6 pt-5 pb-6 flex flex-col gap-5">
            {/* Event title */}
            <div>
              <h2 className="font-playfair text-2xl font-semibold text-charcoal">
                {event?.event_name || 'Event'}
              </h2>
              {event?.category && (
                <span className="text-xs font-medium text-champagne uppercase tracking-wider">
                  {event.category}
                </span>
              )}
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 text-sm text-charcoal/70">
                <Calendar size={15} className="text-champagne shrink-0" />
                <span>{formatDate(event?.event_date)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-charcoal/70">
                <Clock size={15} className="text-champagne shrink-0" />
                <span>
                  {formatTime(event?.start_time)}
                  {event?.end_time ? ` – ${formatTime(event.end_time)}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-charcoal/70">
                <MapPin size={15} className="text-champagne shrink-0" />
                <span>
                  {event?.venue_name || '—'}
                  {event?.city ? `, ${event.city}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-charcoal/70">
                <User size={15} className="text-champagne shrink-0" />
                <span>{getFullName()}</span>
              </div>
            </div>

            {/* Divider — tear effect */}
            <div className="relative flex items-center gap-0 my-1">
              <div className="w-5 h-5 rounded-full bg-ivory border border-beige absolute -left-8" />
              <div className="flex-1 border-t border-dashed border-beige" />
              <div className="w-5 h-5 rounded-full bg-ivory border border-beige absolute -right-8" />
            </div>

            {/* Ticket meta */}
            <div className="flex justify-between text-xs text-charcoal/50 font-medium">
              <div>
                <p className="uppercase tracking-wider mb-0.5 text-charcoal/30">Type</p>
                <p className="text-charcoal font-semibold">{ticket.ticket_type || 'General'}</p>
              </div>
              <div>
                <p className="uppercase tracking-wider mb-0.5 text-charcoal/30">Qty</p>
                <p className="text-charcoal font-semibold">{ticket.quantity || 1}</p>
              </div>
              <div className="text-right">
                <p className="uppercase tracking-wider mb-0.5 text-charcoal/30">Ticket No.</p>
                <p className="text-charcoal font-semibold font-mono">{ticket.ticket_number}</p>
              </div>
            </div>

            {/* QR Code */}
            {!isCancelled && ticket.qr_token && (
              <div className="flex flex-col items-center gap-3 mt-2">
                <div
                  className="p-4 bg-white rounded-2xl border border-beige/60 shadow-sm"
                  role="img"
                  aria-label={`QR code for ticket ${ticket.ticket_number} — ${event?.event_name} — ${getFullName()}`}
                >
                  <QRCodeSVG
                    value={ticket.qr_token}
                    size={140}
                    bgColor="#FFFFFF"
                    fgColor="#1c1c1c"
                    level="M"
                  />
                </div>
                <p className="text-xs text-charcoal/40 text-center">
                  Present this QR code at the venue entrance
                </p>
              </div>
            )}

            {/* Booking reference */}
            {ticket.booking_reference && (
              <p className="text-center text-xs text-charcoal/30 font-mono mt-1">
                Booking: {ticket.booking_reference}
              </p>
            )}

            {/* Download button — prepared UI, no PDF yet */}
            <button
              disabled
              title="PDF download coming soon"
              className="w-full flex items-center justify-center gap-2 py-3 border border-beige rounded-2xl text-sm font-medium text-charcoal/40 cursor-not-allowed transition-all"
            >
              <Download size={15} />
              Download Ticket (Coming Soon)
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TicketDetailsModal;
