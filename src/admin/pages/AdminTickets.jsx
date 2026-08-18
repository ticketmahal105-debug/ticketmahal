import { useState, useEffect } from 'react';
import { Search, CheckCircle2, XCircle } from 'lucide-react';
import { getAllTicketsAdmin } from '../../services/ticketsService';
import { supabase } from '../../lib/supabase';

const AdminTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    const { data, error } = await getAllTicketsAdmin();
    if (!error) {
      setTickets(data || []);
    }
    setLoading(false);
  };

  const handleToggleUsed = async (ticket) => {
    const newStatus = ticket.status === 'used' ? 'active' : 'used';
    const usedAt = newStatus === 'used' ? new Date().toISOString() : null;
    
    const { error } = await supabase
      .from('tickets')
      .update({ status: newStatus, used_at: usedAt })
      .eq('id', ticket.id);

    if (!error) {
      setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: newStatus, used_at: usedAt } : t));
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const ticketNum = (t.ticket_number || '').toLowerCase();
    const bookingNum = (t.booking_id || '').toLowerCase(); // Note: booking_id might be a UUID, but booking_number can also be joined if available.
    const custName = `${t.profiles?.first_name || ''} ${t.profiles?.last_name || ''}`.toLowerCase();
    const eventName = (t.events?.event_name || '').toLowerCase();

    const query = search.toLowerCase();
    const matchesSearch = ticketNum.includes(query) || 
                          bookingNum.includes(query) || 
                          custName.includes(query) || 
                          eventName.includes(query);

    const matchesStatus = statusFilter === 'all' ? true : t.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'used':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'expired':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-beige/20 text-charcoal/60 border-beige/40';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-playfair text-3xl font-semibold text-charcoal tracking-wide mb-1">Tickets Inventory</h1>
        <p className="text-charcoal/60 text-sm">Monitor all individual issued tickets, check-in states, and validation logs.</p>
      </div>

      {/* Filter panel */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 border border-beige/60 rounded-3xl shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/40" />
          <input
            type="text"
            placeholder="Search ticket #, customer, event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-ivory border border-beige/60 rounded-full text-sm outline-none focus:border-champagne focus:bg-white transition-all placeholder:text-charcoal/30 text-charcoal"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto py-1">
          {['all', 'active', 'used', 'cancelled', 'expired'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-full text-xs font-medium border capitalize whitespace-nowrap transition-all ${
                statusFilter === status
                  ? 'bg-champagne/10 text-champagne border-champagne/30'
                  : 'bg-white text-charcoal/60 border-beige/60 hover:bg-ivory'
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
          <div className="w-8 h-8 border-2 border-champagne/30 border-t-champagne rounded-full animate-spin" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-20 bg-white border border-beige/60 rounded-3xl shadow-sm">
          <p className="text-charcoal/60 text-sm">No tickets found.</p>
        </div>
      ) : (
        <div className="bg-white border border-beige/60 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-beige/40 bg-ivory/30 text-charcoal/50 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Ticket Number</th>
                  <th className="px-6 py-4">Event</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Type / Tier</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Check-In Time</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige/25">
                {filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-ivory/10 transition-colors">
                    <td className="px-6 py-4 font-semibold text-charcoal text-sm">
                      {t.ticket_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-charcoal/80 font-playfair font-semibold">
                      {t.events?.event_name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-charcoal">
                        {t.profiles?.first_name} {t.profiles?.last_name}
                      </div>
                      <div className="text-xs text-charcoal/50">{t.profiles?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-charcoal/80 font-medium uppercase tracking-wider text-xs text-champagne">
                      {t.ticket_type || 'General'}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold">
                      <span className={`px-2.5 py-1 rounded-full border ${getStatusBadge(t.status)}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-charcoal/50">
                      {t.used_at ? new Date(t.used_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {t.status !== 'cancelled' && (
                        <button
                          onClick={() => handleToggleUsed(t)}
                          className={`p-2 border border-beige rounded-xl transition-all ${
                            t.status === 'used'
                              ? 'hover:border-green-500 hover:text-green-500 text-green-600'
                              : 'hover:border-champagne hover:text-champagne text-charcoal/60'
                          }`}
                          title={t.status === 'used' ? 'Mark Active' : 'Mark Used / Check-in'}
                        >
                          {t.status === 'used' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        </button>
                      )}
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

export default AdminTickets;
