import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Filter, FileSpreadsheet } from 'lucide-react';
import { getAllBookingsAdmin } from '../../services/bookingsService';
import { getAdminEvents } from '../../services/eventsService';
import { exportTicketMahalFullReport } from '../../utils/excelReportGenerator';
import { formatGstDateTime } from '../../utils/dateUtils';

const AdminBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await getAllBookingsAdmin();
    if (!error) {
      setBookings(data || []);
    }
    setLoading(false);
  };

  const filteredBookings = bookings.filter((b) => {
    const custName = `${b.profiles?.first_name || ''} ${b.profiles?.last_name || ''}`.toLowerCase();
    const custEmail = (b.profiles?.email || '').toLowerCase();
    const eventName = (b.events?.event_name || '').toLowerCase();
    const bookingNum = (b.booking_number || '').toLowerCase();
    
    const query = search.toLowerCase();
    const matchesSearch = custName.includes(query) || 
                          custEmail.includes(query) || 
                          eventName.includes(query) || 
                          bookingNum.includes(query);
                          
    const matchesStatus = statusFilter === 'all' 
      ? true 
      : statusFilter === 'demo' 
        ? (b.payment_status === 'demo_paid' || b.payment_provider === 'demo' || b.payment_mode === 'demo')
        : statusFilter === 'real_paid'
          ? (b.payment_status === 'paid' && b.payment_provider !== 'demo' && b.payment_mode !== 'demo')
          : b.booking_status?.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const isDemoBooking = (b) => {
    return b.payment_status === 'demo_paid' || b.payment_provider === 'demo' || b.payment_mode === 'demo';
  };

  const getStatusBadge = (status, b) => {
    if (isDemoBooking(b)) {
      return 'bg-amber-50 text-amber-800 border-amber-300';
    }
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'cancelled':
      case 'payment_failed':
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'refunded':
        return 'bg-ticket-cream text-ticket-muted border-gray-300';
      default:
        return 'bg-beige/20 text-ticket-charcoal/60 border-ticket-beige/40';
    }
  };

  const handleExportExcel = async () => {
    const { data: allEvents } = await getAdminEvents();
    let allTickets = [];
    if (typeof window !== 'undefined') {
      try {
        allTickets = JSON.parse(localStorage.getItem('tm_local_tickets') || '[]');
      } catch (_) {}
    }

    exportTicketMahalFullReport({
      bookings: bookings || [],
      tickets: allTickets,
      customers: [],
      events: allEvents || [],
      activities: []
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-playfair text-3xl font-semibold text-ticket-charcoal tracking-wide mb-1">Bookings Management</h1>
          <p className="text-ticket-charcoal/60 text-sm">View, track, and manage all customer bookings and transaction states.</p>
        </div>
        <button
          onClick={handleExportExcel}
          className="px-5 py-2.5 bg-ticket-burgundy text-white hover:bg-[#601822] font-bold rounded-2xl shadow-sm text-xs uppercase tracking-wider flex items-center gap-2 self-start sm:self-auto transition-all"
        >
          <FileSpreadsheet size={16} />
          Export to Excel (.xlsx)
        </button>
      </div>

      {/* Filter panel */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-ticket-white p-4 border border-ticket-beige/60 rounded-3xl shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ticket-charcoal/40" />
          <input
            type="text"
            placeholder="Search booking #, customer, or event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-ticket-ivory border border-ticket-beige/60 rounded-full text-sm outline-none focus:border-ticket-gold focus:bg-white transition-all placeholder:text-ticket-charcoal/30 text-ticket-charcoal"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto py-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'real_paid', label: 'Real Paid' },
            { id: 'demo', label: 'DEMO' },
            { id: 'pending', label: 'Pending' },
            { id: 'cancelled', label: 'Cancelled' },
            { id: 'refunded', label: 'Refunded' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider border whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-ticket-burgundy text-white border-ticket-burgundy shadow-sm'
                  : 'bg-ticket-white text-ticket-charcoal/60 border-ticket-beige/60 hover:bg-ticket-ivory'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-ticket-gold/30 border-t-ticket-burgundy rounded-full animate-spin" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-20 bg-ticket-white border border-ticket-beige/60 rounded-3xl shadow-sm">
          <p className="text-ticket-charcoal/60 text-sm">No bookings found.</p>
        </div>
      ) : (
        <div className="bg-ticket-white border border-ticket-beige/60 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[1050px] w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-ticket-beige/40 bg-ticket-ivory/30 text-ticket-charcoal/50 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4 whitespace-nowrap">Booking Ref</th>
                  <th className="px-6 py-4 whitespace-nowrap">Customer</th>
                  <th className="px-6 py-4 whitespace-nowrap">Event</th>
                  <th className="px-6 py-4 whitespace-nowrap text-center">Tickets</th>
                  <th className="px-6 py-4 whitespace-nowrap text-right">Total</th>
                  <th className="px-6 py-4 whitespace-nowrap text-center">Status</th>
                  <th className="px-6 py-4 whitespace-nowrap">Purchased At</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige/25">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-ivory/10 transition-colors">
                    <td className="px-6 py-4 font-semibold text-ticket-charcoal text-sm whitespace-nowrap align-middle">
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{b.booking_number}</span>
                        {isDemoBooking(b) ? (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 whitespace-nowrap">
                            DEMO
                          </span>
                        ) : b.payment_status === 'paid' ? (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
                            REAL PAID
                          </span>
                        ) : null}
                      </div>
                      {b.payment_ref && (
                        <div className="text-[11px] font-mono text-ticket-charcoal/40 font-normal">
                          {b.payment_ref}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap align-middle">
                      <div className="text-sm font-medium text-ticket-charcoal">
                        {b.customer_name || `${b.profiles?.first_name || ''} ${b.profiles?.last_name || ''}`.trim() || 'Valued Guest'}
                      </div>
                      <div className="text-xs text-ticket-charcoal/50">{b.customer_email || b.profiles?.email || '—'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-ticket-charcoal/80 whitespace-nowrap align-middle">
                      {b.events?.event_name || 'Ticket Mahal Event'}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold font-mono text-ticket-charcoal text-center whitespace-nowrap align-middle">
                      {b.ticket_quantity || b.quantity || 1}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-ticket-charcoal font-mono text-right whitespace-nowrap align-middle">
                      AED {Number(b.total_amount || b.total_price || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-center whitespace-nowrap align-middle">
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full border whitespace-nowrap shadow-2xs ${getStatusBadge(b.booking_status, b)}`}>
                        {isDemoBooking(b) ? 'Demo Booking' : (b.booking_status || 'Pending')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-ticket-charcoal/70 whitespace-nowrap align-middle">
                      {formatGstDateTime(b.purchased_at || b.confirmed_at || b.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap align-middle">
                      <button
                        onClick={() => navigate(`/admin/bookings/${b.booking_number}`)}
                        className="p-2 border border-ticket-beige hover:border-ticket-burgundy hover:text-ticket-burgundy text-ticket-charcoal/60 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
