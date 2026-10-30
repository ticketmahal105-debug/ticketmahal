import * as XLSX from 'xlsx';

/**
 * Generates and downloads the comprehensive Ticket-Mahal-Full-Report.xlsx workbook
 * Strictly excludes any sensitive authentication tokens, passwords, or QR secrets.
 */
export function exportTicketMahalFullReport({
  bookings = [],
  tickets = [],
  customers = [],
  events = [],
  activities = []
}) {
  const wb = XLSX.utils.book_new();

  // 1. CUSTOMERS WORKSHEET
  const customersData = (customers || []).map((c, idx) => ({
    'Customer ID': c.id || `CUST-TM-0${idx + 1}`,
    'Customer Name': `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.name || 'Valued Guest',
    'Email Address': c.email || '—',
    'Mobile Number': c.phone || '+971500000000',
    'Signup Method': c.app_metadata?.provider || 'Email / Quick Order',
    'Registration Date': c.created_at ? new Date(c.created_at).toLocaleDateString() : '—',
    'Total Bookings': c.booking_count || 1
  }));
  const wsCustomers = XLSX.utils.json_to_sheet(customersData.length > 0 ? customersData : [
    { 'Customer ID': 'No customer records yet' }
  ]);
  XLSX.utils.book_append_sheet(wb, wsCustomers, 'Customers');

  // 2. BOOKINGS WORKSHEET
  const bookingsData = (bookings || []).map(b => ({
    'Booking Reference': b.booking_number,
    'Customer Name': b.customer_name || (b.profiles ? `${b.profiles.first_name} ${b.profiles.last_name}` : 'Guest'),
    'Email Address': b.customer_email || b.profiles?.email || '—',
    'Mobile Number': b.customer_phone || '—',
    'Event Name': b.events?.event_name || b.events?.title || 'Ticket Mahal Event',
    'Scheduled Date': b.events?.event_date || 'Upcoming',
    'Showtime': b.showtime || '07:30 PM',
    'Venue': b.events?.venue_name || 'Ticket Mahal Stage',
    'Ticket Category': b.ticket_category || b.ticket_type || 'Standard',
    'Reserved Seats': b.seats || 'General Admission',
    'Quantity': b.quantity || b.ticket_quantity || 1,
    'Subtotal (AED)': Math.round((Number(b.total_amount || b.total_price || 0) / 1.05) * 100) / 100,
    'VAT (AED)': Math.round((Number(b.total_amount || b.total_price || 0) - (Number(b.total_amount || b.total_price || 0) / 1.05)) * 100) / 100,
    'Fees (AED)': 0,
    'Total (AED)': Number(b.total_amount || b.total_price || 0),
    'Payment Provider': b.payment_provider || 'demo',
    'Payment Status': b.payment_status || 'demo_paid',
    'Booking Status': b.booking_status || 'confirmed',
    'Created At': new Date(b.created_at || Date.now()).toLocaleString()
  }));
  const wsBookings = XLSX.utils.json_to_sheet(bookingsData.length > 0 ? bookingsData : [
    { 'Booking Reference': 'No bookings found' }
  ]);
  XLSX.utils.book_append_sheet(wb, wsBookings, 'Bookings');

  // 3. TICKETS WORKSHEET
  const ticketsData = (tickets || []).map(t => ({
    'Ticket ID': t.ticket_number,
    'Booking Reference': t.booking_reference || t.booking_id,
    'Event Name': t.events?.event_name || t.events?.title || 'Ticket Mahal Event',
    'Session Showtime': t.events?.start_time || '07:30 PM',
    'Category': t.ticket_type || 'Standard',
    'Row': t.row || (t.seat ? t.seat.charAt(0) : '—'),
    'Seat Number': t.seat || 'General Admission',
    'Admission Status': t.status || 'valid',
    'Issued At': new Date(t.created_at || Date.now()).toLocaleString(),
    'Checked In At': t.checked_in_at ? new Date(t.checked_in_at).toLocaleString() : 'Not Checked In'
  }));
  const wsTickets = XLSX.utils.json_to_sheet(ticketsData.length > 0 ? ticketsData : [
    { 'Ticket ID': 'No tickets found' }
  ]);
  XLSX.utils.book_append_sheet(wb, wsTickets, 'Tickets');

  // 4. EVENTS WORKSHEET
  const eventsData = (events || []).map(e => ({
    'Event ID': e.id,
    'Event Name': e.event_name || e.title,
    'Category': e.category || 'Movies',
    'Venue': e.venue_name || e.venue,
    'City': e.city || 'Dubai',
    'Event Date': e.event_date || e.date,
    'Starting Price (AED)': e.startingPrice || e.starting_price || 120,
    'Status': e.status || 'published'
  }));
  const wsEvents = XLSX.utils.json_to_sheet(eventsData.length > 0 ? eventsData : [
    { 'Event ID': 'No events found' }
  ]);
  XLSX.utils.book_append_sheet(wb, wsEvents, 'Events');

  // 5. ACTIVITY AUDIT WORKSHEET
  const activityData = (activities || []).map(a => ({
    'Timestamp': new Date(a.timestamp || a.created_at || Date.now()).toLocaleString(),
    'Customer': a.customer || a.customer_name || 'Guest User',
    'Email Address': a.email || a.customer_email || '—',
    'Event': a.event || a.event_name || '—',
    'Action Taken': a.action,
    'Booking Reference': a.bookingReference || a.booking_reference || '—',
    'Execution Status': a.status || 'success',
    'Audit Details': a.details || '—'
  }));
  const wsActivity = XLSX.utils.json_to_sheet(activityData.length > 0 ? activityData : [
    { 'Activity': 'No activity logged yet' }
  ]);
  XLSX.utils.book_append_sheet(wb, wsActivity, 'Activity');

  // 6. CHECK-INS WORKSHEET
  const checkinsData = (tickets || []).map(t => ({
    'Ticket ID': t.ticket_number,
    'Booking Reference': t.booking_reference || t.booking_id,
    'Event Name': t.events?.event_name || t.events?.title || 'Ticket Mahal Event',
    'Seat Number': t.seat || 'General Admission',
    'Check-in Status': t.status === 'checked_in' ? 'CHECKED IN' : 'VALID / PENDING',
    'Check-in Time': t.checked_in_at ? new Date(t.checked_in_at).toLocaleString() : '—'
  }));
  const wsCheckins = XLSX.utils.json_to_sheet(checkinsData.length > 0 ? checkinsData : [
    { 'Ticket ID': 'No check-in records' }
  ]);
  XLSX.utils.book_append_sheet(wb, wsCheckins, 'Check-ins');

  // Write and trigger download
  XLSX.writeFile(wb, 'Ticket-Mahal-Full-Report.xlsx');
}
