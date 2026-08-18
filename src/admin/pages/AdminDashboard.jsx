import { useState, useEffect } from 'react';
import { DollarSign, Receipt, Ticket, Users, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import StatCard from '../components/StatCard';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    revenue: 0,
    bookings: 0,
    tickets: 0,
    users: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch basic counts
        const [bookingsRes, ticketsRes, profilesRes] = await Promise.all([
          supabase.from('bookings').select('id, total_amount', { count: 'exact' }),
          supabase.from('tickets').select('id', { count: 'exact' }),
          supabase.from('profiles').select('id', { count: 'exact' })
        ]);

        const totalRevenue = bookingsRes.data?.reduce((sum, b) => sum + Number(b.total_amount || 0), 0) || 0;

        setStats({
          revenue: totalRevenue,
          bookings: bookingsRes.count || 0,
          tickets: ticketsRes.count || 0,
          users: profilesRes.count || 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = (val) => {
    return `AED ${Number(val).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-champagne/30 border-t-champagne rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-playfair text-3xl font-semibold text-charcoal tracking-wide mb-2">Dashboard Overview</h1>
        <p className="text-charcoal/60 text-sm">Welcome back. Here's what's happening today.</p>
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
        <div className="lg:col-span-2 bg-white border border-beige/60 rounded-3xl p-6 shadow-sm min-h-[300px] flex flex-col items-center justify-center text-center">
          <Calendar size={32} className="text-champagne/40 mb-3" />
          <h3 className="text-charcoal font-semibold mb-1">Sales Overview</h3>
          <p className="text-charcoal/50 text-sm">Chart integration coming soon.</p>
        </div>

        {/* Placeholder: Recent Alerts / Activity */}
        <div className="bg-white border border-beige/60 rounded-3xl p-6 shadow-sm min-h-[300px]">
          <h3 className="font-playfair text-lg font-semibold text-charcoal mb-4 border-b border-beige/40 pb-2">Recent Activity</h3>
          
          <div className="flex flex-col gap-4">
            <div className="flex gap-3 items-start">
              <div className="mt-0.5"><AlertCircle size={16} className="text-amber-500" /></div>
              <div>
                <p className="text-sm font-medium text-charcoal">Low Inventory Warning</p>
                <p className="text-xs text-charcoal/60">Coldplay Live - VIP Tickets (5 left)</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="mt-0.5"><Receipt size={16} className="text-green-500" /></div>
              <div>
                <p className="text-sm font-medium text-charcoal">New Booking</p>
                <p className="text-xs text-charcoal/60">TM-BK-48291 confirmed (AED 1,200)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
