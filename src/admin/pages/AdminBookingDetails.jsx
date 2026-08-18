import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, Tag, ShieldCheck, RefreshCcw, AlertTriangle } from 'lucide-react';
import { getAdminBookingDetails, getBookingTickets } from '../../services/bookingsService';
import { updateEvent } from '../../services/eventsService';
import { supabase } from '../../lib/supabase';

const AdminBookingDetails = () => {
  const { bookingNumber } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDetails();
  }, [bookingNumber]);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: bData, error: bErr } = await getAdminBookingDetails(bookingNumber);
      if (bErr) throw bErr;
      setBooking(bData);

      if (bData?.id) {
        const { data: tData } = await getBookingTickets(bData.id);
        setTickets(tData || []);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch booking details.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const { error: patchErr } = await supabase
        .from('bookings')
        .update({ booking_status: newStatus })
        .eq('id', booking.id);

      if (patchErr) throw patchErr;
      
      // Also update related tickets status if cancelled/refunded
      if (newStatus === 'cancelled' || newStatus === 'refunded') {
        await supabase
          .from('tickets')
          .update({ status: 'cancelled' })
          .eq('booking_id', booking.id);
      }

      setBooking(prev => ({ ...prev, booking_status: newStatus }));
      fetchDetails();
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-champagne/30 border-t-champagne rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="text-center py-20 bg-white border border-beige/60 rounded-3xl shadow-sm">
        <p className="text-red-500 font-medium mb-4">{error || "Booking not found"}</p>
        <button onClick={() => navigate('/admin/bookings')} className="px-5 py-2.5 bg-charcoal text-white rounded-full text-sm">
          Back to Bookings
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/bookings')}
          className="p-2 border border-beige hover:border-champagne hover:text-champagne text-charcoal/60 rounded-xl transition-all"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="font-playfair text-3xl font-semibold text-charcoal tracking-wide mb-1">
            Booking #{booking.booking_number}
          </h1>
          <p className="text-charcoal/60 text-sm">Review transaction details, manage states, and view ticket barcodes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Card: Event & Customer Info */}
          <div className="bg-white border border-beige/60 rounded-3xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Event info */}
            <div>
              <div className="flex items-center gap-2 text-champagne text-xs font-semibold uppercase tracking-wider mb-3">
                <Calendar size={14} />
                <span>Event Information</span>
              </div>
              <h3 className="font-playfair text-xl font-bold text-charcoal mb-2">{booking.events?.event_name}</h3>
              <p className="text-sm text-charcoal/60">{new Date(booking.events?.event_date).toLocaleDateString()}</p>
              <p className="text-sm text-charcoal/60">{booking.events?.venue_name}, {booking.events?.city}</p>
            </div>

            {/* Customer Info */}
            <div className="md:border-l border-beige/40 md:pl-6">
              <div className="flex items-center gap-2 text-champagne text-xs font-semibold uppercase tracking-wider mb-3">
                <User size={14} />
                <span>Customer Profile</span>
              </div>
              <h3 className="font-semibold text-charcoal text-base">
                {booking.profiles?.first_name} {booking.profiles?.last_name}
              </h3>
              <p className="text-sm text-charcoal/60">{booking.profiles?.email}</p>
              <p className="text-xs text-charcoal/40 mt-2">ID: {booking.profiles?.id}</p>
            </div>

          </div>

          {/* Card: Tickets Issued */}
          <div className="bg-white border border-beige/60 rounded-3xl p-6 shadow-sm">
            <h3 className="font-playfair text-lg font-semibold text-charcoal mb-4 border-b border-beige/40 pb-2">
              Issued Tickets ({tickets.length})
            </h3>
            
            {tickets.length === 0 ? (
              <p className="text-sm text-charcoal/50">No tickets generated for this booking.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-ivory/30 border border-beige/40 rounded-2xl gap-3">
                    <div>
                      <div className="text-sm font-semibold text-charcoal">{ticket.ticket_number}</div>
                      <div className="text-xs text-champagne font-medium uppercase tracking-wider mt-0.5">
                        {ticket.ticket_type || 'General'} Tier
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="text-xs text-charcoal/50">Qty: {ticket.quantity || 1}</span>
                      <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold capitalize ${
                        ticket.status === 'active' 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Actions & Timeline */}
        <div className="flex flex-col gap-6">
          
          {/* Card: Order Status */}
          <div className="bg-white border border-beige/60 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <h3 className="font-playfair text-lg font-semibold text-charcoal mb-2 border-b border-beige/40 pb-2">
              Order Status
            </h3>

            <div>
              <span className="text-xs text-charcoal/60 uppercase font-semibold">Booking State</span>
              <div className="text-xl font-bold text-charcoal capitalize mt-1">{booking.booking_status}</div>
            </div>

            <div>
              <span className="text-xs text-charcoal/60 uppercase font-semibold">Payment State</span>
              <div className="text-xl font-bold text-charcoal capitalize mt-1">{booking.payment_status || 'Paid'}</div>
            </div>

            <div className="border-t border-beige/45 pt-4 flex flex-col gap-2">
              {booking.booking_status === 'pending' && (
                <button
                  onClick={() => handleUpdateStatus('confirmed')}
                  disabled={updating}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-sm transition-all"
                >
                  Confirm Booking
                </button>
              )}
              {booking.booking_status !== 'cancelled' && booking.booking_status !== 'refunded' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus('cancelled')}
                    disabled={updating}
                    className="w-full py-3 border border-red-200 text-red-600 hover:bg-red-50 font-semibold rounded-xl text-sm transition-all"
                  >
                    Cancel Booking
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('refunded')}
                    disabled={updating}
                    className="w-full py-3 bg-charcoal text-white hover:bg-charcoal/95 font-semibold rounded-xl text-sm transition-all"
                  >
                    Refund Booking
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Card: Summary */}
          <div className="bg-white border border-beige/60 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <h3 className="font-playfair text-lg font-semibold text-charcoal mb-2 border-b border-beige/40 pb-2">
              Pricing Breakdown
            </h3>
            
            <div className="flex flex-col gap-2 text-sm text-charcoal/70">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>AED {Number(booking.total_amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-charcoal text-base border-t border-beige/40 pt-2 mt-2">
                <span>Total Amount</span>
                <span>AED {Number(booking.total_amount).toLocaleString()}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminBookingDetails;
