const BOOKING_STATUS = {
  confirmed: { label: 'Confirmed', classes: 'bg-green-50 text-green-700 border border-green-100' },
  pending:   { label: 'Pending',   classes: 'bg-amber-50 text-amber-700 border border-amber-100' },
  completed: { label: 'Completed', classes: 'bg-ticket-burgundy/10 text-ticket-burgundy border border-ticket-gold/20' },
  cancelled: { label: 'Cancelled', classes: 'bg-red-50 text-red-500 border border-red-100' },
  refunded:  { label: 'Refunded',  classes: 'bg-beige/60 text-ticket-charcoal/50 border border-ticket-beige' },
};

const BookingStatusBadge = ({ status }) => {
  const config = BOOKING_STATUS[status] || { label: status, classes: 'bg-beige/60 text-ticket-charcoal/40 border border-ticket-beige' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${config.classes}`}>
      {config.label}
    </span>
  );
};

export default BookingStatusBadge;
