/**
 * Ticket Mahal Payment Service
 * Supports both TEMPORARY DEMO MODE and verified N-Genius gateway flows.
 * Communicates strictly with secure server-side endpoints to protect secrets and avoid CORS.
 */

/**
 * Fetches server-side payment mode configuration ('demo' | 'ngenius')
 */
export const getPaymentConfig = async () => {
  try {
    const res = await fetch('/api/payment-config');
    if (!res.ok) throw new Error('Could not fetch payment config');
    return await res.json();
  } catch (e) {
    return { success: true, paymentMode: 'demo' }; // Safe default
  }
};

/**
 * Creates a verified DEMO booking server-side.
 * The server calculates authoritative prices, generates unique individual tickets with secure QR codes,
 * records the booking in Supabase/cache, and triggers the confirmation email.
 */
export const createDemoBooking = async ({
  eventId,
  showtime,
  ticketQuantity,
  ticketType = 'Standard Admission',
  customerInfo,
  userId,
  idempotencyKey
}) => {
  try {
    const response = await fetch('/api/create-demo-booking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {})
      },
      body: JSON.stringify({
        eventId,
        showtime,
        ticketQuantity,
        ticketType,
        customerInfo,
        userId,
        idempotencyKey
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Demo Booking Network Error:', error);
    return {
      success: false,
      error: error.message || 'Network error connecting to booking server'
    };
  }
};

/**
 * Creates an order with N-Genius Payment Gateway via the server endpoint.
 * The server validates price, creates a pending booking, and returns the real hosted payment URL.
 * 
 * @param {Object} details - { eventId, showtime, ticketQuantity, customerInfo, returnUrl, userId }
 */
export const createNGeniusOrder = async ({ eventId, showtime, ticketQuantity, customerInfo, returnUrl, userId }) => {
  try {
    const response = await fetch('/api/create-ngenius-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventId,
        showtime,
        ticketQuantity,
        customerInfo,
        redirectUrl: returnUrl,
        userId
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('N-Genius Order Creation Network Error:', error);
    return {
      success: false,
      error: error.message || 'Network error connecting to payment server'
    };
  }
};

/**
 * Independently verifies transaction status with N-Genius server-side.
 * 
 * @param {Object} details - { bookingNumber, orderRef }
 */
export const verifyNGeniusPayment = async ({ bookingNumber, orderRef }) => {
  try {
    const response = await fetch('/api/verify-ngenius-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bookingNumber,
        orderRef
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('N-Genius Verification Network Error:', error);
    return {
      success: false,
      error: error.message || 'Network error verifying payment with server'
    };
  }
};
