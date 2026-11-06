import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Calendar, Clock, User, Download, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { downloadTicketPdf } from '../../utils/ticketPdfGenerator';

const TicketDetailsModal = ({ ticket, user, onClose }) => {
  if (!ticket || typeof document === 'undefined') return null;

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
  const isDemo = ticket.payment_mode === 'demo' || ticket.booking_reference?.startsWith('DEMO') || ticket.status === 'demo_valid';

  return createPortal(
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
          className="absolute inset-0 bg-ticket-charcoal/40 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md bg-ticket-ivory rounded-3xl overflow-hidden shadow-2xl border border-ticket-beige/40"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close ticket modal"
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 border border-ticket-beige/40 flex items-center justify-center text-ticket-charcoal/50 hover:text-ticket-charcoal hover:bg-white transition-all"
          >
            <X size={16} />
          </button>

          {/* Event Image Header */}
          <div className="relative w-full overflow-hidden bg-[#FAF7F2] border-b border-ticket-beige/40 flex items-center justify-center p-2">
            {(event?.event_image || event?.image || event?.poster) ? (
              <img
                src={event.event_image || event.image || event.poster}
                alt={event.event_name || 'Event Poster'}
                className="block w-full h-auto max-h-72 object-contain object-center rounded-xl mx-auto"
              />
            ) : (
              <div className="w-full h-44 flex items-center justify-center bg-gradient-to-br from-ticket-burgundy/10 to-beige/30 rounded-xl">
                <span className="font-playfair text-3xl text-ticket-burgundy/50 font-semibold">
                  {event?.event_name?.charAt(0) || 'T'}
                </span>
              </div>
            )}
            {/* Cancelled overlay */}
            {isCancelled && (
              <div className="absolute inset-0 bg-ticket-charcoal/50 flex items-center justify-center rounded-xl">
                <span className="text-ticket-white font-semibold text-xl tracking-wider uppercase border-2 border-white/50 px-4 py-2 rounded-lg">
                  Cancelled
                </span>
              </div>
            )}
          </div>

          {/* Ticket body */}
          <div className="px-6 pt-5 pb-6 flex flex-col gap-5">
            {/* Event title */}
            <div>
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-playfair text-2xl font-semibold text-ticket-charcoal">
                  {event?.event_name || 'Event'}
                </h2>
                {isDemo && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                    DEMO BOOKING
                  </span>
                )}
              </div>
              {event?.category && (
                <span className="text-xs font-medium text-ticket-burgundy uppercase tracking-wider block mt-0.5">
                  {event.category}
                </span>
              )}
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 text-sm text-ticket-charcoal/70">
                <Calendar size={15} className="text-ticket-burgundy shrink-0" />
                <span>{formatDate(event?.event_date)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-ticket-charcoal/70">
                <Clock size={15} className="text-ticket-burgundy shrink-0" />
                <span>
                  {formatTime(event?.start_time)}
                  {event?.end_time ? ` – ${formatTime(event.end_time)}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-ticket-charcoal/70">
                <MapPin size={15} className="text-ticket-burgundy shrink-0" />
                <span>
                  {event?.venue_name || '—'}
                  {event?.city ? `, ${event.city}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-ticket-charcoal/70">
                <User size={15} className="text-ticket-burgundy shrink-0" />
                <span>{getFullName()}</span>
              </div>
            </div>

            {/* Divider — tear effect */}
            <div className="relative flex items-center gap-0 my-1">
              <div className="w-5 h-5 rounded-full bg-ticket-ivory border border-ticket-beige absolute -left-8" />
              <div className="flex-1 border-t border-dashed border-ticket-beige" />
              <div className="w-5 h-5 rounded-full bg-ticket-ivory border border-ticket-beige absolute -right-8" />
            </div>

            {/* Ticket meta */}
            <div className="flex justify-between text-xs text-ticket-charcoal/50 font-medium">
              <div>
                <p className="uppercase tracking-wider mb-0.5 text-ticket-charcoal/30">Category</p>
                <p className="text-ticket-charcoal font-semibold">{ticket.ticket_type || 'General'}</p>
              </div>
              {ticket.seat ? (
                <div className="text-center">
                  <p className="uppercase tracking-wider mb-0.5 text-ticket-charcoal/30">Seat</p>
                  <p className="text-ticket-burgundy font-bold text-sm">{ticket.seat}</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="uppercase tracking-wider mb-0.5 text-ticket-charcoal/30">Qty</p>
                  <p className="text-ticket-charcoal font-semibold">{ticket.quantity || 1}</p>
                </div>
              )}
              <div className="text-right">
                <p className="uppercase tracking-wider mb-0.5 text-ticket-charcoal/30">Ticket ID</p>
                <p className="text-ticket-charcoal font-semibold font-mono">{ticket.ticket_number}</p>
              </div>
            </div>

            {/* QR Code */}
            {!isCancelled && ticket.qr_token && (
              <div className="flex flex-col items-center gap-3 mt-2">
                <div
                  className="p-4 bg-ticket-white rounded-2xl border border-ticket-beige/60 shadow-sm"
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
                <p className="text-xs text-ticket-charcoal/40 text-center">
                  Present this QR code at the venue entrance
                </p>
              </div>
            )}

            {/* Booking reference */}
            {ticket.booking_reference && (
              <p className="text-center text-xs text-ticket-charcoal/30 font-mono mt-1">
                Booking: {ticket.booking_reference}
              </p>
            )}

            {/* Download button — Active PDF ticket generation */}
            <button
              onClick={() => downloadTicketPdf({ ticket, user })}
              title="Download your official Ticket Mahal pass"
              className="w-full flex items-center justify-center gap-2 py-3 bg-ticket-burgundy text-white rounded-2xl text-sm font-semibold hover:bg-ticket-burgundy/90 shadow-md transition-all cursor-pointer"
            >
              <Download size={15} />
              Download Ticket (PDF)
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default TicketDetailsModal;
