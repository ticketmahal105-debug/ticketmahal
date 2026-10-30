import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Download, ChevronLeft, ChevronRight, ArrowLeft, Printer, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { downloadTicketPdf } from '../utils/ticketPdfGenerator';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

/**
 * ViewTicketPage: Premium full digital E-Ticket view inspired directly by the reference format.
 * Features:
 * 1. Top Branding: Ticket Mahal logo
 * 2. Original Event Artwork: Wide banner preserving existing artwork
 * 3. Physical Ticket Shaped Body: Notched perforations, burgundy outline, 65% event details + 35% QR
 * 4. Second Bordered Panel: This Is Your E-Ticket + Important Information
 * 5. Multi-ticket Carousel navigation: Ticket 1 of N
 * 6. PDF download & Print actions
 */
export default function ViewTicketPage() {
  const params = useParams();
  const lookupToken = params.token || params.bookingNumber || params.bookingOrTicketId;
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function loadTickets() {
      if (!lookupToken) return;
      setLoading(true);
      setError(null);

      try {
        let loaded = [];

        // 1. Authoritative server-side ticket-access API call
        // Validates guest access tokens, booking references, or ticket IDs
        // and safely resolves event artwork, seats, and QR credentials.
        try {
          const res = await fetch(`/api/ticket-access?token=${encodeURIComponent(lookupToken)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.tickets && data.tickets.length > 0) {
              const apiTickets = data.tickets.map(t => ({
                ...t,
                bookings: data.booking,
                events: data.event || t.events
              }));
              loaded = apiTickets;

              // Cache to localStorage for offline and seamless reload
              if (typeof window !== 'undefined') {
                try {
                  const existingLocal = JSON.parse(localStorage.getItem('tm_local_tickets') || '[]');
                  const nonDuplicates = existingLocal.filter(
                    el => !apiTickets.some(nt => nt.ticket_number === el.ticket_number)
                  );
                  localStorage.setItem('tm_local_tickets', JSON.stringify([...apiTickets, ...nonDuplicates]));
                } catch (_) {}
              }
            }
          }
        } catch (apiErr) {
          console.warn('[ViewTicketPage] Server API fetch notice:', apiErr.message);
        }

        // 2. Try local storage cache if server API did not return tickets
        if (loaded.length === 0 && typeof window !== 'undefined') {
          try {
            const local = JSON.parse(localStorage.getItem('tm_local_tickets') || '[]');
            const matching = local.filter(
              t => t.ticket_number === lookupToken || 
                   t.booking_reference === lookupToken ||
                   t.booking_id === lookupToken
            );
            if (matching.length > 0) loaded = matching;
          } catch (_) {}
        }

        // 3. Fallback: Query Supabase directly
        if (loaded.length === 0 && supabase) {
          const { data, error: dbErr } = await supabase
            .from('tickets')
            .select(`
              *,
              events (
                id,
                event_name,
                event_image,
                venue_name,
                city,
                event_date,
                start_time,
                category
              ),
              bookings (
                id,
                booking_number,
                customer_name,
                customer_email,
                customer_phone,
                total_amount,
                payment_mode,
                payment_status,
                showtime,
                created_at
              )
            `)
            .or(`ticket_number.eq.${lookupToken},booking_reference.eq.${lookupToken}`);

          if (!dbErr && data && data.length > 0) {
            // Security check: If authenticated user, ensure they own it or guest access token matches
            const userOwned = user ? data.filter(t => !t.user_id || t.user_id === user.id) : data;
            if (userOwned.length > 0) {
              loaded = userOwned;
            }
          }
        }

        if (loaded.length === 0) {
          throw new Error('Ticket not found or unauthorized.');
        }

        setTickets(loaded);
        // If a specific ticket was requested, focus on it
        const targetIdx = loaded.findIndex(t => t.ticket_number === lookupToken);
        if (targetIdx !== -1) setCurrentIndex(targetIdx);

      } catch (err) {
        console.error('Error loading ticket:', err);
        setError(err.message || 'Could not load your ticket.');
      } finally {
        setLoading(false);
      }
    }

    loadTickets();
  }, [lookupToken, user]);

  const currentTicket = tickets[currentIndex] || null;
  const event = currentTicket?.events || {};
  const booking = currentTicket?.bookings || {};

  const isDemo = currentTicket?.payment_mode === 'demo' || 
                 booking?.payment_mode === 'demo' || 
                 currentTicket?.booking_reference?.startsWith('DEMO');

  const customerName = currentTicket?.customer_name || 
                       booking?.customer_name || 
                       (user?.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim() : null) || 
                       'Valued Guest';

  const handleDownload = async () => {
    if (!currentTicket) return;
    setDownloading(true);
    try {
      await downloadTicketPdf({ ticket: currentTicket, booking, user });
    } catch (e) {
      alert('Error generating PDF: ' + e.message);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="bg-[#FAF8F5] min-h-screen pt-32 pb-20 flex flex-col items-center justify-center">
        <Navbar />
        <div className="w-10 h-10 border-3 border-amber-500/30 border-t-[#7A1F2B] rounded-full animate-spin" />
        <p className="mt-4 text-sm text-[#1C1C1C]/60 font-medium">Opening your digital ticket...</p>
      </div>
    );
  }

  if (error || !currentTicket) {
    return (
      <div className="bg-[#FAF8F5] min-h-screen pt-32 pb-20 px-4 flex flex-col justify-between">
        <Navbar />
        <div className="max-w-md mx-auto text-center py-16 bg-white rounded-3xl border border-[#EDE3D5] p-8 shadow-sm">
          <h2 className="font-playfair text-2xl font-bold text-[#7A1F2B]">Ticket Unavailable</h2>
          <p className="text-sm text-[#1C1C1C]/60 mt-2">{error || 'This ticket could not be found.'}</p>
          <Link
            to="/my-tickets"
            className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 bg-[#7A1F2B] text-white rounded-full text-sm font-semibold hover:bg-[#601822] transition-colors"
          >
            <ArrowLeft size={16} /> Return to My Tickets
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-[#FAF8F5] min-h-screen selection:bg-[#7A1F2B]/20 text-[#1C1C1C] flex flex-col justify-between pt-28 pb-16">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6">
        {/* Navigation & Actions Top Bar (hidden in print) */}
        <div className="flex items-center justify-between gap-4 mb-6 print:hidden">
          <button
            onClick={() => navigate('/my-tickets')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#1C1C1C]/70 hover:text-[#7A1F2B] transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} /> Back to My Tickets
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="Print E-Ticket"
              className="px-4 py-2 bg-white border border-[#EDE3D5] hover:border-[#7A1F2B] text-[#1C1C1C] rounded-full text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer size={14} /> Print
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              title="Download official PDF pass"
              className="px-5 py-2 bg-[#7A1F2B] hover:bg-[#631822] text-white rounded-full text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Download size={14} /> {downloading ? 'Preparing PDF...' : 'Download E-Ticket'}
            </button>
          </div>
        </div>

        {/* Multi-Ticket Navigation (if booking has >1 ticket) */}
        {tickets.length > 1 && (
          <div className="flex items-center justify-between bg-white border border-[#EDE3D5] rounded-2xl px-4 py-2.5 mb-6 shadow-sm print:hidden">
            <button
              onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : tickets.length - 1))}
              className="p-1.5 rounded-lg hover:bg-[#FAF8F5] text-[#1C1C1C]/70 hover:text-[#7A1F2B] transition-all cursor-pointer"
              aria-label="Previous ticket"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs font-semibold tracking-wide text-[#7A1F2B]">
              Ticket {currentIndex + 1} of {tickets.length} &bull; {currentTicket.seat ? `Seat ${currentTicket.seat}` : 'Admission'}
            </span>
            <button
              onClick={() => setCurrentIndex((prev) => (prev < tickets.length - 1 ? prev + 1 : 0))}
              className="p-1.5 rounded-lg hover:bg-[#FAF8F5] text-[#1C1C1C]/70 hover:text-[#7A1F2B] transition-all cursor-pointer"
              aria-label="Next ticket"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* MASTER DIGITAL E-TICKET (Exact Reference Structure) */}
        {/* ============================================================== */}
        <div className="bg-white border-2 border-[#7A1F2B] rounded-2xl shadow-xl overflow-hidden p-6 sm:p-8 print:border-none print:shadow-none print:p-0">
          
          {/* SECTION 1: TOP BRANDING AREA */}
          <div className="flex items-center justify-between pb-5 border-b border-[#F0EBE1]">
            <div className="flex items-center gap-2">
              <span className="font-playfair text-2xl sm:text-3xl font-extrabold tracking-wider text-[#7A1F2B]">
                TICKET MAHAL
              </span>
            </div>
            <div className="text-right">
              {isDemo ? (
                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-900 border border-amber-300">
                  DEMO BOOKING
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-[#8F877C] uppercase tracking-widest">
                  OFFICIAL ADMISSION
                </span>
              )}
            </div>
          </div>

          {/* SECTION 2: ORIGINAL EVENT ARTWORK (Wide Aspect Preservation) */}
          <div className="mt-5 relative w-full h-44 sm:h-56 bg-neutral-900 rounded-xl overflow-hidden shadow-sm">
            {event?.event_image ? (
              <>
                {/* Ambient backdrop */}
                <img
                  src={event.event_image}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover blur-md opacity-35 scale-105 pointer-events-none select-none"
                />
                {/* Sharp main image */}
                <img
                  src={event.event_image}
                  alt={event.event_name || 'Event Artwork'}
                  className="relative z-10 w-full h-full object-cover object-center"
                />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-[#2D181E] to-[#7A1F2B]">
                <span className="font-playfair text-3xl font-bold text-[#F5A300]">
                  {event?.event_name || 'Ticket Mahal'}
                </span>
              </div>
            )}
          </div>

          {/* SECTION 3: PHYSICAL-TICKET SHAPED MAIN BODY */}
          <div className="mt-6 relative border-2 border-[#7A1F2B] rounded-2xl bg-white overflow-hidden">
            {/* Left and Right Notched Cutouts (Perforation Effect) */}
            <div className="hidden sm:block absolute left-[65%] -top-3 w-6 h-6 rounded-full bg-[#FAF8F5] border-b-2 border-[#7A1F2B] -translate-x-1/2 z-20" />
            <div className="hidden sm:block absolute left-[65%] -bottom-3 w-6 h-6 rounded-full bg-[#FAF8F5] border-t-2 border-[#7A1F2B] -translate-x-1/2 z-20" />

            <div className="flex flex-col sm:flex-row">
              {/* LEFT 65%: Event Information */}
              <div className="sm:w-[65%] p-5 sm:p-6 flex flex-col justify-between">
                <div>
                  <h2 className="font-playfair text-xl sm:text-2xl font-bold text-[#7A1F2B] leading-tight mb-2">
                    {event?.event_name || 'Event'}
                  </h2>

                  <div className="mb-4">
                    <span className="text-[10px] uppercase font-semibold text-[#8F877C] tracking-wider block">
                      Our Dear Guest
                    </span>
                    <span className="text-sm sm:text-base font-bold text-[#1C1C1C]">
                      {customerName}
                    </span>
                  </div>
                </div>

                {/* Structured Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-[#F0EBE1] text-xs">
                  {currentTicket.row && (
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#8F877C] block">Door</span>
                      <span className="font-bold text-[#1C1C1C]">Door {currentTicket.row}</span>
                    </div>
                  )}

                  {currentTicket.ticket_type && (
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#8F877C] block">Section</span>
                      <span className="font-bold text-[#1C1C1C]">{currentTicket.ticket_type}</span>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#8F877C] block">Seat</span>
                    <span className="font-bold text-[#7A1F2B] text-sm">
                      {currentTicket.seat || 'General Admission'}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className="text-[10px] uppercase font-semibold text-[#8F877C] block">Event Date & Time</span>
                    <span className="font-semibold text-[#1C1C1C]">
                      {event?.event_date || 'Upcoming'} &bull; {event?.start_time || booking?.showtime || '07:30 PM'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#8F877C] block">Price</span>
                    <span className="font-bold text-[#1C1C1C]">
                      AED {currentTicket.price || booking?.total_amount || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* VERTICAL PERFORATED LINE (Desktop) */}
              <div className="hidden sm:block border-l-2 border-dashed border-[#7A1F2B]/40 relative" />

              {/* HORIZONTAL PERFORATED LINE (Mobile) */}
              <div className="block sm:hidden border-t-2 border-dashed border-[#7A1F2B]/40 my-1" />

              {/* RIGHT 35%: QR Code + Ticket Credential Area */}
              <div className="sm:w-[35%] bg-[#FFFDF9] p-5 sm:p-6 flex flex-col items-center justify-center text-center">
                {/* Category Pill above QR */}
                <span className="mb-2 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#7A1F2B] text-white">
                  {currentTicket.ticket_type || 'STANDARD'}
                </span>

                {/* MACHINE-READABLE QR CODE */}
                <div 
                  className="p-3 bg-white border border-[#EDE3D5] rounded-xl shadow-inner my-1"
                  role="img"
                  aria-label={`QR Code for Ticket ${currentTicket.ticket_number}`}
                >
                  <QRCodeSVG
                    value={currentTicket.qr_token || `https://ticketmahal.ae/verify-ticket/${currentTicket.ticket_number}`}
                    size={140}
                    bgColor="#FFFFFF"
                    fgColor="#1C1C1C"
                    level="M"
                    marginSize={1}
                  />
                </div>

                {/* Ticket ID below QR */}
                <div className="mt-2 text-center">
                  <span className="text-[10px] uppercase font-semibold text-[#8F877C] tracking-wider block">
                    Ticket ID
                  </span>
                  <span className="font-mono text-xs font-bold text-[#7A1F2B] tracking-wider">
                    {currentTicket.ticket_number}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: SECOND BORDERED INFORMATION PANEL */}
          <div className="mt-6 border-2 border-[#7A1F2B] rounded-2xl bg-white p-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* LEFT: This Is Your E-Ticket */}
              <div className="space-y-3">
                <div className="inline-block px-3 py-1 bg-[#7A1F2B] text-white text-[11px] font-bold uppercase tracking-wider rounded-md">
                  THIS IS YOUR E-TICKET
                </div>

                <h3 className="font-playfair text-lg font-bold text-[#1C1C1C]">
                  Event Information
                </h3>

                <ul className="space-y-1.5 text-xs text-[#1C1C1C]/80">
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-[#7A1F2B]">&bull;</span>
                    <span><strong>Venue:</strong> {event?.venue_name || 'Ticket Mahal Main Stage'}, {event?.city || 'Dubai'}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-[#7A1F2B]">&bull;</span>
                    <span><strong>Schedule:</strong> {event?.event_date || 'Upcoming'} | {event?.start_time || '07:30 PM'}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-[#7A1F2B]">&bull;</span>
                    <span><strong>Booking Ref:</strong> #{currentTicket.booking_reference || booking?.booking_number}</span>
                  </li>
                  {currentTicket.seat && (
                    <li className="flex items-start gap-1.5">
                      <span className="font-bold text-[#7A1F2B]">&bull;</span>
                      <span><strong>Seat Assignment:</strong> {currentTicket.seat} ({currentTicket.ticket_type})</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* RIGHT: Important Information (Configurable & Informative) */}
              <div className="space-y-3 border-t md:border-t-0 md:border-l md:pl-6 border-[#F0EBE1] pt-4 md:pt-0">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full border border-[#7A1F2B] text-[#7A1F2B] flex items-center justify-center text-[11px] font-bold">
                    i
                  </span>
                  <h3 className="font-playfair text-base font-bold text-[#1C1C1C]">
                    Important Information
                  </h3>
                </div>

                <ul className="space-y-1.5 text-[11px] text-[#1C1C1C]/75 leading-relaxed">
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-[#7A1F2B]">&bull;</span>
                    <span>Arrive at least 30 minutes before the scheduled start time.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-[#7A1F2B]">&bull;</span>
                    <span>Present this valid digital or printed E-Ticket for entry at the gate.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-[#7A1F2B]">&bull;</span>
                    <span>A valid photo ID may be required upon check-in.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-[#7A1F2B]">&bull;</span>
                    <span>Tickets are non-transferable and subject to event terms.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-[#7A1F2B]">&bull;</span>
                    <span>Late admission is governed by the venue's entry schedule.</span>
                  </li>
                </ul>

                <div className="pt-2 text-[11px]">
                  <a
                    href="https://ticketmahal.ae/terms"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#7A1F2B] hover:underline font-semibold"
                  >
                    View Ticket Mahal Terms & Conditions &rarr;
                  </a>
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 5: MINIMAL TICKET MAHAL FOOTER */}
          <div className="mt-8 pt-5 border-t border-[#F0EBE1] text-center text-xs text-[#8F877C]">
            <p className="font-playfair font-bold text-[#7A1F2B] tracking-wider text-sm">
              TICKET MAHAL
            </p>
            <p className="text-[11px] mt-0.5">Your Ticket. Your Experience. &bull; ticketmahal.ae</p>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
