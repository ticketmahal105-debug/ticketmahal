import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, User, Download, Mail, Phone } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getBookingByNumber, getBookingTickets } from '../services/bookingsService';
import Navbar from '../components/Navbar';
import BookingStatusBadge from '../components/bookings/BookingStatusBadge';
import PaymentStatusBadge from '../components/bookings/PaymentStatusBadge';
import PriceBreakdown from '../components/bookings/PriceBreakdown';
import BookingTickets from '../components/bookings/BookingTickets';

const BookingDetailsPage = () => {
  const { bookingNumber } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!user || !bookingNumber) return;
      try {
        setLoading(true);
        const { data, error: fetchError } = await getBookingByNumber(bookingNumber, user.id);
        if (fetchError) throw fetchError;
        if (!data) throw new Error('Booking not found');
        
        setBooking(data);
        
        // Fetch related tickets
        setTicketsLoading(true);
        const { data: ticketsData } = await getBookingTickets(data.id);
        setTickets(ticketsData || []);
      } catch (err) {
        console.error('Error fetching booking details:', err);
        setError('We couldn\'t load your booking details.');
      } finally {
        setLoading(false);
        setTicketsLoading(false);
      }
    };
    
    fetchDetails();
  }, [user, bookingNumber]);

  if (loading) {
    return (
      <div className="bg-premium-noise min-h-screen pt-32 px-6 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-champagne/30 border-t-champagne rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="bg-premium-noise min-h-screen pt-32 px-6 flex flex-col items-center justify-center text-center">
        <h2 className="font-playfair text-2xl text-charcoal font-semibold mb-2">Booking Not Found</h2>
        <p className="text-charcoal/60 mb-6">{error || 'This booking does not exist or you do not have access to it.'}</p>
        <button onClick={() => navigate('/bookings')} className="px-6 py-2.5 bg-charcoal text-white rounded-full text-sm font-medium hover:bg-charcoal/90">
          Back to My Bookings
        </button>
      </div>
    );
  }

  const event = booking.events;
  const currency = booking.currency || 'AED';

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };
  const formatTime = (timeStr) => {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(':');
    const d = new Date(); d.setHours(+h, +m);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };
  
  const getFullName = () => {
    const first = user?.user_metadata?.first_name || '';
    const last = user?.user_metadata?.last_name || '';
    return `${first} ${last}`.trim() || user?.email?.split('@')[0] || 'Guest';
  };

  return (
    <div className="bg-premium-noise min-h-screen selection:bg-champagne/30 selection:text-charcoal pt-32 px-6 pb-24 font-sans">
      <Navbar />
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4">
          <button onClick={() => navigate('/bookings')} className="flex items-center gap-2 text-sm text-charcoal/60 hover:text-champagne transition-colors w-fit">
            <ArrowLeft size={16} /> Back to My Bookings
          </button>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-playfair text-3xl font-semibold text-charcoal tracking-wide">
                Booking <span className="font-mono text-2xl">{booking.booking_number}</span>
              </h1>
              <p className="text-sm text-charcoal/50 mt-1 font-mono">
                Booked on {new Date(booking.created_at).toLocaleString('en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <BookingStatusBadge status={booking.booking_status} />
              <PaymentStatusBadge status={booking.payment_status} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Column */}
          <div className="md:col-span-2 flex flex-col gap-8">
            
            {/* Event Info */}
            <div className="bg-white border border-beige rounded-3xl overflow-hidden shadow-sm">
              <div className="h-48 w-full bg-beige/30">
                {event?.event_image && (
                  <img src={event.event_image} alt={event.event_name} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="p-6">
                <h2 className="font-playfair text-2xl font-semibold text-charcoal mb-4">{event?.event_name}</h2>
                <div className="flex flex-col gap-3 text-sm text-charcoal/70">
                  <div className="flex items-center gap-3"><Calendar size={16} className="text-champagne" /> {formatDate(event?.event_date)}</div>
                  <div className="flex items-center gap-3"><Clock size={16} className="text-champagne" /> {formatTime(event?.start_time)} {event?.end_time ? `– ${formatTime(event.end_time)}` : ''}</div>
                  <div className="flex items-center gap-3"><MapPin size={16} className="text-champagne" /> {event?.venue_name}{event?.city ? `, ${event.city}` : ''}</div>
                </div>
              </div>
            </div>

            {/* Related Tickets */}
            <BookingTickets tickets={tickets} loading={ticketsLoading} />

            {/* Customer Info */}
            <div className="bg-white border border-beige rounded-3xl p-6 shadow-sm">
              <h3 className="font-playfair text-xl font-semibold text-charcoal mb-4">Customer Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-3 text-charcoal/70"><User size={16} className="text-charcoal/40" /> <span className="font-medium text-charcoal">{getFullName()}</span></div>
                <div className="flex items-center gap-3 text-charcoal/70"><Mail size={16} className="text-charcoal/40" /> <span>{user?.email}</span></div>
                {user?.user_metadata?.phone && (
                  <div className="flex items-center gap-3 text-charcoal/70"><Phone size={16} className="text-charcoal/40" /> <span>{user.user_metadata.phone}</span></div>
                )}
              </div>
            </div>

          </div>

          {/* Sidebar Column */}
          <div className="flex flex-col gap-6">
            <PriceBreakdown booking={booking} />
            
            {/* Payment Info */}
            <div className="bg-ivory border border-beige/60 rounded-2xl p-5 shadow-sm">
              <h4 className="font-playfair text-lg text-charcoal font-semibold mb-3">Payment Info</h4>
              <div className="flex flex-col gap-2 text-sm text-charcoal/70">
                <div className="flex justify-between"><span>Method</span> <span className="font-medium text-charcoal">{booking.payment_provider || 'Credit Card'}</span></div>
                <div className="flex justify-between"><span>Status</span> <span className="font-medium text-charcoal capitalize">{booking.payment_status}</span></div>
                {booking.payment_reference && (
                  <div className="flex justify-between"><span>Ref</span> <span className="font-mono text-xs">{booking.payment_reference}</span></div>
                )}
              </div>
            </div>

            {/* Receipt Action */}
            <button disabled className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-beige rounded-2xl text-sm font-medium text-charcoal/50 hover:bg-ivory hover:text-charcoal transition-colors cursor-not-allowed" title="Coming soon">
              <Download size={16} /> Download Receipt
            </button>

          </div>

        </div>
      </div>
    </div>
  );
};

export default BookingDetailsPage;
