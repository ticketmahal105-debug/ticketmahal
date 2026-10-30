import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, AlertTriangle, Clock, MapPin, Calendar, User, ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

/**
 * Ticket Mahal Official Scanner & Verification Page
 * Handles /verify-ticket/:token scans by gate staff or attendees.
 */
export default function TicketVerificationPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/verify-ticket?token=${encodeURIComponent(token)}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError('Network error validating ticket with Ticket Mahal server.');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  const handleCheckIn = async () => {
    setCheckInLoading(true);
    try {
      const res = await fetch('/api/verify-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, checkIn: true })
      });
      const json = await res.json();
      setData(json);
    } catch (err) {
      alert('Error updating check-in state: ' + err.message);
    } finally {
      setCheckInLoading(false);
    }
  };

  const isDemo = data?.ticket?.paymentMode === 'demo';

  return (
    <div className="bg-premium-noise min-h-screen selection:bg-ticket-burgundy/30 selection:text-charcoal flex flex-col justify-between pt-28">
      <Navbar />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8">
        <div className="bg-ticket-white border border-ticket-beige rounded-3xl p-6 md:p-8 shadow-xl">
          {/* Header */}
          <div className="text-center pb-6 border-b border-ticket-beige/50">
            <h1 className="font-playfair text-2xl font-bold text-ticket-burgundy tracking-wide">
              TICKET MAHAL
            </h1>
            <p className="text-xs uppercase tracking-widest text-ticket-charcoal/50 mt-1">
              Official Admission Verification
            </p>
            {isDemo && (
              <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                DEMO BOOKING PASS
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-10 h-10 border-3 border-ticket-gold/30 border-t-ticket-burgundy rounded-full animate-spin" />
              <p className="text-sm text-ticket-charcoal/60">Verifying security credential...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="mx-auto text-amber-500 mb-3" size={44} />
              <h2 className="text-lg font-bold text-ticket-charcoal">Verification Error</h2>
              <p className="text-sm text-ticket-charcoal/60 mt-1">{error}</p>
            </div>
          ) : !data?.valid ? (
            <div className="text-center py-10">
              <XCircle className="mx-auto text-rose-600 mb-3" size={54} />
              <h2 className="font-playfair text-2xl font-bold text-rose-700">
                {data?.status === 'ALREADY_USED' ? 'ALREADY USED' : 'INVALID TICKET'}
              </h2>
              <p className="text-sm text-ticket-charcoal/70 mt-2 font-medium">
                {data?.message}
              </p>
              {data?.checkedInAt && (
                <p className="text-xs text-ticket-charcoal/50 mt-2 font-mono">
                  First Scanned: {new Date(data.checkedInAt).toLocaleString()}
                </p>
              )}

              {data?.ticket && (
                <div className="mt-6 p-4 bg-ticket-ivory/60 rounded-2xl border border-ticket-beige/60 text-left text-xs text-ticket-charcoal/70 space-y-1.5">
                  <p><span className="font-bold">Event:</span> {data.ticket.eventName}</p>
                  <p><span className="font-bold">Ticket #:</span> {data.ticket.ticketNumber}</p>
                  {data.ticket.seat && <p><span className="font-bold">Seat:</span> {data.ticket.seat}</p>}
                </div>
              )}
            </div>
          ) : (
            <div className="py-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <CheckCircle2 className="text-emerald-600" size={32} />
                <h2 className="font-playfair text-2xl font-bold text-emerald-700">
                  {data.status === 'CHECKED_IN' ? 'CHECKED IN ✓' : 'VALID TICKET'}
                </h2>
              </div>
              <p className="text-xs text-center text-ticket-charcoal/60 mb-6">
                {data.message}
              </p>

              {/* Ticket Details Box */}
              <div className="bg-ticket-ivory rounded-2xl border border-ticket-beige p-5 space-y-3 text-sm">
                <div className="border-b border-ticket-beige/60 pb-3">
                  <span className="text-[10px] uppercase tracking-wider text-ticket-burgundy font-bold block">
                    {data.ticket.category}
                  </span>
                  <h3 className="font-playfair text-lg font-bold text-ticket-charcoal">
                    {data.ticket.eventName}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-ticket-charcoal/40 uppercase block">Ticket Holder</span>
                    <span className="font-semibold text-ticket-charcoal">{data.ticket.customerName}</span>
                  </div>
                  <div>
                    <span className="text-ticket-charcoal/40 uppercase block">Seat / Admission</span>
                    <span className="font-bold text-ticket-burgundy">{data.ticket.seat || 'General Admission'}</span>
                  </div>
                  <div>
                    <span className="text-ticket-charcoal/40 uppercase block">Date & Time</span>
                    <span className="font-medium text-ticket-charcoal">{data.ticket.date} · {data.ticket.showtime}</span>
                  </div>
                  <div>
                    <span className="text-ticket-charcoal/40 uppercase block">Venue</span>
                    <span className="font-medium text-ticket-charcoal">{data.ticket.venue}, {data.ticket.city}</span>
                  </div>
                  <div>
                    <span className="text-ticket-charcoal/40 uppercase block">Ticket ID</span>
                    <span className="font-mono font-semibold text-ticket-charcoal">{data.ticket.ticketNumber}</span>
                  </div>
                  <div>
                    <span className="text-ticket-charcoal/40 uppercase block">Booking Ref</span>
                    <span className="font-mono font-semibold text-ticket-charcoal">{data.ticket.bookingReference}</span>
                  </div>
                </div>
              </div>

              {/* Action Button for Staff */}
              {data.status !== 'CHECKED_IN' && (
                <button
                  onClick={handleCheckIn}
                  disabled={checkInLoading}
                  className="w-full mt-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck size={18} />
                  {checkInLoading ? 'Confirming Admission...' : 'CONFIRM ENTRANCE / CHECK IN'}
                </button>
              )}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-ticket-beige/40 text-center text-[11px] text-ticket-charcoal/40">
            Secure verification provided by Ticket Mahal Gate Services &bull; ticketmahal.ae
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
