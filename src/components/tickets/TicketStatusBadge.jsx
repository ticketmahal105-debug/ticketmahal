const STATUS_CONFIG = {
  active: {
    label: 'Active',
    classes: 'bg-ticket-burgundy/10 text-ticket-burgundy border border-ticket-gold/25',
  },
  used: {
    label: 'Used',
    classes: 'bg-ticket-charcoal/5 text-ticket-charcoal/50 border border-ticket-charcoal/10',
  },
  cancelled: {
    label: 'Cancelled',
    classes: 'bg-red-50 text-red-500 border border-red-100',
  },
  expired: {
    label: 'Expired',
    classes: 'bg-beige/60 text-ticket-charcoal/40 border border-ticket-beige',
  },
};

const TicketStatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.expired;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${config.classes}`}
    >
      {config.label}
    </span>
  );
};

export default TicketStatusBadge;
