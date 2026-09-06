import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Filter } from 'lucide-react';
import { getAllBookingsAdmin } from '../../services/bookingsService';

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
                          
    const matchesStatus = statusFilter === 'all' ? true : b.booking_status?.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'refunded':
        return 'bg-ticket-cream text-ticket-muted border-gray-300';
      default:
        return 'bg-beige/20 text-ticket-charcoal/60 border-ticket-beige/40';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-playfair text-3xl font-semibold text-ticket-charcoal tracking-wide mb-1">Bookings Management</h1>
        <p className="text-ticket-charcoal/60 text-sm">View, track, and manage all customer bookings and transaction states.</p>
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
          {['all', 'confirmed', 'pending', 'cancelled', 'refunded'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-full text-xs font-medium border capitalize whitespace-nowrap transition-all ${
                statusFilter === status
                  ? 'bg-ticket-burgundy/10 text-ticket-burgundy border-ticket-gold/30'
                  : 'bg-ticket-white text-ticket-charcoal/60 border-ticket-beige/60 hover:bg-ivory'
              }`}
            >
              {status}
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
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-ticket-beige/40 bg-ticket-ivory/30 text-ticket-charcoal/50 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Booking Ref</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Event</th>
                  <th className="px-6 py-4">Tickets</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige/25">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-ivory/10 transition-colors">
                    <td className="px-6 py-4 font-semibold text-ticket-charcoal text-sm">
                      {b.booking_number}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-ticket-charcoal">
                        {b.profiles?.first_name} {b.profiles?.last_name}
                      </div>
                      <div className="text-xs text-ticket-charcoal/50">{b.profiles?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-ticket-charcoal/80">
                      {b.events?.event_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-ticket-charcoal/80">
                      {b.ticket_quantity || 1}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-ticket-charcoal">
                      AED {Number(b.total_amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold">
                      <span className={`px-2.5 py-1 rounded-full border ${getStatusBadge(b.booking_status)}`}>
                        {b.booking_status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-ticket-charcoal/50">
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/admin/bookings/${b.booking_number}`)}
                        className="p-2 border border-ticket-beige hover:border-ticket-burgundy hover:text-ticket-burgundy text-ticket-charcoal/60 rounded-xl transition-all"
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
