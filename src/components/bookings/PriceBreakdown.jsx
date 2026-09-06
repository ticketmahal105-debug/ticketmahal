const PriceBreakdown = ({ booking }) => {
  const currency = booking.currency || 'AED';

  const fmt = (val) => {
    if (val == null) return null;
    const n = Number(val);
    if (n === 0) return null;
    return `${currency} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const fmtTotal = (val) => {
    if (val == null) return '—';
    return `${currency} ${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const rows = [
    { label: 'Subtotal',     value: fmt(booking.subtotal) },
    { label: 'Service Fee',  value: fmt(booking.service_fee) },
    { label: 'VAT',          value: fmt(booking.tax_amount) },
    { label: 'Discount',     value: booking.discount_amount > 0 ? `-${fmt(booking.discount_amount)}` : null },
  ].filter((r) => r.value !== null);

  return (
    <div className="bg-ticket-white border border-ticket-beige rounded-2xl p-5 shadow-sm">
      <h4 className="font-playfair text-lg text-ticket-charcoal font-semibold mb-4">Payment Summary</h4>
      <div className="flex flex-col gap-2.5">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-ticket-charcoal/60">{label}</span>
            <span className="text-ticket-charcoal font-medium">{value}</span>
          </div>
        ))}
        <div className="border-t border-ticket-beige/60 my-1" />
        <div className="flex justify-between">
          <span className="font-semibold text-ticket-charcoal">Total</span>
          <span className="font-playfair text-lg font-semibold text-ticket-charcoal">
            {fmtTotal(booking.total_amount)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PriceBreakdown;
