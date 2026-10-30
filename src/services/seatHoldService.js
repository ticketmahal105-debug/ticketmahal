/**
 * Client service to interface with authoritative server-side seat hold system.
 */

export const createSeatHold = async ({ eventId, sessionId, showtime, date, seats, heldBy, holdReference }) => {
  try {
    const res = await fetch('/api/seat-hold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_hold',
        eventId,
        sessionId,
        showtime,
        date,
        seats,
        heldBy,
        holdReference
      })
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Failed to create seat hold:', err);
    return { success: false, error: err.message };
  }
};

export const getSeatStatus = async ({ eventId, sessionId, showtime, date, holdReference }) => {
  try {
    const res = await fetch('/api/seat-hold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_seat_status',
        eventId,
        sessionId,
        showtime,
        date,
        holdReference
      })
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Failed to get seat status:', err);
    return { success: false, error: err.message, soldSeats: [], heldSeats: [] };
  }
};

export const releaseSeatHold = async ({ eventId, sessionId, holdReference }) => {
  try {
    const res = await fetch('/api/seat-hold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'release_hold',
        eventId,
        sessionId,
        holdReference
      })
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
};
