import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Receipt, Ticket, Users, Calendar, ArrowRight, ShieldCheck, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getAllBookingsAdmin } from '../../services/bookingsService';
import { getAdminEvents } from '../../services/eventsService';
import { getWishlistAnalyticsAdmin } from '../../services/wishlistService';
import { exportTicketMahalFullReport } from '../../utils/excelReportGenerator';
import { formatGstRecent } from '../../utils/dateUtils';
import StatCard from '../components/StatCard';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    revenue: 0,
    bookings: 0,
    demoBookings: 0,
    tickets: 0,
    users: 0,
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [rawBookings, setRawBookings] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        let serverData = null;
        try {
          const res = await fetch('/api/admin-bookings');
          const contentType = res.headers.get('content-type') || '';
          if (res.ok && contentType.includes('application/json')) {
            serverData = await res.json();
          }
        } catch (_) {}

        let list = [];
        let acts = [];

        if (serverData?.success) {
          list = serverData.bookings || [];
          acts = serverData.activities || [];
          if (serverData.stats) {
            setStats(serverData.stats);
          }
        } else {
          const { data: allBookings } = await getAllBookingsAdmin();
          list = allBookings || [];

          const realPaid = list.filter(b => 
            (b.payment_status === 'paid' || b.booking_status === 'completed') && 
            b.payment_provider !== 'demo' && 
            b.payment_mode !== 'demo' &&
            b.payment_status !== 'demo_paid'
          );

          const demoPaid = list.filter(b => 
            b.payment_status === 'demo_paid' || 
            b.payment_provider === 'demo' || 
            b.payment_mode === 'demo'
          );

          const totalRealRevenue = realPaid.reduce((sum, b) => sum + Number(b.total_amount || b.total_price || 0), 0);
          const totalTicketsSold = list.reduce((sum, b) => sum + Number(b.quantity || b.ticket_quantity || 1), 0);

          let userCount = 0;
          try {
            const { count } = await supabase.from('profiles').select('id', { count: 'exact' });
            userCount = count || 0;
          } catch (_) {}

          setStats({
            revenue: totalRealRevenue,
            bookings: list.length,
            demoBookings: demoPaid.length,
            tickets: totalTicketsSold,
            users: userCount,
          });
        }

        setRawBookings(list);
        setActivities(acts);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const { data: allEvents } = await getAdminEvents();
      let allTickets = [];
      try {
        const { data: tData } = await supabase.from('tickets').select('*');
        if (tData) allTickets = tData;
      } catch (_) {}

      if (typeof window !== 'undefined') {
        try {
          const localT = JSON.parse(localStorage.getItem('tm_local_tickets') || '[]');
          allTickets = [...allTickets, ...localT];
        } catch (_) {}
      }

      let wishlistStats = [];
      try {
        const { data: wData } = await getWishlistAnalyticsAdmin();
        if (wData) wishlistStats = wData;
      } catch (_) {}

      exportTicketMahalFullReport({
        bookings: rawBookings,
        tickets: allTickets,
        customers: [],
        events: allEvents || [],
        activities: activities,
        wishlistAnalytics: wishlistStats
      });
    } catch (err) {
      console.error('Export error:', err);
      alert('Could not generate Excel report: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (val) => {
    return `AED ${Number(val).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const isDemo = (b) => {
    return b.payment_status === 'demo_paid' || b.payment_provider === 'demo' || b.payment_mode === 'demo';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-ticket-gold/30 border-t-ticket-burgundy rounded-full animate-spin" />
      </div>
    );
  }

  const recentBookings = [...rawBookings]
    .sort((a, b) => new Date(b.purchased_at || b.confirmed_at || b.created_at || 0) - new Date(a.purchased_at || a.confirmed_at || a.created_at || 0))
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-playfair text-3xl font-semibold text-ticket-charcoal tracking-wide mb-1">
            Dashboard Overview
          </h1>
          <p className="text-ticket-charcoal/60 text-sm">
            Live operations, genuine ticket sales, and customer purchases.
          </p>
        </div>
        <button
          onClick={handleExportExcel}
          disabled={exporting}
          className="px-5 py-2.5 bg-ticket-burgundy text-white hover:bg-[#601822] font-bold rounded-2xl shadow-sm text-xs uppercase tracking-wider flex items-center gap-2 self-start sm:self-auto transition-all cursor-pointer"
        >
          <FileSpreadsheet size={16} />
          {exporting ? 'Exporting...' : 'Download Full Excel Report (.xlsx)'}
        </button>
      </div>

      {/* Real KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Real Revenue" 
          value={formatCurrency(stats.revenue)} 
          icon={<DollarSign size={20} />} 
          trend="up" 
          trendValue={stats.demoBookings > 0 ? `${stats.demoBookings} Demo excluded` : 'Live Gateway'} 
          delay={0.1} 
        />
        <StatCard 
          title="Total Bookings" 
          value={stats.bookings.toLocaleString()} 
          icon={<Receipt size={20} />} 
          trend="up" 
          trendValue={`${stats.demoBookings} Demo / Test`} 
          delay={0.2} 
        />
        <StatCard 
          title="Tickets Issued" 
          value={stats.tickets.toLocaleString()} 
          icon={<Ticket size={20} />} 
          trend="up" 
          trendValue="Admissions" 
          delay={0.3} 
        />
        <StatCard 
          title="Total Users" 
          value={stats.users.toLocaleString()} 
          icon={<Users size={20} />} 
          trend="up" 
          trendValue="Customer Accounts" 
          delay={0.4} 
        />
      </div>

      {/* Main Grid: Real Recent Purchases Ledger & Real Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Real Customer Purchases Ledger (2 Columns) */}
        <div className="lg:col-span-2 bg-ticket-white border border-ticket-beige/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-ticket-beige/40 mb-4">
              <div>
                <h3 className="font-playfair text-lg font-semibold text-ticket-charcoal">
                  Recent Customer Purchases
                </h3>
                <p className="text-xs text-ticket-charcoal/50">
                  Real-time ticket orders from customer checkouts
                </p>
              </div>
              <button
                onClick={() => navigate('/admin/bookings')}
                className="text-xs font-semibold text-ticket-burgundy hover:underline flex items-center gap-1 cursor-pointer"
              >
                View All <ArrowRight size={14} />
              </button>
            </div>

            {recentBookings.length === 0 ? (
              <div className="py-12 text-center text-ticket-charcoal/50">
                <Receipt size={32} className="mx-auto text-ticket-charcoal/30 mb-2" />
                <p className="text-sm font-medium">No customer purchases recorded yet.</p>
                <p className="text-xs text-ticket-charcoal/40 mt-1">
                  Newly purchased tickets will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-ticket-beige/40 text-ticket-charcoal/50 uppercase tracking-wider text-[10px]">
                      <th className="pb-3 font-semibold">Booking Ref</th>
                      <th className="pb-3 font-semibold">Customer</th>
                      <th className="pb-3 font-semibold">Event / Seats</th>
                      <th className="pb-3 font-semibold">Amount</th>
                      <th className="pb-3 font-semibold">Purchased</th>
                      <th className="pb-3 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ticket-beige/30">
                    {recentBookings.map((b) => (
                      <tr 
                        key={b.booking_number || b.id}
                        onClick={() => navigate(`/admin/bookings/${b.booking_number}`)}
                        className="hover:bg-ticket-beige/10 transition-colors cursor-pointer"
                      >
                        <td className="py-3 font-mono font-bold text-ticket-burgundy">
                          {b.booking_number}
                        </td>
                        <td className="py-3">
                          <div className="font-semibold text-ticket-charcoal">
                            {b.customer_name || `${b.profiles?.first_name || ''} ${b.profiles?.last_name || ''}`.trim() || 'Valued Guest'}
                          </div>
                          <div className="text-[11px] text-ticket-charcoal/50 truncate max-w-[130px]">
                            {b.customer_email || b.profiles?.email || '—'}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="font-medium text-ticket-charcoal truncate max-w-[150px]">
                            {b.events?.event_name || 'Ticket Mahal Event'}
                          </div>
                          <div className="text-[11px] text-ticket-burgundy/80 font-medium">
                            {b.seats ? `Seat(s): ${b.seats}` : `${b.quantity || 1} Admission(s)`}
                          </div>
                        </td>
                        <td className="py-3 font-bold text-ticket-charcoal">
                          AED {b.total_amount || b.total_price || 0}
                        </td>
                        <td className="py-3 font-mono text-[11px] text-ticket-charcoal/70 whitespace-nowrap">
                          {formatGstRecent(b.purchased_at || b.confirmed_at || b.created_at)}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                            isDemo(b)
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-green-50 text-green-700 border-green-200'
                          }`}>
                            {isDemo(b) ? 'Demo Booking' : 'Paid'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Real Recent Activity / Audit Trail (1 Column) */}
        <div className="bg-ticket-white border border-ticket-beige/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-ticket-beige/40 mb-4">
              <h3 className="font-playfair text-lg font-semibold text-ticket-charcoal">
                Recent Activity
              </h3>
              <p className="text-xs text-ticket-charcoal/50">
                Live audit trail of customer bookings
              </p>
            </div>
            
            {activities.length === 0 && recentBookings.length === 0 ? (
              <div className="py-12 text-center text-ticket-charcoal/50">
                <ShieldCheck size={28} className="mx-auto text-ticket-charcoal/30 mb-2" />
                <p className="text-xs">No recent transactions yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5">
                {(activities.length > 0 ? activities.slice(0, 5) : recentBookings.slice(0, 5).map(b => ({
                  id: b.booking_number,
                  customer: b.customer_name || 'Customer',
                  event: b.events?.event_name || 'Event',
                  bookingReference: b.booking_number,
                  details: `${b.quantity || 1} seat(s) confirmed. Total: AED ${b.total_amount || 0}`,
                  timestamp: b.created_at
                }))).map((act, i) => (
                  <div key={act.id || i} className="flex gap-3 items-start pb-3 border-b border-ticket-beige/20 last:border-b-0">
                    <div className="mt-0.5 p-1.5 rounded-lg bg-ticket-burgundy/10 text-ticket-burgundy">
                      <Receipt size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-ticket-charcoal truncate">
                          {act.customer || 'Customer'}
                        </p>
                        <span className="text-[10px] text-ticket-charcoal/40 whitespace-nowrap">
                          {act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-ticket-burgundy font-medium truncate">
                        {act.bookingReference ? `Ref #${act.bookingReference}` : act.event}
                      </p>
                      <p className="text-[11px] text-ticket-charcoal/60 line-clamp-1">
                        {act.details || act.event}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-ticket-beige/40 text-center">
            <span className="text-[11px] font-medium text-ticket-charcoal/50 flex items-center justify-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-600" />
              Verified Event Engine Active
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
