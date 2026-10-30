import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle2, XCircle, AlertCircle, Loader2, 
  Ticket, ArrowRight, RefreshCw, Home, ShieldCheck
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { verifyNGeniusPayment } from '../services/ngeniusService';

export default function PaymentCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const bookingNumber = searchParams.get('booking');
  const orderRef = searchParams.get('ref') || searchParams.get('orderRef');
  const isCancelled = searchParams.get('cancelled') === 'true';

  const [verificationState, setVerificationState] = useState('verifying'); // 'verifying' | 'success' | 'failed' | 'cancelled'
  const [verifiedBooking, setVerifiedBooking] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (isCancelled) {
      setVerificationState('cancelled');
      return;
    }

    if (!bookingNumber && !orderRef) {
      setVerificationState('failed');
      setErrorMessage('No payment reference found to verify. If you were charged, please contact Ticket Mahal support.');
      return;
    }

    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    const performVerification = async () => {
      try {
        const result = await verifyNGeniusPayment({
          bookingNumber,
          orderRef
        });

        if (result.success && (result.status === 'paid' || result.booking?.payment_status === 'paid')) {
          setVerifiedBooking(result.booking || { booking_number: bookingNumber });
          setVerificationState('success');
        } else {
          setVerificationState('failed');
          setErrorMessage(result.error || 'Payment was not approved by Network International.');
        }
      } catch (err) {
        console.error('Payment verification failed:', err);
        setVerificationState('failed');
        setErrorMessage(err.message || 'Error communicating with verification server.');
      }
    };

    performVerification();
  }, [bookingNumber, orderRef, isCancelled]);

  return (
    <div className="bg-premium-noise min-h-screen selection:bg-ticket-burgundy/30 selection:text-charcoal flex flex-col justify-between pt-32 px-4 sm:px-6 pb-20 font-sans">
      <Navbar />

      <main className="max-w-xl mx-auto w-full my-auto">
        <div className="bg-ticket-white border border-ticket-beige rounded-3xl p-6 sm:p-10 shadow-xl text-center space-y-6">

          {/* STATE 1: VERIFYING */}
          {verificationState === 'verifying' && (
            <div className="space-y-6 py-6">
              <div className="w-20 h-20 rounded-full bg-ticket-gold/10 border border-ticket-gold/30 flex items-center justify-center mx-auto">
                <Loader2 className="w-10 h-10 text-ticket-gold animate-spin" />
              </div>
              <div className="space-y-2">
                <span className="text-xs uppercase font-bold tracking-widest text-ticket-gold">
                  Network International
                </span>
                <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-ticket-charcoal">
                  Verifying Your Payment
                </h2>
                <p className="text-xs sm:text-sm text-ticket-charcoal/60 max-w-sm mx-auto leading-relaxed">
                  Please wait while our server securely confirms your transaction directly with the N-Genius payment gateway.
                </p>
              </div>
              <div className="text-[11px] font-mono text-ticket-charcoal/40 bg-ticket-ivory px-3 py-1.5 rounded-full inline-block">
                Ref: {orderRef || bookingNumber || 'Connecting...'}
              </div>
            </div>
          )}

          {/* STATE 2: SUCCESS */}
          {verificationState === 'success' && (
            <div className="space-y-6">
              <div className="w-20 h-20 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 size={44} />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs uppercase font-bold tracking-widest text-emerald-600">
                  <ShieldCheck size={14} /> Payment Verified & Approved
                </div>
                <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-ticket-charcoal">
                  Booking Confirmed!
                </h2>
                <p className="text-xs sm:text-sm text-ticket-charcoal/60">
                  Your payment has been settled and your official ticket pass is issued.
                </p>
              </div>

              {/* Booking Summary Box */}
              <div className="bg-gradient-to-br from-ticket-ivory to-ticket-beige/40 border border-ticket-beige rounded-2xl p-4 sm:p-5 text-left text-xs space-y-3">
                <div className="flex justify-between items-center border-b border-ticket-beige/80 pb-2.5">
                  <span className="text-ticket-charcoal/60 uppercase text-[10px] font-bold">Booking Number</span>
                  <span className="font-mono font-bold text-ticket-burgundy text-sm">
                    {verifiedBooking?.booking_number || bookingNumber}
                  </span>
                </div>
                {orderRef && (
                  <div className="flex justify-between items-center border-b border-ticket-beige/80 pb-2.5">
                    <span className="text-ticket-charcoal/60 uppercase text-[10px] font-bold">Gateway Order Reference</span>
                    <span className="font-mono text-ticket-charcoal/80 text-xs">
                      {orderRef}
                    </span>
                  </div>
                )}
                {verifiedBooking?.total_amount && (
                  <div className="flex justify-between items-center border-b border-ticket-beige/80 pb-2.5">
                    <span className="text-ticket-charcoal/60 uppercase text-[10px] font-bold">Amount Paid</span>
                    <span className="font-bold text-ticket-charcoal text-sm">
                      {verifiedBooking.total_amount} {verifiedBooking.currency || 'AED'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-ticket-charcoal/60 uppercase text-[10px] font-bold">Payment Method</span>
                  <span className="font-medium text-ticket-charcoal">
                    N-Genius Network International
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => navigate('/my-tickets')}
                  className="flex-1 py-3.5 bg-ticket-burgundy text-white font-bold rounded-2xl shadow-md hover:bg-ticket-burgundy/90 transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <Ticket size={16} /> View My Tickets <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => navigate(`/my-bookings/${verifiedBooking?.booking_number || bookingNumber}`)}
                  className="flex-1 py-3.5 bg-ticket-ivory text-ticket-charcoal font-bold rounded-2xl border border-ticket-beige hover:bg-ticket-beige/50 transition-all text-xs"
                >
                  Booking Details
                </button>
              </div>
            </div>
          )}

          {/* STATE 3: CANCELLED */}
          {verificationState === 'cancelled' && (
            <div className="space-y-6">
              <div className="w-20 h-20 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
                <AlertCircle size={44} />
              </div>
              <div className="space-y-1">
                <span className="text-xs uppercase font-bold tracking-widest text-amber-600">Checkout Cancelled</span>
                <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-ticket-charcoal">
                  Payment Was Not Completed
                </h2>
                <p className="text-xs sm:text-sm text-ticket-charcoal/60 max-w-sm mx-auto">
                  You cancelled the payment transaction before it finished. No funds were debited.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  to="/"
                  className="flex-1 py-3.5 bg-ticket-charcoal text-white font-bold rounded-2xl shadow hover:bg-ticket-charcoal/90 transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <Home size={16} /> Explore Events
                </Link>
                <Link
                  to="/my-bookings"
                  className="flex-1 py-3.5 bg-ticket-ivory text-ticket-charcoal font-bold rounded-2xl border border-ticket-beige hover:bg-ticket-beige/50 transition-all text-xs flex items-center justify-center"
                >
                  My Bookings
                </Link>
              </div>
            </div>
          )}

          {/* STATE 4: FAILED */}
          {verificationState === 'failed' && (
            <div className="space-y-6">
              <div className="w-20 h-20 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
                <XCircle size={44} />
              </div>
              <div className="space-y-1">
                <span className="text-xs uppercase font-bold tracking-widest text-rose-600">Verification Notice</span>
                <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-ticket-charcoal">
                  Payment Could Not Be Verified
                </h2>
                <p className="text-xs sm:text-sm text-ticket-charcoal/60 max-w-sm mx-auto">
                  {errorMessage || 'The payment gateway did not report a completed transaction for this booking.'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  to="/"
                  className="flex-1 py-3.5 bg-ticket-charcoal text-white font-bold rounded-2xl shadow hover:bg-ticket-charcoal/90 transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <Home size={16} /> Return to Home
                </Link>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 py-3.5 bg-ticket-ivory text-ticket-charcoal font-bold rounded-2xl border border-ticket-beige hover:bg-ticket-beige/50 transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <RefreshCw size={14} /> Retry Verification
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
