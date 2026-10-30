import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ShieldCheck, Lock, ExternalLink, AlertCircle, Loader2,
  Calendar, Clock, Ticket, User, Mail, Phone, ArrowRight,
  CheckCircle2, Download, Home, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createNGeniusOrder, createDemoBooking, getPaymentConfig } from '../../services/ngeniusService';
import { saveLocalBookings } from '../../services/bookingsService';
import { saveLocalTickets } from '../../services/ticketsService';
import { downloadTicketPdf } from '../../utils/ticketPdfGenerator';

export default function NGeniusCheckoutModal({ isOpen, onClose, movie, selectedShowtime, ticketQuantity, user }) {
  const navigate = useNavigate();
  const [paymentMode, setPaymentMode] = useState('demo'); // 'demo' | 'ngenius'
  const [isProcessing, setIsProcessing] = useState(false);
  const [gatewayError, setGatewayError] = useState('');
  const [confirmedBookingData, setConfirmedBookingData] = useState(null);

  // Customer Contact State
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || user?.user_metadata?.phone || '');
  const [customerName, setCustomerName] = useState(
    user?.user_metadata?.first_name 
      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
      : ''
  );

  useEffect(() => {
    // Check server payment mode architecture
    getPaymentConfig().then(cfg => {
      if (cfg?.paymentMode) setPaymentMode(cfg.paymentMode);
    });
  }, []);

  useEffect(() => {
    if (user?.email && !customerEmail) setCustomerEmail(user.email);
    if ((user?.phone || user?.user_metadata?.phone) && !customerPhone) {
      setCustomerPhone(user.phone || user.user_metadata.phone);
    }
    if (user?.user_metadata?.first_name && !customerName) {
      setCustomerName(`${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim());
    }
  }, [user]);

  if (!isOpen || !movie) return null;

  const unitPrice = Number(movie.startingPrice) || 120;
  const currency = movie.currency || 'AED';
  const subtotal = unitPrice * ticketQuantity;
  const vatAmount = Math.round(subtotal * 0.05 * 100) / 100; // 5% UAE VAT
  const totalAmount = Math.round((subtotal + vatAmount) * 100) / 100;
  const isDemo = paymentMode === 'demo';

  const handleProcessPayment = async (e) => {
    if (e) e.preventDefault();

    if (!customerEmail || !customerEmail.includes('@')) {
      setGatewayError('Please enter a valid email address to receive your tickets.');
      return;
    }

    if (!customerName.trim()) {
      setGatewayError('Please enter the primary guest name.');
      return;
    }

    setIsProcessing(true);
    setGatewayError('');

    try {
      // 1. DEMO MODE FLOW
      if (isDemo) {
        // Prevent duplicate submissions via idempotency key
        const idempotencyKey = `IDEM-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        const demoRes = await createDemoBooking({
          eventId: movie.id || movie.slug,
          showtime: selectedShowtime,
          ticketQuantity,
          ticketType: 'Standard Admission',
          customerInfo: {
            name: customerName.trim(),
            email: customerEmail.trim(),
            phone: customerPhone.trim()
          },
          userId: user?.id || null,
          idempotencyKey
        });

        if (demoRes.success && demoRes.booking) {
          // Immediately cache locally so tickets & bookings show up instantly in My Tickets / My Bookings
          saveLocalBookings([demoRes.booking]);
          if (demoRes.tickets) saveLocalTickets(demoRes.tickets);

          setIsProcessing(false);
          setConfirmedBookingData(demoRes);
          return;
        }

        setIsProcessing(false);
        setGatewayError(demoRes.error || 'Could not complete demo booking.');
        return;
      }

      // 2. LIVE N-GENIUS MODE FLOW
      const returnUrl = `${window.location.origin}/payment/callback`;

      const orderRes = await createNGeniusOrder({
        eventId: movie.id || movie.slug,
        showtime: selectedShowtime,
        ticketQuantity,
        customerInfo: {
          name: customerName.trim(),
          email: customerEmail.trim(),
          phone: customerPhone.trim()
        },
        returnUrl,
        userId: user?.id || null
      });

      if (orderRes.success && orderRes.paymentUrl) {
        // Real N-Genius Hosted Payment Page: redirect user to Network International 3DS gateway
        window.location.href = orderRes.paymentUrl;
        return;
      }

      // Rejection handling from live N-Genius gateway
      setIsProcessing(false);
      setGatewayError(orderRes.error || 'Payment gateway could not initialize payment session.');

    } catch (err) {
      console.error('Checkout Error:', err);
      setIsProcessing(false);
      setGatewayError(err.message || 'Error communicating with booking server.');
    }
  };

  const handleDownloadAllTickets = () => {
    if (!confirmedBookingData?.tickets?.length) return;
    confirmedBookingData.tickets.forEach(ticket => {
      downloadTicketPdf({
        ticket,
        booking: confirmedBookingData.booking,
        user
      });
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative w-full max-w-xl bg-ticket-white rounded-3xl shadow-2xl overflow-hidden text-ticket-charcoal my-auto border border-ticket-beige font-sans"
        >

          {/* VIEW 1: SUCCESS CONFIRMATION SCREEN */}
          {confirmedBookingData ? (
            <div>
              {/* Luxury Success Header */}
              <div className="bg-gradient-to-r from-ticket-charcoal via-[#1f191b] to-ticket-burgundy text-white p-6 sm:p-8 text-center relative overflow-hidden">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <CheckCircle2 size={36} />
                </div>
                
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-[10px] tracking-widest font-black uppercase text-emerald-400">
                    BOOKING CONFIRMED ✓
                  </span>
                  {isDemo && (
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                      Demo Payment
                    </span>
                  )}
                </div>

                <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-white tracking-wide">
                  You're Going!
                </h2>
                <p className="text-xs sm:text-sm text-white/80 mt-1 font-medium">
                  {confirmedBookingData.event?.title || movie.title}
                </p>
                <p className="text-[11px] text-white/60 mt-0.5">
                  Your admission passes with secure QR tokens are ready.
                </p>

                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Booking Details Card */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="bg-ticket-ivory/70 border border-ticket-beige rounded-2xl p-4 sm:p-5 text-xs space-y-2.5">
                  <div className="flex justify-between items-center pb-2 border-b border-ticket-beige/70">
                    <span className="text-ticket-charcoal/60 uppercase font-semibold text-[10px]">Booking Reference</span>
                    <span className="font-mono font-bold text-ticket-burgundy text-sm">
                      {confirmedBookingData.booking?.booking_number}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-ticket-beige/70">
                    <span className="text-ticket-charcoal/60 uppercase font-semibold text-[10px]">Showtime & Date</span>
                    <span className="font-semibold text-ticket-charcoal">
                      {selectedShowtime} · {movie.releaseDate || 'Upcoming'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-ticket-beige/70">
                    <span className="text-ticket-charcoal/60 uppercase font-semibold text-[10px]">Venue</span>
                    <span className="font-semibold text-ticket-charcoal">
                      {movie.venue || 'Ticket Mahal Main Stage'}, {movie.city || 'Dubai'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-ticket-beige/70">
                    <span className="text-ticket-charcoal/60 uppercase font-semibold text-[10px]">Tickets Issued</span>
                    <span className="font-semibold text-ticket-charcoal">
                      {confirmedBookingData.tickets?.length || ticketQuantity} Admission Pass(es)
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-ticket-charcoal/60 uppercase font-semibold text-[10px]">Total Amount</span>
                    <span className="font-playfair text-base font-black text-ticket-burgundy">
                      {confirmedBookingData.booking?.total_amount || totalAmount} {currency}
                    </span>
                  </div>
                </div>

                {/* Individual Ticket Reference Snippets */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ticket-charcoal/50 block pl-1">
                    Your Ticket ID(s):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {confirmedBookingData.tickets?.map((t, idx) => (
                      <div key={idx} className="bg-ticket-white border border-ticket-beige rounded-xl p-2.5 flex items-center justify-between text-xs shadow-2xs">
                        <span className="font-semibold text-ticket-charcoal/70">Pass #{idx + 1}</span>
                        <span className="font-mono font-bold text-ticket-burgundy">{t.ticket_number}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 space-y-2.5">
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/my-tickets');
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-ticket-burgundy to-ticket-charcoal text-white font-bold rounded-2xl shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 text-xs tracking-wide cursor-pointer"
                  >
                    <Ticket size={16} /> VIEW MY TICKETS <ArrowRight size={14} />
                  </button>

                  <button
                    onClick={handleDownloadAllTickets}
                    className="w-full py-3 bg-ticket-ivory border border-ticket-beige text-ticket-charcoal font-bold rounded-2xl hover:bg-ticket-beige/50 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
                  >
                    <Download size={14} /> DOWNLOAD TICKET (PDF)
                  </button>

                  <button
                    onClick={onClose}
                    className="w-full py-2.5 text-ticket-charcoal/60 text-xs font-semibold hover:text-ticket-charcoal transition-colors"
                  >
                    Continue Exploring
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* VIEW 2: CHECKOUT FORM */
            <div>
              {/* HEADER */}
              <div className="bg-gradient-to-r from-ticket-charcoal via-[#1f191b] to-ticket-burgundy text-white p-5 sm:p-6 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-ticket-gold/20 p-2.5 rounded-xl backdrop-blur-sm border border-ticket-gold/30">
                      <ShieldCheck className="w-6 h-6 text-ticket-gold" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] tracking-widest font-black uppercase text-ticket-gold">
                          Ticket Mahal Checkout
                        </span>
                        {isDemo ? (
                          <span className="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
                            Demo Mode Active
                          </span>
                        ) : (
                          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-semibold text-white/80">
                            Network International
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-playfair font-bold text-white tracking-wide">
                        {isDemo ? 'Complete Your Reservation' : 'Secure Bank Payment'}
                      </h3>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    disabled={isProcessing}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                {/* EVENT & SHOWTIME SUMMARY */}
                <div className="bg-ticket-ivory/60 border border-ticket-beige/70 rounded-2xl p-4 flex gap-4 items-center">
                  {movie.image && (
                    <img 
                      src={movie.image} 
                      alt={movie.title} 
                      className="w-16 h-20 object-cover rounded-xl shadow-sm shrink-0 border border-ticket-beige"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-playfair text-base font-bold text-ticket-charcoal truncate">{movie.title}</h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-ticket-charcoal/70 mt-1">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock size={13} className="text-ticket-gold" /> {selectedShowtime}
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <Ticket size={13} className="text-ticket-gold" /> {ticketQuantity} {ticketQuantity === 1 ? 'Ticket' : 'Tickets'}
                      </span>
                    </div>
                    <div className="text-xs text-ticket-charcoal/50 mt-1 truncate">
                      {movie.venue || 'Ticket Mahal Main Stage'}, {movie.city || 'Dubai'}
                    </div>
                  </div>
                </div>

                {/* ERROR ALERT */}
                {gatewayError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-800 font-medium text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-bold text-rose-900 mb-0.5">Notice</div>
                      <div>{gatewayError}</div>
                    </div>
                  </div>
                )}

                {/* CUSTOMER DETAILS FORM */}
                <form onSubmit={handleProcessPayment} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-ticket-charcoal/60 block">
                      Guest Contact Details
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="relative">
                        <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ticket-charcoal/40" />
                        <input
                          type="text"
                          required
                          placeholder="Full Name"
                          value={customerName}
                          disabled={isProcessing}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full pl-9 pr-3.5 py-2.5 bg-ticket-ivory border border-ticket-beige rounded-xl text-xs font-medium focus:bg-white focus:border-ticket-gold outline-none transition-all disabled:opacity-60"
                        />
                      </div>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ticket-charcoal/40" />
                        <input
                          type="email"
                          required
                          placeholder="Email Address"
                          value={customerEmail}
                          disabled={isProcessing}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="w-full pl-9 pr-3.5 py-2.5 bg-ticket-ivory border border-ticket-beige rounded-xl text-xs font-medium focus:bg-white focus:border-ticket-gold outline-none transition-all disabled:opacity-60"
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ticket-charcoal/40" />
                      <input
                        type="tel"
                        placeholder="Mobile Number (+971 50 ...)"
                        value={customerPhone}
                        disabled={isProcessing}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-ticket-ivory border border-ticket-beige rounded-xl text-xs font-medium focus:bg-white focus:border-ticket-gold outline-none transition-all disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {/* PAYMENT MODE NOTICE */}
                  {isDemo ? (
                    <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/40 border border-amber-200/80 rounded-2xl space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 flex items-center gap-1.5">
                          <Sparkles size={14} className="text-amber-600" /> Demo Payment Checkout
                        </span>
                        <span className="text-[10px] bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                          Free Simulation
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800/80 leading-relaxed">
                        No credit card is required. Clicking complete will generate verified QR ticket passes in your account and trigger your confirmation email.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-gradient-to-br from-ticket-ivory to-ticket-beige/40 border border-ticket-beige rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-ticket-charcoal flex items-center gap-1.5">
                          <Lock size={13} className="text-ticket-gold" /> N-Genius Hosted Gateway
                        </span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                          3D Secure 2.0
                        </span>
                      </div>
                      <p className="text-[11px] text-ticket-charcoal/70 leading-relaxed">
                        You will be redirected to Network International’s official bank portal to enter your card details securely.
                      </p>
                    </div>
                  )}

                  {/* PRICE BREAKDOWN */}
                  <div className="space-y-1.5 pt-1 text-xs text-ticket-charcoal/70 border-t border-ticket-beige pt-3">
                    <div className="flex justify-between">
                      <span>Tickets ({ticketQuantity} × {unitPrice} {currency})</span>
                      <span className="font-medium text-ticket-charcoal">{subtotal} {currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>UAE VAT (5%)</span>
                      <span className="font-medium text-ticket-charcoal">{vatAmount} {currency}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold text-ticket-charcoal pt-1 border-t border-dashed border-ticket-beige">
                      <span className="font-playfair text-base">Total Due</span>
                      <span className="font-playfair text-xl font-black text-ticket-burgundy">
                        {totalAmount} {currency}
                      </span>
                    </div>
                  </div>

                  {/* ACTION BUTTON */}
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-4 bg-gradient-to-r from-ticket-burgundy to-ticket-charcoal text-white font-bold rounded-2xl shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 text-sm tracking-wide disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-ticket-gold" />
                        Confirming your booking...
                      </>
                    ) : isDemo ? (
                      <>
                        <Sparkles size={16} className="text-amber-300" />
                        Complete Demo Booking ({totalAmount} {currency})
                        <ArrowRight size={16} />
                      </>
                    ) : (
                      <>
                        <Lock size={16} className="text-ticket-gold" />
                        Proceed to Bank Payment ({totalAmount} {currency})
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <div className="text-center text-[10px] text-ticket-charcoal/50 flex items-center justify-center gap-1">
                    <span>{isDemo ? 'Demo Mode Active · No Real Card Charged' : 'Encrypted with TLS 1.3 · Official Network International Merchant Outlet'}</span>
                  </div>
                </form>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
