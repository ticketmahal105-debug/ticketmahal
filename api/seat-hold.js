import crypto from 'crypto';
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

// Authoritative In-Memory Seat Hold & Sold Registry
// Map key: `${eventId}:${sessionId}` => { holds: Map<holdRef, holdObj>, soldSeats: Set<seatId> }
const sessionSeatsStore = new Map();

// Helper to get or init session storage
function getSessionStore(eventId, sessionId) {
  const key = `${eventId}:${sessionId}`;
  if (!sessionSeatsStore.has(key)) {
    sessionSeatsStore.set(key, {
      holds: new Map(), // holdRef => { holdRef, seats: [], heldBy, heldUntil, createdAt }
      soldSeats: new Set(['A4', 'B8', 'E11', 'F12']) // Baseline pre-sold demo seats for realism
    });
  }
  return sessionSeatsStore.get(key);
}

// Prune expired holds for a session
function pruneExpiredHolds(session) {
  const now = Date.now();
  for (const [ref, hold] of session.holds.entries()) {
    if (new Date(hold.heldUntil).getTime() <= now) {
      session.holds.delete(ref);
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { action, eventId, sessionId, showtime, date, seats = [], holdReference, heldBy } = req.body || {};

    if (!eventId) {
      return res.status(400).json({ success: false, error: 'Missing eventId' });
    }

    const effectiveSessionId = sessionId || `${date || 'upcoming'}_${(showtime || 'default').replace(/\s+/g, '')}`;
    const session = getSessionStore(eventId, effectiveSessionId);
    pruneExpiredHolds(session);

    // 1. GET SEAT STATUS
    if (action === 'get_seat_status') {
      const activeHeldSeats = [];
      for (const [ref, hold] of session.holds.entries()) {
        if (!holdReference || ref !== holdReference) {
          activeHeldSeats.push(...hold.seats);
        }
      }

      return res.status(200).json({
        success: true,
        eventId,
        sessionId: effectiveSessionId,
        soldSeats: Array.from(session.soldSeats),
        heldSeats: activeHeldSeats,
        serverTime: Date.now()
      });
    }

    // 2. CREATE 10-MINUTE SEAT HOLD
    if (action === 'create_hold') {
      if (!Array.isArray(seats) || seats.length === 0) {
        return res.status(400).json({ success: false, error: 'Please select at least one seat.' });
      }

      // Check if any seat is already sold
      const conflictSold = seats.filter(s => session.soldSeats.has(s));
      if (conflictSold.length > 0) {
        return res.status(409).json({
          success: false,
          error: `Seat(s) ${conflictSold.join(', ')} have already been purchased.`,
          conflictSeats: conflictSold
        });
      }

      // Check if any seat is already held by someone else
      const conflictHeld = [];
      for (const [ref, hold] of session.holds.entries()) {
        if (ref !== holdReference) {
          for (const s of seats) {
            if (hold.seats.includes(s)) {
              conflictHeld.push(s);
            }
          }
        }
      }

      if (conflictHeld.length > 0) {
        return res.status(409).json({
          success: false,
          error: `Seat(s) ${conflictHeld.join(', ')} are currently held by another customer. Please choose different seats.`,
          conflictSeats: conflictHeld
        });
      }

      // Generate or reuse hold reference
      const ref = holdReference || `HOLD-TM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const now = Date.now();
      const heldUntil = new Date(now + 10 * 60 * 1000).toISOString(); // 10 minutes from now

      const holdRecord = {
        holdReference: ref,
        eventId,
        sessionId: effectiveSessionId,
        seats,
        heldBy: heldBy || 'guest',
        heldUntil,
        createdAt: new Date(now).toISOString()
      };

      session.holds.set(ref, holdRecord);

      return res.status(200).json({
        success: true,
        holdReference: ref,
        heldUntil,
        remainingSeconds: 600,
        seats,
        serverTime: now
      });
    }

    // 3. RELEASE SEAT HOLD
    if (action === 'release_hold') {
      if (holdReference && session.holds.has(holdReference)) {
        session.holds.delete(holdReference);
      }
      return res.status(200).json({ success: true, released: holdReference });
    }

    // 4. CONFIRM & CONVERT HELD SEATS TO SOLD
    if (action === 'confirm_seats') {
      if (holdReference && session.holds.has(holdReference)) {
        const hold = session.holds.get(holdReference);
        hold.seats.forEach(s => session.soldSeats.add(s));
        session.holds.delete(holdReference);
      } else if (Array.isArray(seats) && seats.length > 0) {
        seats.forEach(s => session.soldSeats.add(s));
      }

      return res.status(200).json({
        success: true,
        confirmedSeats: seats,
        soldSeats: Array.from(session.soldSeats)
      });
    }

    return res.status(400).json({ success: false, error: 'Unknown action specified.' });
  } catch (err) {
    console.error('Seat hold error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
