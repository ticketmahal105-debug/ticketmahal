import { useState, useEffect } from 'react';
import { Search, Mail, Phone, Calendar, DollarSign, Award } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          bookings (
            id,
            total_amount,
            booking_status
          ),
          tickets (
            id
          )
        `);

      if (!error) {
        setUsers(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const name = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    const query = search.toLowerCase();

    return name.includes(query) || email.includes(query);
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-playfair text-3xl font-semibold text-charcoal tracking-wide mb-1">Customers Management</h1>
        <p className="text-charcoal/60 text-sm">Review active profiles, transaction counts, and lifetime customer values.</p>
      </div>

      {/* Filter panel */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 border border-beige/60 rounded-3xl shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/40" />
          <input
            type="text"
            placeholder="Search customers by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-ivory border border-beige/60 rounded-full text-sm outline-none focus:border-champagne focus:bg-white transition-all placeholder:text-charcoal/30 text-charcoal"
          />
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-champagne/30 border-t-champagne rounded-full animate-spin" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-20 bg-white border border-beige/60 rounded-3xl shadow-sm">
          <p className="text-charcoal/60 text-sm">No customers found.</p>
        </div>
      ) : (
        <div className="bg-white border border-beige/60 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-beige/40 bg-ivory/30 text-charcoal/50 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Bookings</th>
                  <th className="px-6 py-4">Tickets</th>
                  <th className="px-6 py-4">Lifetime Spend</th>
                  <th className="px-6 py-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige/25">
                {filteredUsers.map((u) => {
                  const confirmedBookings = u.bookings?.filter(b => b.booking_status === 'confirmed') || [];
                  const totalSpend = confirmedBookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
                  const ticketsCount = u.tickets?.length || 0;

                  return (
                    <tr key={u.id} className="hover:bg-ivory/10 transition-colors">
                      <td className="px-6 py-4 font-semibold text-charcoal text-sm">
                        <div className="font-semibold text-charcoal">
                          {u.first_name || '—'} {u.last_name || ''}
                        </div>
                        <div className="text-xs text-charcoal/40 font-mono select-all">{u.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-charcoal/80">
                          <Mail size={14} className="text-champagne shrink-0" />
                          <span>{u.email}</span>
                        </div>
                        {u.phone && (
                          <div className="flex items-center gap-2 text-xs text-charcoal/50 mt-1">
                            <Phone size={12} className="text-champagne shrink-0" />
                            <span>{u.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold">
                        <span className={`px-2.5 py-0.5 rounded-full border ${
                          u.role === 'admin' 
                            ? 'bg-champagne/10 text-champagne border-champagne/30' 
                            : 'bg-beige/20 text-charcoal/60 border-beige/40'
                        }`}>
                          {u.role || 'user'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-charcoal/80">
                        {u.bookings?.length || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-charcoal/80">
                        {ticketsCount}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-charcoal">
                        AED {totalSpend.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-charcoal/50">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
