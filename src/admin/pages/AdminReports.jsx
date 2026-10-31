import { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Calendar, DollarSign, Ticket, Users, 
  Receipt, TrendingUp, CheckCircle2, ShieldCheck, Tag, Filter, RefreshCw
} from 'lucide-react';
import { exportTicketMahalFullReport } from '../../utils/excelReportGenerator';

const AdminReports = () => {
  const [dateRange, setDateRange] = useState('30days'); // 'today' | '7days' | '30days' | 'all'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);

  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [activities, setActivities] = useState([]);
  const [events, setEvents] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // 1. Fetch bookings, tickets, and activities
      const resBookings = await fetch('/api/admin-bookings');
      const jsonBookings = await resBookings.json();

      // 2. Fetch events
      const resEvents = await fetch('/api/admin-events');
      const jsonEvents = await resEvents.json();

      // 3. Fetch promo codes
      const resPromos = await fetch('/api/admin-promo-codes');
      const jsonPromos = await resPromos.json();

      if (jsonBookings.success) {
        setBookings(jsonBookings.bookings || []);
        setTickets(jsonBookings.tickets || []);
        setActivities(jsonBookings.activities || []);
      }
      if (jsonEvents.success) {
        setEvents(jsonEvents.events || []);
      }
      if (jsonPromos.success) {
        setPromoCodes(jsonPromos.promoCodes || []);
      }
    } catch (err) {
      console.error('Error fetching reporting data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings based on selected date range
  const filteredBookings = bookings.filter(b => {
    if (!b.created_at) return true;
    const bDate = new Date(b.created_at);
    const now = new Date();

    if (dateRange === 'today') {
      return bDate.toDateString() === now.toDateString();
    }
    if (dateRange === '7days') {
      const past7 = new Date();
      past7.setDate(now.getDate() - 7);
      return bDate >= past7;
    }
    if (dateRange === '30days') {
      const past30 = new Date();
      past30.setDate(now.getDate() - 30);
      return bDate >= past30;
    }
    if (dateRange === 'custom') {
      if (customStart && bDate < new Date(customStart)) return false;
      if (customEnd && bDate > new Date(customEnd + 'T23:59:59')) return false;
      return true;
    }
    return true;
  });

  // Strict Separation: Demo Revenue vs Real Revenue (Section J Requirement)
  const realBookings = filteredBookings.filter(b => 
    (b.payment_status === 'paid' || b.booking_status === 'completed') &&
    b.payment_provider !== 'demo' &&
    b.payment_mode !== 'demo' &&
    b.payment_status !== 'demo_paid'
  );

  const demoBookings = filteredBookings.filter(b => 
    b.payment_status === 'demo_paid' ||
    b.payment_provider === 'demo' ||
    b.payment_mode === 'demo'
  );

  const realRevenue = realBookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
  const demoRevenue = demoBookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
  const totalTicketsSold = filteredBookings.reduce((sum, b) => sum + Number(b.quantity || b.ticket_quantity || 1), 0);

  // Tickets check-in status
  const checkedInCount = tickets.filter(t => t.status === 'used' || t.status === 'checked_in').length;
  const validTicketsCount = tickets.filter(t => t.status === 'valid').length;

  // Handle Export Excel
  const handleExportExcel = () => {
    exportTicketMahalFullReport({
      bookings: filteredBookings,
      tickets,
      customers: [],
      events,
      activities,
      promoCodes
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-playfair text-3xl font-semibold text-ticket-charcoal tracking-wide mb-1">Business Intelligence & Reports</h1>
          <p className="text-ticket-charcoal/60 text-sm">Authoritative analytics, event ticket turnover, revenue audit, and full Excel export.</p>
        </div>
        <button
          onClick={handleExportExcel}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-800 hover:bg-emerald-900 text-ticket-white text-sm font-semibold rounded-full shadow-md hover:shadow-lg transition-all duration-300 self-start sm:self-auto"
        >
          <FileSpreadsheet size={18} />
          Export Full Excel Report (.xlsx)
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-ticket-white p-4 border border-ticket-beige/60 rounded-3xl shadow-sm">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-ticket-burgundy" />
          <span className="text-xs font-bold uppercase tracking-wider text-ticket-charcoal">Report Period:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'today', label: 'Today' },
            { id: '7days', label: 'Last 7 Days' },
            { id: '30days', label: 'Last 30 Days' },
            { id: 'all', label: 'All Time' },
            { id: 'custom', label: 'Custom Range' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setDateRange(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                dateRange === tab.id
                  ? 'bg-ticket-burgundy/10 text-ticket-burgundy border-ticket-gold/30 font-bold'
                  : 'bg-ticket-white text-ticket-charcoal/60 border-ticket-beige/60 hover:bg-ivory'
              }`}
            >
              {tab.label}
            </button>
          ))}

          {dateRange === 'custom' && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-1.5 border border-ticket-beige rounded-xl text-xs bg-ticket-ivory"
              />
              <span className="text-xs text-ticket-charcoal/40">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-1.5 border border-ticket-beige rounded-xl text-xs bg-ticket-ivory"
              />
            </div>
          )}
        </div>
      </div>

      {/* Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Real Revenue Card */}
        <div className="bg-ticket-white p-5 rounded-3xl border border-ticket-beige/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-ticket-charcoal/60 font-semibold mb-2">
            <span>Verified Real Revenue</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">N-Genius / Live</span>
          </div>
          <div className="font-playfair text-3xl font-extrabold text-emerald-800">
            AED {realRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-ticket-charcoal/50 mt-2">
            {realBookings.length} genuine financial transactions
          </div>
        </div>

        {/* Demo Revenue Card */}
        <div className="bg-[#FFFDF8] p-5 rounded-3xl border border-amber-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-amber-800 font-semibold mb-2">
            <span>Demo Mode Volume</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">Demo Mode</span>
          </div>
          <div className="font-playfair text-3xl font-extrabold text-amber-900">
            AED {demoRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-700/80 mt-2">
            {demoBookings.length} simulated checkout bookings
          </div>
        </div>

        {/* Total Bookings Card */}
        <div className="bg-ticket-white p-5 rounded-3xl border border-ticket-beige/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-ticket-charcoal/60 font-semibold mb-2">
            <span>Total Bookings</span>
            <Receipt size={16} className="text-ticket-burgundy" />
          </div>
          <div className="font-playfair text-3xl font-extrabold text-ticket-charcoal">
            {filteredBookings.length}
          </div>
          <div className="text-[11px] text-ticket-charcoal/50 mt-2">
            Active in chosen period
          </div>
        </div>

        {/* Tickets Issued Card */}
        <div className="bg-ticket-white p-5 rounded-3xl border border-ticket-beige/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-ticket-charcoal/60 font-semibold mb-2">
            <span>Tickets Sold / Issued</span>
            <Ticket size={16} className="text-ticket-burgundy" />
          </div>
          <div className="font-playfair text-3xl font-extrabold text-ticket-burgundy">
            {totalTicketsSold}
          </div>
          <div className="text-[11px] text-ticket-charcoal/50 mt-2">
            {checkedInCount} checked-in at door
          </div>
        </div>
      </div>

      {/* Grid: Event Turnover & Check-In Turnover */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Event Performance Breakdown */}
        <div className="lg:col-span-8 bg-ticket-white border border-ticket-beige/60 rounded-3xl p-6 shadow-sm">
          <h3 className="font-playfair text-xl font-bold text-ticket-charcoal mb-4">
            Event Sales & Capacity Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ticket-beige/40 bg-ticket-ivory/40 text-ticket-charcoal/50 font-semibold uppercase">
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Bookings</th>
                  <th className="py-3 px-4">Tickets Sold</th>
                  <th className="py-3 px-4">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige/25">
                {events.map(e => {
                  const matchingBookings = filteredBookings.filter(b => 
                    b.event_id === e.id || 
                    b.events?.id === e.id || 
                    (b.events?.event_name && b.events.event_name.toLowerCase() === (e.event_name || e.title).toLowerCase())
                  );
                  const ticketsSold = matchingBookings.reduce((sum, b) => sum + Number(b.quantity || 1), 0);
                  const turnover = matchingBookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

                  return (
                    <tr key={e.id} className="hover:bg-ivory/10">
                      <td className="py-3 px-4 font-semibold text-ticket-charcoal font-playfair text-sm">
                        {e.event_name || e.title}
                      </td>
                      <td className="py-3 px-4 text-ticket-burgundy font-medium uppercase tracking-wider">
                        {e.category}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        {matchingBookings.length}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {ticketsSold}
                      </td>
                      <td className="py-3 px-4 font-semibold font-mono text-ticket-charcoal">
                        AED {turnover.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Check-ins & Operational Stats */}
        <div className="lg:col-span-4 bg-ticket-white border border-ticket-beige/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-playfair text-xl font-bold text-ticket-charcoal mb-4">
              Venue Check-In Status
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-ticket-ivory rounded-2xl border border-ticket-beige/60">
                <span className="text-xs text-ticket-charcoal/60 block mb-1">Check-In Ratio</span>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="font-playfair text-2xl font-bold text-ticket-charcoal">{checkedInCount} / {tickets.length || totalTicketsSold}</span>
                  <span className="text-xs font-bold text-ticket-burgundy">
                    {tickets.length > 0 ? Math.round((checkedInCount / tickets.length) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-beige/35 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-ticket-burgundy h-full rounded-full"
                    style={{ width: `${tickets.length > 0 ? (checkedInCount / tickets.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2.5 bg-white border border-ticket-beige/50 rounded-xl">
                  <span className="text-ticket-charcoal/60">Valid Admissions Remaining:</span>
                  <span className="font-bold font-mono text-emerald-700">{validTicketsCount}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-white border border-ticket-beige/50 rounded-xl">
                  <span className="text-ticket-charcoal/60">Checked-In Admissions:</span>
                  <span className="font-bold font-mono text-ticket-charcoal">{checkedInCount}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-white border border-ticket-beige/50 rounded-xl">
                  <span className="text-ticket-charcoal/60">Demo Payment Gateways:</span>
                  <span className="font-bold text-amber-700">100% of Transactions</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-ticket-beige/60">
            <button
              onClick={handleExportExcel}
              className="w-full py-3 bg-ticket-charcoal hover:bg-ticket-charcoal/90 text-ticket-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <FileSpreadsheet size={16} /> Download .XLSX Spreadsheet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
