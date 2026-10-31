import * as XLSX from 'xlsx';

/**
 * Generates and downloads the authoritative Ticket-Mahal-Full-Report.xlsx workbook
 * Contains all 7 required worksheets:
 * 1. Customers
 * 2. Bookings
 * 3. Tickets
 * 4. Events
 * 5. Activity
 * 6. Check-ins
 * 7. Promo Codes
 * Strictly excludes any sensitive authentication tokens, passwords, OTPs, or QR secrets.
 */
export function exportTicketMahalFullReport({
  bookings = [],
  tickets = [],
  customers = [],
  events = [],
  activities = [],
  promoCodes = []
}) {
  const wb = XLSX.utils.book_new();

  // 1. CUSTOMERS WORKSHEET
  const customersData = (customers || []).map((c, idx) => ({
    'Customer ID': c.id || `CUST-TM-0${idx + 1}`,
    'First Name': c.first_name || (c.name ? c.name.split(' ')[0] : 'Valued'),
    'Email': c.email || '—',
    'Mobile': c.phone || '—',
    'Signup Method': c.signup_method || c.app_metadata?.provider || 'Email / Quick Order',
    'Registration Date': c.created_at ? new Date(c.created_at).toLocaleDateString() : '—',
    'Bookings Count': c.bookings_count || (c.bookings ? c.bookings.length : 1),
    'Tickets Count': c.tickets_count || (c.tickets ? c.tickets.length : 1)
  }));
  const wsCustomers = XLSX.utils.json_to_sheet(customersData.length > 0 ? customersData : [
    { 'Customer ID': 'No customer records yet' }
  ]);
  XLSX.utils.book_append_sheet(wb, wsCustomers, 'Customers');

  // 2. BOOKINGS WORKSHEET
  const bookingsData = (bookings || []).map(b => {
    const total = Number(b.total_amount || b.total_price || 0);
    const subtotal = b.subtotal !== undefined ? Number(b.subtotal) : Math.round((total / 1.05) * 100) / 100;
    const vat = b.vat !== undefined ? Number(b.vat) : Math.round((total - subtotal) * 100) / 100;
    const discount = b.discount_amount !== undefined ? Number(b.discount_amount) : 0;

    return {
      'Booking Reference': b.booking_number,
      'Customer': b.customer_name || `${b.profiles?.first_name || ''} ${b.profiles?.last_name || ''}`.trim() || 'Valued Guest',
      'Email': b.customer_email || b.profiles?.email || '—',
      'Mobile': b.customer_phone || b.profiles?.phone || '—',
      'Event': b.events?.event_name || b.events?.title || 'Ticket Mahal Event',
      'Date': b.events?.event_date || 'Upcoming',
      'Time': b.showtime || b.events?.start_time || '07:30 PM',
      'Venue': b.events?.venue_name || 'Ticket Mahal Stage',
      'Ticket Categories': b.ticket_category || b.ticket_type || 'Standard',
      'Seats': b.seats || 'General Admission',
      'Quantity': b.quantity || b.ticket_quantity || 1,
      'Subtotal': subtotal,
      'VAT': vat,
      'Fees': 0,
      'Discount': discount,
      'Total': total,
      'Payment Provider': b.payment_provider || 'demo',
      'Payment Status': b.payment_status || 'demo_paid',
      'Booking Status': b.booking_status || 'confirmed',
      'Created At': new Date(b.created_at || Date.now()).toLocaleString()
    };
  });
  const wsBookings = XLSX.utils.json_to_sheet(bookingsData.length > 0 ? bookingsData : [
    { 'Booking Reference': 'No bookings found' }
  ]);
  XLSX.utils.book_append_sheet(wb, wsBookings, 'Bookings');

  // 3. TICKETS WORKSHEET
  const ticketsData = (tickets || []).map(t => ({
    'Ticket ID': t.ticket_number || t.id,
    'Booking Reference': t.booking_reference || t.booking_id,
    'Customer': t.customer_name || t.bookings?.customer_name || `${t.profiles?.first_name || ''} ${t.profiles?.last_name || ''}`.trim() || 'Valued Guest',
    'Event': t.events?.event_name || t.events?.title || 'Ticket Mahal Event',
    'Category': t.ticket_type || 'Standard',
    'Section': t.section || 'Main Auditorium',
    'Row': t.row || (t.seat ? t.seat.charAt(0) : '—'),
    'Seat': t.seat || 'General Admission',
    'Status': t.status || 'valid',
    'Issued At': new Date(t.created_at || Date.now()).toLocaleString(),
    'Checked In At': (t.checked_in_at || t.used_at) ? new Date(t.checked_in_at || t.used_at).toLocaleString() : 'Not Checked In'
  }));
  const wsTickets = XLSX.utils.json_to_sheet(ticketsData.length > 0 ? ticketsData : [
    { 'Ticket ID': 'No tickets found' }
  ]);
  XLSX.utils.book_append_sheet(wb, wsTickets, 'Tickets');

  // 4. EVENTS WORKSHEET
  const eventsData = (events || []).map(e => {
    const totalCapacity = e.ticket_types?.reduce((acc, t) => acc + (t.capacity || 0), 0) || 500;
    const totalSold = e.ticket_types?.reduce((acc, t) => acc + (t.sold_quantity || 0), 0) || 0;
    const remaining = Math.max(0, totalCapacity - totalSold);

    return {
      'Event': e.event_name || e.title,
      'Category': e.category || 'Movies',
      'Date': e.event_date || e.releaseDate,
      'Time': e.start_time || '07:30 PM',
      'Venue': e.venue_name || e.venue || 'Ticket Mahal Main Stage',
      'Capacity': totalCapacity,
      'Tickets Sold': totalSold,
      'Remaining': remaining,
      'Status': e.status || 'published'
    };
  });
  const wsEvents = XLSX.utils.json_to_sheet(eventsData.length > 0 ? eventsData : [
    { 'Event': 'No events found' }
  ]);
  XLSX.utils.book_append_sheet(wb, wsEvents, 'Events');

  // 5. ACTIVITY WORKSHEET
  const activityData = (activities || []).map(a => ({
    'Timestamp': new Date(a.timestamp || a.created_at || Date.now()).toLocaleString(),
    'Customer': a.customer || a.customer_name || 'Guest User',
    'Action': a.action,
    'Event': a.event || a.event_name || '—',
    'Booking Reference': a.bookingReference || a.booking_reference || '—',
    'Status': a.status || 'success'
  }));
  const wsActivity = XLSX.utils.json_to_sheet(activityData.length > 0 ? activityData : [
    { 'Timestamp': 'No activity logged yet' }
  ]);
  XLSX.utils.book_append_sheet(wb, wsActivity, 'Activity');

  // 6. CHECK-INS WORKSHEET
  const checkinsData = (tickets || []).map(t => ({
    'Ticket ID': t.ticket_number || t.id,
    'Booking Reference': t.booking_reference || t.booking_id,
    'Customer': t.customer_name || t.bookings?.customer_name || `${t.profiles?.first_name || ''} ${t.profiles?.last_name || ''}`.trim() || 'Valued Guest',
    'Event': t.events?.event_name || t.events?.title || 'Ticket Mahal Event',
    'Seat': t.seat || 'General Admission',
    'Check-In Status': (t.status === 'checked_in' || t.status === 'used') ? 'CHECKED IN' : 'VALID / PENDING',
    'Check-In Time': (t.checked_in_at || t.used_at) ? new Date(t.checked_in_at || t.used_at).toLocaleString() : '—'
  }));
  const wsCheckins = XLSX.utils.json_to_sheet(checkinsData.length > 0 ? checkinsData : [
    { 'Ticket ID': 'No check-in records' }
  ]);
  XLSX.utils.book_append_sheet(wb, wsCheckins, 'Check-ins');

  // 7. PROMO CODES WORKSHEET
  const promoData = (promoCodes || []).map(p => ({
    'Code': p.code,
    'Discount Type': p.discount_type === 'percentage' ? 'Percentage (%)' : 'Fixed (AED)',
    'Value': p.discount_value,
    'Valid From': p.valid_from || 'Always',
    'Valid Until': p.valid_until || 'No Expiry',
    'Usage Limit': p.usage_limit || 'Unlimited',
    'Uses': p.uses_count || 0,
    'Status': p.status || 'active'
  }));
  const wsPromo = XLSX.utils.json_to_sheet(promoData.length > 0 ? promoData : [
    { 'Code': 'No promo codes configured' }
  ]);
  XLSX.utils.book_append_sheet(wb, wsPromo, 'Promo Codes');

  // Write file to download
  XLSX.writeFile(wb, 'Ticket-Mahal-Full-Report.xlsx');
}
