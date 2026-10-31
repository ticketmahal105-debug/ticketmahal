import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Check, Clock, AlertTriangle, ShieldCheck, ChevronRight, 
  User, Mail, Phone, Lock, ArrowLeft, Ticket, Calendar, MapPin, 
  Sparkles, Download, CheckCircle2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { createSeatHold, getSeatStatus, releaseSeatHold } from '../../services/seatHoldService';
import { createDemoBooking } from '../../services/ngeniusService';
import { saveLocalTickets } from '../../services/ticketsService';
import { saveLocalBookings } from '../../services/bookingsService';
import { downloadTicketPdf } from '../../utils/ticketPdfGenerator';

// Default Data-Driven Cinema Layout Rows
const DEFAULT_ROWS = [
  { row: 'H', tier: 'VIP', seats: 10, offset: 50 },
  { row: 'G', tier: 'VIP', seats: 12, offset: 50 },
  { row: 'F', tier: 'Premium', seats: 14, offset: 20 },
  { row: 'E', tier: 'Premium', seats: 14, offset: 20 },
  { row: 'D', tier: 'Premium', seats: 14, offset: 20 },
  { row: 'C', tier: 'Standard', seats: 14, offset: 0 },
  { row: 'B', tier: 'Standard', seats: 14, offset: 0 },
  { row: 'A', tier: 'Standard', seats: 12, offset: 0 },
];

export default function UnifiedBookingModal({
  isOpen,
  onClose,
  movie,
  selectedShowtime = '07:30 PM',
  user = null
}) {
  const navigate = useNavigate();

  // Steps: 'SEAT_SELECTION' | 'IDENTIFICATION' | 'ORDER_SUMMARY' | 'CONFIRMED'
  const [step, setStep] = useState('SEAT_SELECTION');

  // Seats State
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [soldSeats, setSoldSeats] = useState(new Set());
  const [heldSeats, setHeldSeats] = useState(new Set());
  const [holdReference, setHoldReference] = useState(null);
  const [heldUntil, setHeldUntil] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(600);
  const [seatConflictError, setSeatConflictError] = useState(null);
  const [loadingSeats, setLoadingSeats] = useState(false);

  // Customer Identification State
  const [idMethod, setIdMethod] = useState('quick'); // 'quick' | 'google' | 'login'
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [loginForm, setLoginForm] = useState({ email: '', password: '', isSignUp: false });
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Booking Execution State
  const [isProcessingBooking, setIsProcessingBooking] = useState(false);
  const [confirmedBookingData, setConfirmedBookingData] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Promo Code State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState(null);
  const [validatingPromo, setValidatingPromo] = useState(false);

  const sessionId = `${movie?.releaseDate || 'show'}_${selectedShowtime.replace(/\s+/g, '')}`;

  // Prepopulate customer info if authenticated
  useEffect(() => {
    if (user) {
      setCustomerInfo({
        name: user.user_metadata?.first_name 
          ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
          : (user.email?.split('@')[0] || ''),
        email: user.email || '',
        phone: user.user_metadata?.phone || '+971500000000'
      });
    }
  }, [user]);

  // Load live seats status on open
  useEffect(() => {
    if (!isOpen || !movie) return;

    setStep('SEAT_SELECTION');
    setSelectedSeats([]);
    setSeatConflictError(null);
    setConfirmedBookingData(null);

    const loadSeats = async () => {
      setLoadingSeats(true);
      const res = await getSeatStatus({
        eventId: movie.id || movie.slug,
        sessionId,
        showtime: selectedShowtime,
        date: movie.releaseDate
      });

      if (res && res.success) {
        setSoldSeats(new Set(res.soldSeats || []));
        setHeldSeats(new Set(res.heldSeats || []));
      }
      setLoadingSeats(false);
    };

    loadSeats();
  }, [isOpen, movie, selectedShowtime]);

  // 10-Minute Hold Countdown Timer
  useEffect(() => {
    if (!heldUntil) return;

    const interval = setInterval(() => {
      const remainingMs = new Date(heldUntil).getTime() - Date.now();
      const secs = Math.max(0, Math.floor(remainingMs / 1000));
      setSecondsRemaining(secs);

      if (secs <= 0) {
        clearInterval(interval);
        setSeatConflictError('Your 10-minute seat hold has expired. Please re-select your seats.');
        setStep('SEAT_SELECTION');
        setSelectedSeats([]);
        setHoldReference(null);
        setHeldUntil(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [heldUntil]);

  if (!isOpen || !movie) return null;

  // Authoritative dynamic tier pricing calculation
  const getSeatTier = (seatId) => {
    const row = seatId?.charAt(0);
    const rowConfig = DEFAULT_ROWS.find(r => r.row === row);
    return rowConfig?.tier || 'Standard';
  };

  const calculateSeatPrice = (seatId) => {
    const tier = getSeatTier(seatId);
    let addon = 0;
    if (tier === 'VIP') addon = 100;
    else if (tier === 'Premium') addon = 40;
    return (movie.startingPrice || 120) + addon;
  };

  const subtotal = selectedSeats.reduce((sum, s) => sum + calculateSeatPrice(s), 0);
  const taxableAmount = Math.max(0, subtotal - promoDiscount);
  const vat = Math.round(taxableAmount * 0.05 * 100) / 100;
  const totalAmount = Math.round((taxableAmount + vat) * 100) / 100;

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    setValidatingPromo(true);
    setSeatConflictError(null);
    setPromoError(null);
    try {
      const res = await fetch('/api/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCodeInput.trim(),
          orderAmount: subtotal,
          eventId: movie.id || movie.slug,
          customerEmail: customerInfo.email
        })
      });
      const data = await res.json();
      if (data.success && data.valid) {
        setAppliedPromo(data.code);
        setPromoDiscount(data.discount_amount);
        setPromoError(null);
      } else {
        setPromoError(data.error || 'Invalid promo code');
      }
    } catch (e) {
      setPromoError('Failed to validate promo code. Please try again.');
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoDiscount(0);
    setPromoCodeInput('');
    setPromoError(null);
  };

  // Seat toggle handler
  const handleToggleSeat = (seatId) => {
    if (soldSeats.has(seatId) || heldSeats.has(seatId)) return;
    setSeatConflictError(null);

    setSelectedSeats(prev => {
      if (prev.includes(seatId)) {
        return prev.filter(s => s !== seatId);
      } else {
        if (prev.length >= 8) {
          alert('Maximum 8 seats per booking transaction.');
          return prev;
        }
        return [...prev, seatId].sort();
      }
    });
  };

  // Step 1 -> Step 2: Confirm seats and establish real 10-minute hold
  const handleConfirmSeatsAndHold = async () => {
    if (selectedSeats.length === 0) return;

    setLoadingSeats(true);
    setSeatConflictError(null);

    const res = await createSeatHold({
      eventId: movie.id || movie.slug,
      sessionId,
      showtime: selectedShowtime,
      date: movie.releaseDate,
      seats: selectedSeats,
      heldBy: user?.email || customerInfo.email || 'guest',
      holdReference: holdReference || null
    });

    setLoadingSeats(false);

    if (res && res.success) {
      setHoldReference(res.holdReference);
      setHeldUntil(res.heldUntil);
      setSecondsRemaining(res.remainingSeconds || 600);

      // If user is already authenticated with full profile, jump directly to order summary
      if (user && customerInfo.email && customerInfo.phone) {
        setStep('ORDER_SUMMARY');
      } else {
        setStep('IDENTIFICATION');
      }
    } else {
      setSeatConflictError(res.error || 'Selected seats could not be held. Please choose other seats.');
      // Refresh seat status
      const updated = await getSeatStatus({
        eventId: movie.id || movie.slug,
        sessionId,
        showtime: selectedShowtime,
        date: movie.releaseDate
      });
      if (updated && updated.success) {
        setSoldSeats(new Set(updated.soldSeats || []));
        setHeldSeats(new Set(updated.heldSeats || []));
      }
    }
  };

  // Quick Order submit
  const handleQuickOrderSubmit = (e) => {
    e.preventDefault();
    if (!customerInfo.email || !customerInfo.name || !customerInfo.phone) {
      setAuthError('Please fill in your name, email, and mobile number.');
      return;
    }
    setAuthError(null);
    setStep('ORDER_SUMMARY');
  };

  // Supabase Google Auth
  const handleGoogleAuth = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href
        }
      });
      if (error) throw error;
    } catch (err) {
      setAuthError(err.message || 'Google sign in failed');
      setAuthLoading(false);
    }
  };

  // Supabase Email Login / Sign Up
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (loginForm.isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: loginForm.email,
          password: loginForm.password
        });
        if (error) throw error;
        setCustomerInfo(prev => ({ ...prev, email: loginForm.email }));
        setStep('ORDER_SUMMARY');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginForm.email,
          password: loginForm.password
        });
        if (error) throw error;
        setCustomerInfo(prev => ({
          ...prev,
          email: data.user.email,
          name: data.user.user_metadata?.first_name || data.user.email.split('@')[0]
        }));
        setStep('ORDER_SUMMARY');
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // Final Demo Booking Payment Trigger
  const handleCompleteDemoBooking = async () => {
    setIsProcessingBooking(true);
    setSeatConflictError(null);

    const dominantTier = selectedSeats.length > 0 ? getSeatTier(selectedSeats[0]) : 'Standard';

    try {
      const res = await createDemoBooking({
        eventId: movie.id || movie.slug,
        showtime: selectedShowtime,
        ticketQuantity: selectedSeats.length,
        ticketType: dominantTier,
        ticketTier: dominantTier,
        seats: selectedSeats,
        holdReference: holdReference,
        customerInfo: {
          name: customerInfo.name || 'Valued Guest',
          email: customerInfo.email,
          phone: customerInfo.phone
        },
        userId: user?.id || null,
        promoCode: appliedPromo
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to complete demo booking');
      }

      // Save to client persistence for immediate visibility in /my-tickets and /my-bookings
      if (res.booking) saveLocalBookings([res.booking]);
      if (res.tickets) saveLocalTickets(res.tickets);

      setConfirmedBookingData(res);
      setStep('CONFIRMED');
    } catch (err) {
      console.error('Demo booking error:', err);
      setSeatConflictError(err.message || 'Error processing transaction.');
    } finally {
      setIsProcessingBooking(false);
    }
  };

  // Close modal and cleanup holds
  const handleClose = () => {
    if (holdReference && step !== 'CONFIRMED') {
      releaseSeatHold({
        eventId: movie.id || movie.slug,
        sessionId,
        holdReference
      }).catch(() => {});
    }
    onClose();
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl bg-[#FFFDF8] rounded-3xl border border-[#EDE3D5] shadow-2xl overflow-hidden my-auto"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#EDE3D5]">
          <div className="flex items-center gap-3">
            {step !== 'SEAT_SELECTION' && step !== 'CONFIRMED' && (
              <button
                onClick={() => setStep(step === 'ORDER_SUMMARY' ? 'IDENTIFICATION' : 'SEAT_SELECTION')}
                className="p-1.5 rounded-full hover:bg-[#FAF6EE] text-[#7A1F2B] transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest uppercase text-[#7A1F2B]">
                  {step === 'SEAT_SELECTION' && 'Step 1 of 3 · Seat Selection'}
                  {step === 'IDENTIFICATION' && 'Step 2 of 3 · Customer Details'}
                  {step === 'ORDER_SUMMARY' && 'Step 3 of 3 · Order Summary'}
                  {step === 'CONFIRMED' && 'Booking Confirmed ✓'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D] uppercase">
                  Demo Mode
                </span>
              </div>
              <h3 className="font-playfair text-xl font-bold text-[#292725] line-clamp-1">
                {movie.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 10-Minute Hold Timer Badge */}
            {heldUntil && step !== 'CONFIRMED' && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-bold text-amber-800">
                <Clock size={13} className="animate-spin text-amber-600" />
                <span>TIME REMAINING: {formatTimer(secondsRemaining)}</span>
              </div>
            )}
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* STEP 1: CINEMA SEAT SELECTION */}
        {step === 'SEAT_SELECTION' && (
          <div className="p-6">
            {/* Showtime & Venue Info Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 mb-6 rounded-2xl bg-white border border-[#EDE3D5]/80 text-xs">
              <div className="flex items-center gap-2 text-[#292725]">
                <Calendar size={15} className="text-[#7A1F2B]" />
                <span className="font-semibold">{movie.releaseDate}</span>
                <span className="text-neutral-300">•</span>
                <Clock size={15} className="text-[#7A1F2B]" />
                <span className="font-semibold">{selectedShowtime}</span>
              </div>
              <div className="flex items-center gap-2 text-[#77736D]">
                <MapPin size={15} className="text-[#7A1F2B]" />
                <span>{movie.venue}, {movie.city}</span>
              </div>
            </div>

            {/* Error banner if any */}
            {seatConflictError && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{seatConflictError}</span>
              </div>
            )}

            {/* Cinema Screen Curve */}
            <div className="mb-8 text-center">
              <div className="relative max-w-md mx-auto h-8 flex items-center justify-center">
                <div className="absolute inset-0 border-t-4 border-[#7A1F2B]/40 rounded-[100%] shadow-[0_-8px_16px_rgba(122,31,43,0.1)]" />
                <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#7A1F2B]/70 bg-[#FFFDF8] px-4 z-10">
                  SCREEN / STAGE
                </span>
              </div>
            </div>

            {/* Seat Map Grid */}
            <div className="space-y-2.5 max-w-xl mx-auto overflow-x-auto pb-4">
              {DEFAULT_ROWS.map(({ row, tier, seats }) => (
                <div key={row} className="flex items-center justify-center gap-2">
                  <span className="w-5 text-right font-mono text-xs font-bold text-neutral-400">{row}</span>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: seats }).map((_, idx) => {
                      const seatNum = idx + 1;
                      const seatId = `${row}${seatNum}`;
                      const isSelected = selectedSeats.includes(seatId);
                      const isSold = soldSeats.has(seatId);
                      const isHeld = heldSeats.has(seatId);

                      let btnStyle = 'bg-white border-[#EDE3D5] text-[#292725] hover:border-[#7A1F2B] hover:shadow-xs';
                      if (isSelected) {
                        btnStyle = 'bg-[#7A1F2B] border-[#7A1F2B] text-white shadow-md font-bold scale-105';
                      } else if (isSold) {
                        btnStyle = 'bg-neutral-200/80 border-neutral-300 text-neutral-400 cursor-not-allowed line-through';
                      } else if (isHeld) {
                        btnStyle = 'bg-amber-100/70 border-amber-300 text-amber-700 cursor-not-allowed';
                      }

                      return (
                        <button
                          key={seatId}
                          onClick={() => handleToggleSeat(seatId)}
                          disabled={isSold || isHeld}
                          title={`${seatId} (${tier} - AED ${calculateSeatPrice(seatId)})`}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border text-[11px] font-medium flex items-center justify-center transition-all duration-150 ${btnStyle}`}
                        >
                          {isSelected ? <Check size={12} strokeWidth={3} /> : seatNum}
                        </button>
                      );
                    })}
                  </div>
                  <span className="w-5 text-left font-mono text-xs font-bold text-neutral-400">{row}</span>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-6 border-t border-[#EDE3D5]/60 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-white border border-[#EDE3D5]" />
                <span className="text-neutral-600">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-[#7A1F2B] border border-[#7A1F2B]" />
                <span className="text-neutral-600">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-amber-100 border border-amber-300" />
                <span className="text-neutral-600">Held (10m Lock)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-neutral-200 border border-neutral-300" />
                <span className="text-neutral-600">Sold</span>
              </div>
            </div>

            {/* Sticky Bottom Booking Bar */}
            <div className="mt-6 p-4 rounded-2xl bg-white border border-[#EDE3D5] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold block">Selected Seats</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-playfair text-lg font-bold text-[#7A1F2B]">
                    {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None selected'}
                  </span>
                  {selectedSeats.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#FAF6EE] text-[#7A1F2B] font-semibold border border-[#EDE3D5]">
                      {selectedSeats.length} {selectedSeats.length === 1 ? 'Seat' : 'Seats'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-right">
                  <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold block">Estimated Total</span>
                  <span className="font-playfair text-xl font-bold text-[#292725]">
                    AED {totalAmount}
                  </span>
                </div>

                <button
                  onClick={handleConfirmSeatsAndHold}
                  disabled={selectedSeats.length === 0 || loadingSeats}
                  className="px-6 py-3.5 bg-[#7A1F2B] text-white font-bold rounded-xl shadow-lg hover:bg-[#601822] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm uppercase tracking-wider"
                >
                  {loadingSeats ? 'Reserving...' : 'Confirm Seats →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CUSTOMER IDENTIFICATION */}
        {step === 'IDENTIFICATION' && (
          <div className="p-6 max-w-xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="font-playfair text-2xl font-bold text-[#292725]">
                How would you like to continue?
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Your seats ({selectedSeats.join(', ')}) are securely locked for the next 10 minutes.
              </p>
            </div>

            {/* Method Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-[#FAF6EE] rounded-2xl mb-6 border border-[#EDE3D5]">
              <button
                onClick={() => setIdMethod('quick')}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  idMethod === 'quick' ? 'bg-[#7A1F2B] text-white shadow-sm' : 'text-neutral-600 hover:text-black'
                }`}
              >
                Quick Order
              </button>
              <button
                onClick={() => setIdMethod('google')}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  idMethod === 'google' ? 'bg-[#7A1F2B] text-white shadow-sm' : 'text-neutral-600 hover:text-black'
                }`}
              >
                Google Auth
              </button>
              <button
                onClick={() => setIdMethod('login')}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  idMethod === 'login' ? 'bg-[#7A1F2B] text-white shadow-sm' : 'text-neutral-600 hover:text-black'
                }`}
              >
                Sign In
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                {authError}
              </div>
            )}

            {/* QUICK ORDER FORM */}
            {idMethod === 'quick' && (
              <form onSubmit={handleQuickOrderSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="email"
                      required
                      placeholder="alex.smith@example.com"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EDE3D5] text-sm focus:outline-none focus:border-[#7A1F2B] bg-white"
                    />
                  </div>
                  <span className="text-[11px] text-neutral-400 mt-1 block">
                    Tickets and receipt will be delivered to this email.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Full Name *</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      required
                      placeholder="Alex Smith"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EDE3D5] text-sm focus:outline-none focus:border-[#7A1F2B] bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Mobile Phone *</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="tel"
                      required
                      placeholder="+971 50 123 4567"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EDE3D5] text-sm focus:outline-none focus:border-[#7A1F2B] bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#7A1F2B] text-white font-bold rounded-xl shadow-lg hover:bg-[#601822] transition-all text-sm uppercase tracking-wider"
                >
                  Continue to Order Summary →
                </button>
              </form>
            )}

            {/* GOOGLE AUTH */}
            {idMethod === 'google' && (
              <div className="text-center py-6 space-y-4">
                <p className="text-sm text-neutral-600">
                  Sign in instantly with your Google account. Your seat hold of 10 minutes remains active.
                </p>
                <button
                  onClick={handleGoogleAuth}
                  disabled={authLoading}
                  className="w-full py-3 bg-white border border-[#EDE3D5] hover:border-[#7A1F2B] rounded-xl font-bold text-sm text-[#292725] shadow-xs flex items-center justify-center gap-3 transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  {authLoading ? 'Connecting...' : 'Continue with Google'}
                </button>
              </div>
            )}

            {/* EMAIL LOGIN */}
            {idMethod === 'login' && (
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EDE3D5] text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EDE3D5] text-sm bg-white"
                  />
                </div>

                <div className="flex justify-between items-center text-xs">
                  <button
                    type="button"
                    onClick={() => setLoginForm({ ...loginForm, isSignUp: !loginForm.isSignUp })}
                    className="text-[#7A1F2B] font-semibold underline"
                  >
                    {loginForm.isSignUp ? 'Already have an account? Sign In' : 'New to Ticket Mahal? Create Account'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 bg-[#7A1F2B] text-white font-bold rounded-xl shadow-lg hover:bg-[#601822] transition-all text-sm uppercase tracking-wider"
                >
                  {authLoading ? 'Verifying...' : (loginForm.isSignUp ? 'Sign Up & Continue' : 'Sign In & Continue')}
                </button>
              </form>
            )}
          </div>
        )}

        {/* STEP 3: ORDER SUMMARY */}
        {step === 'ORDER_SUMMARY' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Event Poster & Core Info */}
              <div className="md:col-span-5 bg-white p-4 rounded-2xl border border-[#EDE3D5] flex gap-4">
                <img
                  src={movie.image}
                  alt={movie.title}
                  className="w-24 h-32 rounded-xl object-cover shrink-0 shadow-md border border-[#EDE3D5]"
                />
                <div className="flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A1F2B]">
                      {movie.category}
                    </span>
                    <h4 className="font-playfair text-lg font-bold text-[#292725] line-clamp-2">
                      {movie.title}
                    </h4>
                    <p className="text-xs text-neutral-500 mt-1">
                      {movie.venue}
                    </p>
                  </div>
                  <div className="text-xs font-semibold text-[#7A1F2B]">
                    {movie.releaseDate} • {selectedShowtime}
                  </div>
                </div>
              </div>

              {/* Order Details & Pricing Table */}
              <div className="md:col-span-7 bg-white p-5 rounded-2xl border border-[#EDE3D5] space-y-4">
                <h5 className="font-playfair text-base font-bold text-[#292725] border-b border-[#EDE3D5] pb-2">
                  Reservation Breakdown
                </h5>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Reserved Seats:</span>
                    <span className="font-bold text-[#7A1F2B]">{selectedSeats.join(', ')} ({selectedSeats.length} Admissions)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Ticket Holder:</span>
                    <span className="font-semibold text-[#292725]">{customerInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Email Confirmation to:</span>
                    <span className="font-semibold text-[#292725]">{customerInfo.email}</span>
                  </div>
                </div>

                {/* Promo Code Input Section */}
                <div className="border-t border-[#EDE3D5] pt-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter promo code (e.g. WELCOME10)"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                      disabled={Boolean(appliedPromo) || validatingPromo}
                      className="flex-1 px-3 py-2 text-xs uppercase font-mono tracking-wider border border-[#EDE3D5] rounded-xl bg-white focus:outline-none focus:border-[#7A1F2B]"
                    />
                    {appliedPromo ? (
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        disabled={validatingPromo || !promoCodeInput.trim()}
                        className="px-4 py-2 text-xs font-bold text-white bg-[#7A1F2B] hover:bg-[#601822] disabled:opacity-50 rounded-xl transition-colors"
                      >
                        {validatingPromo ? 'Checking...' : 'Apply'}
                      </button>
                    )}
                  </div>
                  {appliedPromo && (
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                      ✓ Promo code <strong>{appliedPromo}</strong> applied successfully!
                    </p>
                  )}
                  {promoError && (
                    <p className="text-[11px] text-red-600 font-medium mt-1">
                      {promoError}
                    </p>
                  )}
                </div>

                <div className="border-t border-[#EDE3D5] pt-3 space-y-2 text-xs">
                  <div className="flex justify-between text-neutral-600">
                    <span>Ticket Subtotal:</span>
                    <span className="font-mono">AED {subtotal}</span>
                  </div>
                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Promo Discount ({appliedPromo}):</span>
                      <span className="font-mono">-AED {promoDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-neutral-600">
                    <span>5% UAE VAT:</span>
                    <span className="font-mono">AED {vat}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Booking & Processing Fee:</span>
                    <span className="text-emerald-700 font-bold">FREE (Demo Mode)</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-[#292725] pt-2 border-t border-[#EDE3D5]">
                    <span>Total Amount:</span>
                    <span className="text-[#7A1F2B] font-mono text-lg">AED {totalAmount}</span>
                  </div>
                </div>

                {/* Controlled Demo Payment Notice */}
                <div className="p-3 bg-[#FAF6EE] rounded-xl border border-[#EDE3D5] text-[11px] text-[#7A1F2B]">
                  <strong>Controlled Demo Payment Active:</strong> Network International N-Genius gateway is temporarily on hold. Clicking the button below confirms this booking immediately without charging your card.
                </div>

                <button
                  onClick={handleCompleteDemoBooking}
                  disabled={isProcessingBooking}
                  className="w-full py-4 bg-[#7A1F2B] text-white font-bold rounded-xl shadow-lg hover:bg-[#601822] disabled:opacity-50 transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={18} />
                  {isProcessingBooking ? 'Confirming your booking...' : 'Complete Demo Booking (Pay AED ' + totalAmount + ')'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* STEP 4: BOOKING CONFIRMED */}
        {step === 'CONFIRMED' && confirmedBookingData && (
          <div className="p-8 text-center space-y-6 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#7A1F2B]">
                Booking Confirmed ✓
              </span>
              <h2 className="font-playfair text-3xl font-bold text-[#292725] mt-1">
                You're Going!
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Your tickets are ready and confirmation has been processed.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#EDE3D5] text-left text-xs space-y-2.5 shadow-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Booking Reference:</span>
                <span className="font-mono font-bold text-[#7A1F2B]">{confirmedBookingData.booking?.booking_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Event:</span>
                <span className="font-bold text-[#292725]">{movie.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Venue:</span>
                <span>{movie.venue}, {movie.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Showtime:</span>
                <span className="font-semibold">{movie.releaseDate} • {selectedShowtime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Seats:</span>
                <span className="font-bold text-[#7A1F2B]">{selectedSeats.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Total Paid:</span>
                <span className="font-bold text-emerald-700">AED {confirmedBookingData.booking?.total_amount}</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  onClose();
                  navigate('/my-tickets');
                }}
                className="flex-1 py-3.5 bg-[#7A1F2B] text-white font-bold rounded-xl shadow-md hover:bg-[#601822] transition-all text-xs uppercase tracking-wider"
              >
                View My Tickets
              </button>

              <button
                onClick={async () => {
                  if (confirmedBookingData.tickets?.[0]) {
                    setDownloadingPdf(true);
                    await downloadTicketPdf({
                      ticket: confirmedBookingData.tickets[0],
                      booking: confirmedBookingData.booking,
                      user: { email: customerInfo.email, user_metadata: { first_name: customerInfo.name } }
                    });
                    setDownloadingPdf(false);
                  }
                }}
                disabled={downloadingPdf}
                className="flex-1 py-3.5 bg-white border border-[#EDE3D5] hover:border-[#7A1F2B] text-[#292725] font-bold rounded-xl transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Download size={14} />
                {downloadingPdf ? 'Generating PDF...' : 'Download Ticket (PDF)'}
              </button>
            </div>

            <button
              onClick={handleClose}
              className="text-xs text-neutral-400 hover:text-black transition-colors underline"
            >
              Continue Exploring
            </button>
          </div>
        )}

      </motion.div>
    </div>
  );
}
