import { useState, useEffect } from 'react';
import { 
  Search, Mail, Phone, Calendar, DollarSign, Award, 
  User, Receipt, Ticket, Activity, X, Eye, ExternalLink, ShieldAlert 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatGstDateTime } from '../../utils/dateUtils';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'registered' | 'guest' | 'has_bookings'
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Supabase registered profiles
      let profiles = [];
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) profiles = data;
      } catch (_) {}

      // 2. Fetch authoritative bookings, tickets, activities
      const res = await fetch('/api/admin-bookings');
      const json = await res.json();
      const allBookings = json.bookings || [];
      const allTickets = json.tickets || [];
      const allActivities = json.activities || [];

      setBookings(allBookings);
      setTickets(allTickets);
      setActivities(allActivities);

      // 3. Build unified customer list (Registered + Quick Order / Guests)
      const customerMap = new Map();

      // Add registered profiles
      profiles.forEach(p => {
        const email = (p.email || '').toLowerCase().trim();
        if (!email) return;

        const userBookings = allBookings.filter(b => 
          b.user_id === p.id || 
          (b.customer_email && b.customer_email.toLowerCase() === email) ||
          (b.profiles?.email && b.profiles.email.toLowerCase() === email)
        );

        const userTickets = allTickets.filter(t => 
          t.user_id === p.id || 
          userBookings.some(b => b.booking_number === t.booking_reference || b.id === t.booking_id)
        );

        const totalSpend = userBookings
          .filter(b => b.booking_status === 'confirmed' || b.payment_status === 'paid' || b.payment_status === 'demo_paid')
          .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

        const lastBooking = userBookings.length > 0 ? userBookings[0].created_at : null;

        customerMap.set(email, {
          id: p.id,
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || email.split('@')[0],
          first_name: p.first_name || '',
          last_name: p.last_name || '',
          email: p.email,
          phone: p.phone || '—',
          account_type: p.role === 'admin' ? 'Admin' : (p.app_metadata?.provider === 'google' ? 'Google' : 'Registered'),
          signup_method: p.app_metadata?.provider || 'Email',
          joined_date: p.created_at || '—',
          bookings_count: userBookings.length,
          tickets_count: userTickets.length,
          total_spend: totalSpend,
          last_booking: lastBooking,
          bookings: userBookings,
          tickets: userTickets
        });
      });

      // Add guest customers from bookings who are not registered
      allBookings.forEach(b => {
        const email = (b.customer_email || b.profiles?.email || '').toLowerCase().trim();
        if (!email) return;

        if (!customerMap.has(email)) {
          const guestBookings = allBookings.filter(item => 
            (item.customer_email && item.customer_email.toLowerCase() === email) ||
            (item.profiles?.email && item.profiles.email.toLowerCase() === email)
          );

          const guestTickets = allTickets.filter(t => 
            guestBookings.some(gb => gb.booking_number === t.booking_reference || gb.id === t.booking_id)
          );

          const totalSpend = guestBookings
            .filter(gb => gb.booking_status === 'confirmed' || gb.payment_status === 'paid' || gb.payment_status === 'demo_paid')
            .reduce((sum, gb) => sum + Number(gb.total_amount || 0), 0);

          customerMap.set(email, {
            id: `guest-${b.booking_number}`,
            name: b.customer_name || 'Guest Customer',
            first_name: (b.customer_name || 'Guest').split(' ')[0],
            last_name: (b.customer_name || '').split(' ').slice(1).join(' '),
            email: email,
            phone: b.customer_phone || '—',
            account_type: 'Quick Order / Guest',
            signup_method: 'Guest Checkout',
            joined_date: b.created_at || new Date().toISOString(),
            bookings_count: guestBookings.length,
            tickets_count: guestTickets.length,
            total_spend: totalSpend,
            last_booking: b.created_at,
            bookings: guestBookings,
            tickets: guestTickets
          });
        }
      });

      setUsers(Array.from(customerMap.values()));
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const query = search.toLowerCase();
    const matchesSearch = 
      (u.name || '').toLowerCase().includes(query) || 
      (u.email || '').toLowerCase().includes(query) ||
      (u.phone || '').toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (filterType === 'registered') {
      return u.account_type === 'Registered' || u.account_type === 'Google' || u.account_type === 'Admin';
    }
    if (filterType === 'guest') {
      return u.account_type.includes('Guest') || u.account_type.includes('Quick Order');
    }
    if (filterType === 'has_bookings') {
      return u.bookings_count > 0;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-playfair text-3xl font-semibold text-ticket-charcoal tracking-wide mb-1">Users & Customer Profiles</h1>
          <p className="text-ticket-charcoal/60 text-sm">Real Ticket Mahal customers, guest order profiles, transaction history, and total lifetime spend.</p>
        </div>
      </div>

      {/* Filter panel */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-ticket-white p-4 border border-ticket-beige/60 rounded-3xl shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ticket-charcoal/40" />
          <input
            type="text"
            placeholder="Search by name, email, or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-ticket-ivory border border-ticket-beige/60 rounded-full text-sm outline-none focus:border-ticket-gold focus:bg-white transition-all placeholder:text-ticket-charcoal/30 text-ticket-charcoal"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto py-1">
          {[
            { id: 'all', label: 'All Customers' },
            { id: 'registered', label: 'Registered Members' },
            { id: 'guest', label: 'Quick Order / Guest' },
            { id: 'has_bookings', label: 'Has Bookings' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-4 py-2 rounded-full text-xs font-medium border capitalize whitespace-nowrap transition-all ${
                filterType === f.id
                  ? 'bg-ticket-burgundy/10 text-ticket-burgundy border-ticket-gold/30 font-bold'
                  : 'bg-ticket-white text-ticket-charcoal/60 border-ticket-beige/60 hover:bg-ivory'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-ticket-gold/30 border-t-ticket-burgundy rounded-full animate-spin" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-20 bg-ticket-white border border-ticket-beige/60 rounded-3xl shadow-sm">
          <p className="text-ticket-charcoal/60 text-sm">No customers found matching your criteria.</p>
        </div>
      ) : (
        <div className="bg-ticket-white border border-ticket-beige/60 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-ticket-beige/40 bg-ticket-ivory/30 text-ticket-charcoal/50 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Account Type</th>
                  <th className="px-6 py-4">Bookings</th>
                  <th className="px-6 py-4">Tickets</th>
                  <th className="px-6 py-4">Total Spend</th>
                  <th className="px-6 py-4">Last Activity</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige/25">
                {filteredUsers.map((u) => (
                  <tr key={u.email} className="hover:bg-ivory/10 transition-colors">
                    <td className="px-6 py-4 font-semibold text-ticket-charcoal text-sm">
                      <div className="font-semibold text-ticket-charcoal font-playfair text-base">
                        {u.name}
                      </div>
                      <div className="text-xs text-ticket-charcoal/40 font-mono select-all">
                        {u.id}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-ticket-charcoal/80">
                        <Mail size={13} className="text-ticket-burgundy shrink-0" />
                        <span>{u.email}</span>
                      </div>
                      {u.phone && u.phone !== '—' && (
                        <div className="flex items-center gap-2 text-xs text-ticket-charcoal/50 mt-1">
                          <Phone size={11} className="text-ticket-burgundy shrink-0" />
                          <span>{u.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold">
                      <span className={`px-2.5 py-0.5 rounded-full border ${
                        u.account_type === 'Admin' 
                          ? 'bg-ticket-burgundy/10 text-ticket-burgundy border-ticket-gold/30 font-bold'
                          : u.account_type === 'Google'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : u.account_type.includes('Guest')
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {u.account_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold font-mono text-ticket-charcoal">
                      {u.bookings_count}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold font-mono text-ticket-burgundy">
                      {u.tickets_count}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-ticket-charcoal font-mono">
                      AED {u.total_spend.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-xs text-ticket-charcoal/50">
                      {u.last_booking ? new Date(u.last_booking).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedCustomer(u)}
                        className="px-3 py-1.5 text-xs font-semibold text-ticket-burgundy border border-ticket-beige hover:border-ticket-burgundy hover:bg-ticket-burgundy/5 rounded-xl transition-all"
                      >
                        View History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CUSTOMER DETAIL DRAWER (Section F Requirement) */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-ticket-white rounded-3xl border border-ticket-beige/80 shadow-2xl p-6 sm:p-8 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-ticket-beige/60 pb-4 mb-6">
              <div>
                <span className="text-xs uppercase tracking-wider text-ticket-burgundy font-bold">Customer Profile & History</span>
                <h3 className="font-playfair text-2xl font-bold text-ticket-charcoal">{selectedCustomer.name}</h3>
                <p className="text-xs text-ticket-charcoal/60 mt-0.5">{selectedCustomer.email} • {selectedCustomer.phone}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 rounded-full hover:bg-ticket-ivory text-ticket-charcoal/60"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Profile KPI Row */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-ticket-ivory rounded-2xl border border-ticket-beige/60 text-center">
                <div>
                  <span className="text-[10px] text-ticket-charcoal/50 uppercase font-semibold block">Account Tier</span>
                  <span className="font-bold text-ticket-charcoal text-sm">{selectedCustomer.account_type}</span>
                </div>
                <div>
                  <span className="text-[10px] text-ticket-charcoal/50 uppercase font-semibold block">Total Admissions</span>
                  <span className="font-bold text-ticket-burgundy text-sm">{selectedCustomer.tickets_count} Tickets</span>
                </div>
                <div>
                  <span className="text-[10px] text-ticket-charcoal/50 uppercase font-semibold block">Lifetime Spend</span>
                  <span className="font-bold text-ticket-charcoal text-sm font-mono">AED {selectedCustomer.total_spend.toLocaleString()}</span>
                </div>
              </div>

              {/* Booking History */}
              <div>
                <h4 className="font-playfair text-lg font-bold text-ticket-charcoal mb-3 flex items-center gap-2">
                  <Receipt size={18} className="text-ticket-burgundy" /> Booking Transactions ({selectedCustomer.bookings?.length || 0})
                </h4>
                {selectedCustomer.bookings?.length === 0 ? (
                  <p className="text-xs text-ticket-charcoal/50 italic p-3 bg-ticket-ivory rounded-xl">No bookings on file.</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {selectedCustomer.bookings.map(b => (
                      <div key={b.booking_number} className="p-3 bg-white border border-ticket-beige/60 rounded-xl flex items-center justify-between text-xs gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-ticket-burgundy">{b.booking_number}</span>
                            <span className="text-ticket-charcoal/80 font-semibold">{b.events?.event_name || 'Event'}</span>
                          </div>
                          <div className="text-[11px] text-ticket-charcoal/60">
                            {b.quantity || b.ticket_quantity || 1} Ticket(s) {b.seats ? `· Seat(s): ${b.seats}` : ''}
                          </div>
                          <div className="text-[11px] text-ticket-charcoal/50 font-mono">
                            Purchased: <strong>{formatGstDateTime(b.purchased_at || b.confirmed_at || b.created_at)}</strong>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold font-mono text-ticket-charcoal block">AED {b.total_amount || b.total_price || 0}</span>
                          <span className="inline-block mt-0.5 text-[10px] font-bold text-emerald-700 uppercase bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {b.booking_status || b.payment_status || 'confirmed'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ticket History */}
              <div>
                <h4 className="font-playfair text-lg font-bold text-ticket-charcoal mb-3 flex items-center gap-2">
                  <Ticket size={18} className="text-ticket-burgundy" /> Issued Tickets ({selectedCustomer.tickets?.length || 0})
                </h4>
                {selectedCustomer.tickets?.length === 0 ? (
                  <p className="text-xs text-ticket-charcoal/50 italic p-3 bg-ticket-ivory rounded-xl">No individual tickets issued.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedCustomer.tickets.map(t => (
                      <div key={t.ticket_number} className="p-3 bg-white border border-ticket-beige/60 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono font-bold text-ticket-charcoal">{t.ticket_number}</span>
                          <span className="text-ticket-charcoal/60 ml-2">Seat: {t.seat || 'General'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            t.status === 'valid' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {t.status}
                          </span>
                          <a
                            href={`/view-ticket/${t.ticket_number}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-ticket-burgundy font-semibold hover:underline"
                          >
                            Pass
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
