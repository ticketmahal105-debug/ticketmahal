import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import { dummyMovies } from '../src/data/dummyMovies.js';
import { getActivities } from './services/activityService.js';

function getSupabaseClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    return createClient(url, key);
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  try {
    const supabase = getSupabaseClient();
    
    // 1. Fetch Bookings
    let bookings = [];
    if (supabase) {
      try {
        const { data } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
        if (data) bookings = data;
      } catch (_) {}
    }

    // 2. Fetch Tickets
    let tickets = [];
    if (supabase) {
      try {
        const { data } = await supabase.from('tickets').select('*');
        if (data) tickets = data;
      } catch (_) {}
    }

    // 3. Fetch Customers / Profiles
    let customers = [];
    if (supabase) {
      try {
        const { data } = await supabase.from('profiles').select('*');
        if (data) customers = data;
      } catch (_) {}
    }

    // 4. Events
    const events = dummyMovies.map(m => ({
      id: m.id,
      event_name: m.title,
      category: m.category,
      venue: m.venue,
      city: m.city,
      date: m.releaseDate,
      starting_price: m.startingPrice,
      status: 'published'
    }));

    // 5. Activities
    const activities = getActivities();

    // Build Workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Customers
    const customersData = customers.map((c, i) => ({
      'Customer ID': c.id || `CUST-TM-0${i + 1}`,
      'First Name': c.first_name || 'Guest',
      'Last Name': c.last_name || '',
      'Email': c.email || '—',
      'Mobile': c.phone || '+971500000000',
      'Signup Method': c.signup_method || 'Email',
      'Registration Date': c.created_at ? new Date(c.created_at).toLocaleDateString() : '—',
      'Booking Count': c.booking_count || 1
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(customersData.length > 0 ? customersData : [
      { 'Customer ID': 'CUST-DEMO-01', 'First Name': 'Ahmad', 'Last Name': 'Al Zaabi', 'Email': 'ahmad.test@ticketmahal.ae', 'Mobile': '+971501234567', 'Signup Method': 'Quick Order', 'Registration Date': new Date().toLocaleDateString(), 'Booking Count': 2 }
    ]), 'Customers');

    // Sheet 2: Bookings
    const bookingsData = bookings.map(b => ({
      'Booking Reference': b.booking_number,
      'Customer': b.customer_name || 'Valued Guest',
      'Email': b.customer_email || '—',
      'Mobile': b.customer_phone || '—',
      'Event': b.event_id || 'Ticket Mahal Event',
      'Date': b.showtime?.split('•')?.[0]?.trim() || '2026-07-31',
      'Time': b.showtime || '07:30 PM',
      'Venue': 'Ticket Mahal Dubai',
      'Ticket Category': b.ticket_category || 'Standard',
      'Seats': b.seats || 'General Admission',
      'Quantity': b.quantity || 1,
      'Subtotal': Math.round(((b.total_amount || 120) / 1.05) * 100) / 100,
      'VAT': Math.round(((b.total_amount || 120) - (b.total_amount || 120) / 1.05) * 100) / 100,
      'Fees': 0,
      'Total': b.total_amount || b.total_price || 120,
      'Payment Provider': b.payment_provider || 'demo',
      'Payment Status': b.payment_status || 'demo_paid',
      'Booking Status': b.booking_status || 'confirmed',
      'Created At': new Date(b.created_at || Date.now()).toLocaleString()
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bookingsData.length > 0 ? bookingsData : [
      { 'Booking Reference': 'TM-178786', 'Customer': 'Ahmad Al Zaabi', 'Email': 'ahmad.test@ticketmahal.ae', 'Mobile': '+971501234567', 'Event': 'Spider-Man: Brand New Day', 'Date': '31 July 2026', 'Time': '07:30 PM', 'Venue': 'Vox Cinemas, Mall of the Emirates', 'Ticket Category': 'Standard', 'Seats': 'C5, C6', 'Quantity': 2, 'Subtotal': 360, 'VAT': 18, 'Fees': 0, 'Total': 378, 'Payment Provider': 'demo', 'Payment Status': 'demo_paid', 'Booking Status': 'confirmed', 'Created At': new Date().toLocaleString() }
    ]), 'Bookings');

    // Sheet 3: Tickets
    const ticketsData = tickets.map(t => ({
      'Ticket ID': t.ticket_number,
      'Booking Reference': t.booking_reference || t.booking_id,
      'Event': t.event_id || 'Ticket Mahal Event',
      'Session': '07:30 PM',
      'Category': t.ticket_type || 'Standard',
      'Row': t.row || '—',
      'Seat': t.seat || 'General Admission',
      'Status': t.status || 'valid',
      'Issued At': new Date(t.created_at || Date.now()).toLocaleString(),
      'Checked In At': t.checked_in_at ? new Date(t.checked_in_at).toLocaleString() : 'Not Checked In'
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ticketsData.length > 0 ? ticketsData : [
      { 'Ticket ID': 'TM-JNKHU6', 'Booking Reference': 'TM-178786', 'Event': 'Spider-Man: Brand New Day', 'Session': '07:30 PM', 'Category': 'Standard', 'Row': 'C', 'Seat': 'C5', 'Status': 'valid', 'Issued At': new Date().toLocaleString(), 'Checked In At': 'Not Checked In' },
      { 'Ticket ID': 'TM-CLQCFW', 'Booking Reference': 'TM-178786', 'Event': 'Spider-Man: Brand New Day', 'Session': '07:30 PM', 'Category': 'Standard', 'Row': 'C', 'Seat': 'C6', 'Status': 'valid', 'Issued At': new Date().toLocaleString(), 'Checked In At': 'Not Checked In' }
    ]), 'Tickets');

    // Sheet 4: Events
    const eventsData = events.map(e => ({
      'Event ID': e.id,
      'Event Name': e.event_name,
      'Category': e.category,
      'Venue': e.venue,
      'City': e.city,
      'Date': e.date,
      'Starting Price (AED)': e.starting_price,
      'Status': e.status
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(eventsData), 'Events');

    // Sheet 5: Activity
    const activitiesData = activities.map(a => ({
      'Timestamp': new Date(a.timestamp).toLocaleString(),
      'Customer': a.customer,
      'Email': a.email,
      'Event': a.event,
      'Action': a.action,
      'Booking Reference': a.bookingReference,
      'Status': a.status,
      'Details': a.details
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(activitiesData), 'Activity');

    // Sheet 6: Check-ins
    const checkinsData = (ticketsData.length > 0 ? ticketsData : [
      { 'Ticket ID': 'TM-JNKHU6', 'Booking Reference': 'TM-178786', 'Event': 'Spider-Man: Brand New Day', 'Seat': 'C5', 'Status': 'valid' }
    ]).map(t => ({
      'Ticket ID': t['Ticket ID'],
      'Booking Reference': t['Booking Reference'],
      'Event': t['Event'],
      'Seat': t['Seat'],
      'Check-in Status': t['Status'] === 'checked_in' ? 'CHECKED IN' : 'VALID / PENDING',
      'Check-in Time': '—'
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(checkinsData), 'Check-ins');

    // Output buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Ticket-Mahal-Full-Report.xlsx"');
    res.end(buf);
  } catch (err) {
    console.error('Export report error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}
