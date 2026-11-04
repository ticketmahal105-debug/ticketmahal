import { 
  getAllPromoCodesFromStore, 
  savePromoCodeToStore, 
  deletePromoCodeFromStore,
  getAllBookingsFromStore,
  recordActivityToStore 
} from './services/persistenceService.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    // GET: List all promo codes with real usage statistics
    if (req.method === 'GET') {
      const promoCodes = getAllPromoCodesFromStore();
      const bookings = getAllBookingsFromStore();

      const enriched = promoCodes.map(promo => {
        // Find bookings that used this promo code
        const matchingBookings = bookings.filter(b => 
          (b.promo_code && b.promo_code.toUpperCase() === promo.code.toUpperCase()) ||
          (b.discount_code && b.discount_code.toUpperCase() === promo.code.toUpperCase())
        );

        const realUses = Math.max(promo.uses_count || 0, matchingBookings.length);
        const revenueAffected = matchingBookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
        const remainingUses = promo.usage_limit ? Math.max(0, promo.usage_limit - realUses) : 'Unlimited';

        return {
          ...promo,
          uses_count: realUses,
          revenue_affected: revenueAffected,
          remaining_uses: remainingUses
        };
      });

      return res.status(200).json({ success: true, promoCodes: enriched });
    }

    // POST: Create or Update Promo Code or Toggle Status
    if (req.method === 'POST') {
      const { action, id, status, promo } = req.body || {};

      if (action === 'validate') {
        const { code, orderAmount, eventId, customerEmail } = req.body || {};
        if (!code) {
          return res.status(400).json({ success: false, valid: false, error: 'Promo code is required' });
        }

        const cleanCode = code.trim().toUpperCase();
        const promos = getAllPromoCodesFromStore();
        const promo = promos.find(p => (p.code || '').trim().toUpperCase() === cleanCode);

        if (!promo) {
          return res.status(200).json({ success: false, valid: false, error: 'Invalid or unrecognized promo code' });
        }

        if (promo.status && promo.status !== 'active') {
          return res.status(200).json({ success: false, valid: false, error: 'This promo code is no longer active' });
        }

        const now = new Date();
        if (promo.valid_from && new Date(promo.valid_from) > now) {
          return res.status(200).json({ success: false, valid: false, error: 'This promo code is not active yet' });
        }
        if (promo.valid_until && new Date(promo.valid_until) < now) {
          return res.status(200).json({ success: false, valid: false, error: 'This promo code has expired' });
        }

        const numericOrder = Number(orderAmount) || 0;
        if (promo.min_order_amount && numericOrder < Number(promo.min_order_amount)) {
          return res.status(200).json({ 
            success: false, 
            valid: false, 
            error: `Minimum order amount of AED ${promo.min_order_amount} required` 
          });
        }

        const bookings = getAllBookingsFromStore();
        const matchingBookings = bookings.filter(b => 
          (b.promo_code && b.promo_code.toUpperCase() === cleanCode) ||
          (b.discount_code && b.discount_code.toUpperCase() === cleanCode)
        );

        if (promo.usage_limit && matchingBookings.length >= Number(promo.usage_limit)) {
          return res.status(200).json({ success: false, valid: false, error: 'This promo code has reached its usage limit' });
        }

        if (customerEmail && promo.per_customer_limit) {
          const customerUses = matchingBookings.filter(b => 
            (b.customer_email || '').toLowerCase() === customerEmail.toLowerCase()
          ).length;
          if (customerUses >= Number(promo.per_customer_limit)) {
            return res.status(200).json({ 
              success: false, 
              valid: false, 
              error: 'You have already reached the maximum usage for this code' 
            });
          }
        }

        let discountAmount = 0;
        if (promo.discount_type === 'percentage') {
          discountAmount = (numericOrder * (Number(promo.discount_value) || 0)) / 100;
          if (promo.max_discount && discountAmount > Number(promo.max_discount)) {
            discountAmount = Number(promo.max_discount);
          }
        } else {
          discountAmount = Math.min(Number(promo.discount_value) || 0, numericOrder);
        }

        return res.status(200).json({
          success: true,
          valid: true,
          code: promo.code,
          discount_amount: Math.round(discountAmount * 100) / 100,
          discount_type: promo.discount_type,
          discount_value: promo.discount_value,
          message: `Promo code "${promo.code}" applied!`
        });
      }

      if (action === 'toggle_status') {
        const promos = getAllPromoCodesFromStore();
        const existing = promos.find(p => p.id === id);
        if (!existing) {
          return res.status(404).json({ success: false, error: 'Promo code not found' });
        }
        const updated = savePromoCodeToStore({
          ...existing,
          status: status || (existing.status === 'active' ? 'inactive' : 'active')
        });

        recordActivityToStore({
          id: `act-pro-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'promo_updated',
          customer: 'Admin',
          status: 'success',
          details: `Promo code "${existing.code}" status changed to ${updated.status}`
        });

        return res.status(200).json({ success: true, promo: updated });
      }

      const promoData = promo || req.body;
      if (!promoData.code) {
        return res.status(400).json({ success: false, error: 'Promo code string is required' });
      }

      const cleanCode = promoData.code.trim().toUpperCase();
      const all = getAllPromoCodesFromStore();
      const duplicate = all.find(p => p.code === cleanCode && p.id !== promoData.id);
      if (duplicate) {
        return res.status(400).json({ success: false, error: `Promo code "${cleanCode}" already exists.` });
      }

      const saved = savePromoCodeToStore({
        ...promoData,
        code: cleanCode,
        discount_value: Number(promoData.discount_value) || 0,
        min_order_amount: Number(promoData.min_order_amount) || 0,
        max_discount: promoData.max_discount ? Number(promoData.max_discount) : null,
        usage_limit: promoData.usage_limit ? Number(promoData.usage_limit) : null,
        per_customer_limit: promoData.per_customer_limit ? Number(promoData.per_customer_limit) : 1
      });

      recordActivityToStore({
        id: `act-pro-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: promoData.id ? 'promo_updated' : 'promo_created',
        customer: 'Admin',
        status: 'success',
        details: `Saved promo code "${saved.code}" (${saved.discount_type}: ${saved.discount_value})`
      });

      return res.status(200).json({ success: true, promo: saved });
    }

    // DELETE: Deactivate Promo Code
    if (req.method === 'DELETE') {
      const { id } = req.body || req.query || {};
      if (!id) {
        return res.status(400).json({ success: false, error: 'Promo Code ID is required' });
      }

      const deactivated = deletePromoCodeFromStore(id);
      return res.status(200).json({ success: true, promo: deactivated });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('[Admin Promo Codes API Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
