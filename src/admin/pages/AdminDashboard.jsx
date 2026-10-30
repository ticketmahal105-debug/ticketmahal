import { useState, useEffect } from 'react';
import { DollarSign, Receipt, Ticket, Users, Calendar, AlertCircle, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getAllBookingsAdmin } from '../../services/bookingsService';
import { getAdminEvents } from '../../services/eventsService';
import { exportTicketMahalFullReport } from '../../utils/excelReportGenerator';
import StatCard from '../components/StatCard';

const AdminDashboard = () => {
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: allBookings } = await getAllBookingsAdmin();
        const list = allBookings || [];

        // STRICT SEPARATION: Demo transactions are NEVER counted in real revenue
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

        setRawBookings(list);
        setStats({
          revenue: totalRealRevenue,
          bookings: list.length,
          demoBookings: demoPaid.length,
          tickets: totalTicketsSold,
          users: userCount,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
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

      exportTicketMahalFullReport({
        bookings: rawBookings,
        tickets: allTickets,
        customers: [],
        events: allEvents || [],
        activities: []
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-ticket-gold/30 border-t-ticket-burgundy rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-playfair text-3xl font-semibold text-ticket-charcoal tracking-wide mb-1">Dashboard Overview</h1>
          <p className="text-ticket-charcoal/60 text-sm">Welcome back. Here's what's happening today.</p>
        </div>
        <button
          onClick={handleExportExcel}
          disabled={exporting}
          className="px-5 py-2.5 bg-ticket-burgundy text-white hover:bg-[#601822] font-bold rounded-2xl shadow-sm text-xs uppercase tracking-wider flex items-center gap-2 self-start sm:self-auto transition-all"
        >
          <FileSpreadsheet size={16} />
          {exporting ? 'Exporting...' : 'Download Full Excel Report (.xlsx)'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(stats.revenue)} 
          icon={<DollarSign size={20} />} 
          trend="up" 
          trendValue="12.5%" 
          delay={0.1} 
        />
        <StatCard 
          title="Total Bookings" 
          value={stats.bookings.toLocaleString()} 
          icon={<Receipt size={20} />} 
          trend="up" 
          trendValue="8.2%" 
          delay={0.2} 
        />
        <StatCard 
          title="Tickets Sold" 
          value={stats.tickets.toLocaleString()} 
          icon={<Ticket size={20} />} 
          trend="up" 
          trendValue="15.3%" 
          delay={0.3} 
        />
        <StatCard 
          title="Total Users" 
          value={stats.users.toLocaleString()} 
          icon={<Users size={20} />} 
          trend="up" 
          trendValue="2.4%" 
          delay={0.4} 
        />
      </div>

      {/* Grid for complex widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Placeholder: Sales Chart */}
        <div className="lg:col-span-2 bg-ticket-white border border-ticket-beige/60 rounded-3xl p-6 shadow-sm min-h-[300px] flex flex-col items-center justify-center text-center">
          <Calendar size={32} className="text-ticket-burgundy/40 mb-3" />
          <h3 className="text-ticket-charcoal font-semibold mb-1">Sales Overview</h3>
          <p className="text-ticket-charcoal/50 text-sm">Chart integration coming soon.</p>
        </div>

        {/* Placeholder: Recent Alerts / Activity */}
        <div className="bg-ticket-white border border-ticket-beige/60 rounded-3xl p-6 shadow-sm min-h-[300px]">
          <h3 className="font-playfair text-lg font-semibold text-ticket-charcoal mb-4 border-b border-ticket-beige/40 pb-2">Recent Activity</h3>
          
          <div className="flex flex-col gap-4">
            <div className="flex gap-3 items-start">
              <div className="mt-0.5"><AlertCircle size={16} className="text-amber-500" /></div>
              <div>
                <p className="text-sm font-medium text-ticket-charcoal">Low Inventory Warning</p>
                <p className="text-xs text-ticket-charcoal/60">Coldplay Live - VIP Tickets (5 left)</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="mt-0.5"><Receipt size={16} className="text-green-500" /></div>
              <div>
                <p className="text-sm font-medium text-ticket-charcoal">New Booking</p>
                <p className="text-xs text-ticket-charcoal/60">TM-BK-48291 confirmed (AED 1,200)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
