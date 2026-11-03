/**
 * Timezone-Safe Date & Time Utility for Ticket Mahal.
 * Authoritative timezone: Asia/Dubai (Gulf Standard Time, UTC+04:00).
 * Uses native Intl.DateTimeFormat without manual hour-offset mathematics.
 */

const GST_TIMEZONE = 'Asia/Dubai';

/**
 * Returns formatted Date & Time in GST: e.g. "31 Oct 2026 · 11:42 AM"
 */
export function formatGstDateTime(dateOrIso) {
  if (!dateOrIso) return '—';
  try {
    const d = new Date(dateOrIso);
    if (isNaN(d.getTime())) return '—';

    const datePart = new Intl.DateTimeFormat('en-GB', {
      timeZone: GST_TIMEZONE,
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(d);

    const timePart = new Intl.DateTimeFormat('en-US', {
      timeZone: GST_TIMEZONE,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(d);

    return `${datePart} · ${timePart}`;
  } catch (e) {
    return '—';
  }
}

/**
 * Returns formatted Date in GST: e.g. "31 Oct 2026"
 */
export function formatGstDate(dateOrIso) {
  if (!dateOrIso) return '—';
  try {
    const d = new Date(dateOrIso);
    if (isNaN(d.getTime())) return '—';

    return new Intl.DateTimeFormat('en-GB', {
      timeZone: GST_TIMEZONE,
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch (e) {
    return '—';
  }
}

/**
 * Returns formatted Time in GST: e.g. "11:42 AM"
 */
export function formatGstTime(dateOrIso) {
  if (!dateOrIso) return '—';
  try {
    const d = new Date(dateOrIso);
    if (isNaN(d.getTime())) return '—';

    return new Intl.DateTimeFormat('en-US', {
      timeZone: GST_TIMEZONE,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(d);
  } catch (e) {
    return '—';
  }
}

/**
 * Returns short Recent format in GST: e.g. "31 Oct · 11:42 AM"
 */
export function formatGstRecent(dateOrIso) {
  if (!dateOrIso) return '—';
  try {
    const d = new Date(dateOrIso);
    if (isNaN(d.getTime())) return '—';

    const dayMonth = new Intl.DateTimeFormat('en-GB', {
      timeZone: GST_TIMEZONE,
      day: 'numeric',
      month: 'short'
    }).format(d);

    const timePart = new Intl.DateTimeFormat('en-US', {
      timeZone: GST_TIMEZONE,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(d);

    return `${dayMonth} · ${timePart}`;
  } catch (e) {
    return '—';
  }
}

/**
 * Returns long Full format in GST: e.g. "31 October 2026 · 11:42 AM GST"
 */
export function formatGstFull(dateOrIso) {
  if (!dateOrIso) return '—';
  try {
    const d = new Date(dateOrIso);
    if (isNaN(d.getTime())) return '—';

    const datePart = new Intl.DateTimeFormat('en-GB', {
      timeZone: GST_TIMEZONE,
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d);

    const timePart = new Intl.DateTimeFormat('en-US', {
      timeZone: GST_TIMEZONE,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(d);

    return `${datePart} · ${timePart} GST`;
  } catch (e) {
    return '—';
  }
}
