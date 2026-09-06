const PAYMENT_STATUS = {
  paid:                { label: 'Paid',               classes: 'bg-green-50 text-green-700 border border-green-100' },
  pending:             { label: 'Pending',             classes: 'bg-amber-50 text-amber-700 border border-amber-100' },
  failed:              { label: 'Failed',              classes: 'bg-red-50 text-red-500 border border-red-100' },
  refunded:            { label: 'Refunded',            classes: 'bg-beige/60 text-ticket-charcoal/50 border border-ticket-beige' },
  partially_refunded:  { label: 'Partial Refund',      classes: 'bg-beige/50 text-ticket-charcoal/50 border border-ticket-beige' },
};

const PaymentStatusBadge = ({ status }) => {
  const config = PAYMENT_STATUS[status] || { label: status, classes: 'bg-beige/40 text-ticket-charcoal/40 border border-ticket-beige' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${config.classes}`}>
      {config.label}
    </span>
  );
};

export default PaymentStatusBadge;
