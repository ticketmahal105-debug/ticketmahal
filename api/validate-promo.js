import { getPromoCodeFromStore, getAllBookingsFromStore } from './services/persistenceService.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { code, orderAmount, eventId, customerEmail } = req.body || {};

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, valid: false, error: 'Please enter a promo code.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const promo = getPromoCodeFromStore(cleanCode);

    if (!promo) {
      return res.status(404).json({ success: false, valid: false, error: 'Invalid promo code. Please check and try again.' });
    }

    // 1. Status Check
    if (promo.status !== 'active') {
      return res.status(400).json({ success: false, valid: false, error: 'This promo code is no longer active.' });
    }

    // 2. Validity Date Check
    const todayStr = new Date().toISOString().split('T')[0];
    if (promo.valid_from && todayStr < promo.valid_from) {
      return res.status(400).json({ success: false, valid: false, error: `This promo code will be active starting ${promo.valid_from}.` });
    }
    if (promo.valid_until && todayStr > promo.valid_until) {
      return res.status(400).json({ success: false, valid: false, error: 'This promo code has expired.' });
    }

    // 3. Minimum Order Amount Check
    const amount = Number(orderAmount) || 0;
    if (promo.min_order_amount && amount < Number(promo.min_order_amount)) {
      return res.status(400).json({ 
        success: false, 
        valid: false, 
        error: `Minimum order amount of AED ${promo.min_order_amount} required to use this promo code.` 
      });
    }

    // 4. Applicable Events Check
    if (Array.isArray(promo.applicable_events) && promo.applicable_events.length > 0 && !promo.applicable_events.includes('all')) {
      if (eventId && !promo.applicable_events.includes(eventId)) {
        return res.status(400).json({ success: false, valid: false, error: 'This promo code is not applicable to the selected event.' });
      }
    }

    // 5. Total Usage Limit Check
    const bookings = getAllBookingsFromStore();
    const matchingBookings = bookings.filter(b => 
      (b.promo_code && b.promo_code.toUpperCase() === cleanCode) ||
      (b.discount_code && b.discount_code.toUpperCase() === cleanCode)
    );
    const currentUses = Math.max(promo.uses_count || 0, matchingBookings.length);
    if (promo.usage_limit && currentUses >= Number(promo.usage_limit)) {
      return res.status(400).json({ success: false, valid: false, error: 'This promo code has reached its maximum global usage limit.' });
    }

    // 6. Per-Customer Usage Limit Check
    if (customerEmail && promo.per_customer_limit) {
      const customerUses = matchingBookings.filter(b => 
        (b.customer_email && b.customer_email.toLowerCase() === customerEmail.toLowerCase()) ||
        (b.profiles?.email && b.profiles.email.toLowerCase() === customerEmail.toLowerCase())
      ).length;

      if (customerUses >= Number(promo.per_customer_limit)) {
        return res.status(400).json({ 
          success: false, 
          valid: false, 
          error: `You have already redeemed this promo code the maximum allowed times (${promo.per_customer_limit}).` 
        });
      }
    }

    // 7. Calculate Discount Server-side
    let discount = 0;
    if (promo.discount_type === 'percentage') {
      discount = (amount * Number(promo.discount_value)) / 100;
      if (promo.max_discount && discount > Number(promo.max_discount)) {
        discount = Number(promo.max_discount);
      }
    } else {
      // Fixed discount
      discount = Math.min(Number(promo.discount_value), amount);
    }

    // Round discount to 2 decimal places
    discount = Math.round(discount * 100) / 100;
    const recalculatedTotal = Math.max(0, Math.round((amount - discount) * 100) / 100);

    return res.status(200).json({
      success: true,
      valid: true,
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      discount_amount: discount,
      original_amount: amount,
      recalculated_total: recalculatedTotal,
      message: `Promo code "${promo.code}" applied! You save AED ${discount.toFixed(2)}.`
    });

  } catch (error) {
    console.error('[Validate Promo Error]:', error);
    return res.status(500).json({ success: false, valid: false, error: error.message });
  }
}
