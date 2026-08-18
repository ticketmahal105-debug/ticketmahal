const STATUS_CONFIG = {
  active: {
    label: 'Active',
    classes: 'bg-champagne/10 text-champagne border border-champagne/25',
  },
  used: {
    label: 'Used',
    classes: 'bg-charcoal/5 text-charcoal/50 border border-charcoal/10',
  },
  cancelled: {
    label: 'Cancelled',
    classes: 'bg-red-50 text-red-500 border border-red-100',
  },
  expired: {
    label: 'Expired',
    classes: 'bg-beige/60 text-charcoal/40 border border-beige',
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
