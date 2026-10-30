import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    return createClient(url, key);
  } catch (e) {
    return null;
  }
}

// In-Memory Activity Store
const activityStore = [
  {
    id: 'act-init-1',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    action: 'system_initialized',
    customer: 'System',
    email: 'system@ticketmahal.ae',
    event: 'Platform Services',
    bookingReference: '—',
    status: 'success',
    details: 'Ticket Mahal booking engine online.'
  }
];

export async function logActivity({ action, customer, email, event, bookingReference, status = 'success', details = '' }) {
  const item = {
    id: 'act-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    action,
    customer: customer || 'Guest User',
    email: email || 'anonymous',
    event: event || 'Ticket Mahal Event',
    bookingReference: bookingReference || '—',
    status,
    details: typeof details === 'string' ? details : JSON.stringify(details)
  };

  activityStore.unshift(item);
  if (activityStore.length > 200) activityStore.pop();

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('activities').insert([{
        action: item.action,
        customer_name: item.customer,
        customer_email: item.email,
        event_name: item.event,
        booking_reference: item.bookingReference,
        status: item.status,
        details: item.details,
        created_at: item.timestamp
      }]);
    } catch (_) {}
  }

  return item;
}

export function getActivities() {
  return [...activityStore];
}

/**
 * Sends Owner Notification Email via Resend when a purchase is confirmed
 */
export async function sendOwnerBookingNotification({ booking, tickets, event, seats }) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const ownerEmail = process.env.OWNER_NOTIFICATION_EMAIL || process.env.RESEND_OWNER_EMAIL || 'admin@ticketmahal.ae';

  if (!resendApiKey) {
    console.log('[Owner Email Notice] RESEND_API_KEY not configured. Owner email skipped safely.');
    return { sent: false, reason: 'RESEND_API_KEY_NOT_SET' };
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL || 'Ticket Mahal Alerts <onboarding@resend.dev>';
  const seatList = Array.isArray(seats) && seats.length > 0 ? seats.join(', ') : 'Assigned at check-in';

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FFFDF8; color: #292725; padding: 24px;">
      <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #EDE3D5; padding: 28px;">
        <div style="border-bottom: 2px solid #7A1F2B; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #7A1F2B; font-family: Georgia, serif;">NEW TICKET MAHAL BOOKING</h2>
          <p style="margin: 4px 0 0 0; color: #8F877C; font-size: 13px;">A customer has just completed a confirmed booking.</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #8F877C; width: 40%;">Booking Reference:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #7A1F2B; font-family: monospace;">${booking.booking_number}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8F877C;">Customer Name:</td>
            <td style="padding: 8px 0; font-weight: 600;">${booking.customer_name || 'Guest'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8F877C;">Customer Email:</td>
            <td style="padding: 8px 0;">${booking.customer_email || '—'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8F877C;">Mobile Phone:</td>
            <td style="padding: 8px 0;">${booking.customer_phone || '—'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8F877C;">Event:</td>
            <td style="padding: 8px 0; font-weight: 600;">${event.title || event.event_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8F877C;">Date & Showtime:</td>
            <td style="padding: 8px 0;">${booking.showtime}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8F877C;">Seats:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #292725;">${seatList}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8F877C;">Quantity:</td>
            <td style="padding: 8px 0;">${booking.quantity} Ticket(s)</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8F877C;">Total Amount:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #10B981; font-size: 16px;">AED ${booking.total_amount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8F877C;">Payment Mode:</td>
            <td style="padding: 8px 0;">
              <span style="background: #FEF3C7; color: #92400E; padding: 2px 8px; border-radius: 6px; font-weight: bold; font-size: 11px; text-transform: uppercase;">
                ${booking.payment_mode || 'demo'}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8F877C;">Booking Time:</td>
            <td style="padding: 8px 0; font-size: 12px; color: #8F877C;">${new Date().toLocaleString()}</td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [ownerEmail],
        subject: `NEW BOOKING: ${booking.booking_number} — ${event.title || event.event_name} (${booking.quantity} seats)`,
        html: html
      })
    });

    if (!res.ok) {
      console.warn('[Owner Email Notice] Resend response code:', res.status);
      return { sent: false };
    }
    const data = await res.json();
    console.log('[Owner Email Success] Notification delivered to owner:', data.id);
    return { sent: true, id: data.id };
  } catch (e) {
    console.warn('[Owner Email Notice] Delivery failed safely:', e.message);
    return { sent: false, error: e.message };
  }
}
