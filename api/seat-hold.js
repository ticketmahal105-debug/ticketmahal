import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

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

// Normalize event ID so that "movie-spiderman-brand-new-day", "spider-man-brand-new-day", etc. match seamlessly
export function normalizeEventId(id) {
  if (!id) return '';
  return String(id)
    .trim()
    .toLowerCase()
    .replace(/^movie-/, '')
    .replace(/[^a-z0-9]/g, '');
}

// Normalize and match showtime (e.g. "07:30 PM", "7:30 PM", "07:30pm")
export function matchesShowtime(s1, s2) {
  if (!s1 || !s2) return true;
  const clean = (s) => {
    let str = String(s).trim().toLowerCase().replace(/\s+/g, '');
    if (/^\d:\d\d/.test(str)) {
      str = '0' + str;
    }
    return str;
  };
  return clean(s1) === clean(s2);
}

// Read all permanently sold seats from data/store.json for a given event and showtime
export function getSoldSeatsFromStore(eventId, showtime) {
  const sold = new Set();
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      const data = JSON.parse(raw);
      const targetNormEvent = normalizeEventId(eventId);

      // 1. Check bookings
      if (Array.isArray(data.bookings)) {
        for (const b of data.bookings) {
          if (b.booking_status === 'cancelled') continue;
          if (normalizeEventId(b.event_id) !== targetNormEvent) continue;
          if (showtime && !matchesShowtime(b.showtime, showtime)) continue;

          if (Array.isArray(b.seats)) {
            b.seats.forEach((s) => {
              if (s) sold.add(String(s).trim().toUpperCase());
            });
          } else if (typeof b.seats === 'string') {
            b.seats.split(',').forEach((s) => {
              const trimmed = s.trim().toUpperCase();
              if (trimmed) sold.add(trimmed);
            });
          }
        }
      }

      // 2. Check individual tickets
      if (Array.isArray(data.tickets)) {
        for (const t of data.tickets) {
          if (t.status === 'cancelled') continue;
          if (normalizeEventId(t.event_id) !== targetNormEvent) continue;
          if (showtime && t.events?.start_time && !matchesShowtime(t.events.start_time, showtime)) continue;

          if (t.seat) {
            sold.add(String(t.seat).trim().toUpperCase());
          }
        }
      }
    }
  } catch (err) {
    console.warn('[SeatHold] Error reading store.json for sold seats:', err.message);
  }
  return sold;
}

// Read all permanently sold seats from Supabase for a given event and showtime
export async function getSoldSeatsFromSupabase(eventId, showtime, supabase) {
  const sold = new Set();
  if (!supabase) return sold;

  try {
    const targetNormEvent = normalizeEventId(eventId);

    const { data: bData } = await supabase
      .from('bookings')
      .select('event_id, seats, showtime, booking_status')
      .neq('booking_status', 'cancelled');

    if (Array.isArray(bData)) {
      for (const b of bData) {
        if (normalizeEventId(b.event_id) !== targetNormEvent) continue;
        if (showtime && !matchesShowtime(b.showtime, showtime)) continue;

        if (Array.isArray(b.seats)) {
          b.seats.forEach((s) => {
            if (s) sold.add(String(s).trim().toUpperCase());
          });
        } else if (typeof b.seats === 'string') {
          b.seats.split(',').forEach((s) => {
            const trimmed = s.trim().toUpperCase();
            if (trimmed) sold.add(trimmed);
          });
        }
      }
    }

    const { data: tData } = await supabase
      .from('tickets')
      .select('event_id, seat, status')
      .neq('status', 'cancelled');

    if (Array.isArray(tData)) {
      for (const t of tData) {
        if (normalizeEventId(t.event_id) !== targetNormEvent) continue;
        if (t.seat) {
          sold.add(String(t.seat).trim().toUpperCase());
        }
      }
    }
  } catch (e) {
    // Graceful fallback if Supabase table is unreachable
  }
  return sold;
}

// Authoritative In-Memory Seat Hold & Sold Registry
// Map key: `${normalizedEventId}:${sessionId}` => { holds: Map<holdRef, holdObj>, soldSeats: Set<seatId> }
const sessionSeatsStore = new Map();

// Helper to get or init session storage
export function getSessionStore(eventId, sessionId) {
  const normKey = `${normalizeEventId(eventId)}:${sessionId}`;
  if (!sessionSeatsStore.has(normKey)) {
    sessionSeatsStore.set(normKey, {
      holds: new Map(), // holdRef => { holdRef, seats: [], heldBy, heldUntil, createdAt }
      soldSeats: new Set()
    });
  }
  return sessionSeatsStore.get(normKey);
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

// Authoritative server-side seat confirmation callable directly from fulfillment
export function confirmSeatsSold({ eventId, sessionId, showtime, date, seats = [], holdReference }) {
  const effectiveSessionId = sessionId || `${date || 'upcoming'}_${(showtime || 'default').replace(/\s+/g, '')}`;
  const session = getSessionStore(eventId, effectiveSessionId);

  // If there was a hold with this reference, release it
  if (holdReference && session.holds.has(holdReference)) {
    const hold = session.holds.get(holdReference);
    if (Array.isArray(hold.seats)) {
      hold.seats.forEach((s) => {
        if (s) session.soldSeats.add(String(s).trim().toUpperCase());
      });
    }
    session.holds.delete(holdReference);
  }

  // Register all newly purchased seats as sold
  if (Array.isArray(seats)) {
    seats.forEach((s) => {
      if (s) session.soldSeats.add(String(s).trim().toUpperCase());
    });
  }

  // Clean up any other holds that might contain these newly sold seats
  for (const [ref, hold] of session.holds.entries()) {
    hold.seats = hold.seats.filter((s) => !session.soldSeats.has(String(s).trim().toUpperCase()));
    if (hold.seats.length === 0) {
      session.holds.delete(ref);
    }
  }

  return Array.from(session.soldSeats);
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

    const supabase = getSupabaseClient();

    // 1. GET SEAT STATUS
    if (action === 'get_seat_status') {
      // Synchronize permanently booked seats from both store.json and Supabase
      const storeSold = getSoldSeatsFromStore(eventId, showtime);
      const supabaseSold = await getSoldSeatsFromSupabase(eventId, showtime, supabase);

      // Merge into in-memory session
      storeSold.forEach((s) => session.soldSeats.add(s));
      supabaseSold.forEach((s) => session.soldSeats.add(s));

      const activeHeldSeats = [];
      for (const [ref, hold] of session.holds.entries()) {
        if (!holdReference || ref !== holdReference) {
          // Only show held if seat is not already sold
          hold.seats.forEach((s) => {
            const upper = String(s).trim().toUpperCase();
            if (!session.soldSeats.has(upper) && !activeHeldSeats.includes(upper)) {
              activeHeldSeats.push(upper);
            }
          });
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

      const upperSeats = seats.map((s) => String(s).trim().toUpperCase());

      // Ensure sold seats are fresh
      const storeSold = getSoldSeatsFromStore(eventId, showtime);
      const supabaseSold = await getSoldSeatsFromSupabase(eventId, showtime, supabase);
      storeSold.forEach((s) => session.soldSeats.add(s));
      supabaseSold.forEach((s) => session.soldSeats.add(s));

      // Check if any seat is already sold
      const conflictSold = upperSeats.filter((s) => session.soldSeats.has(s));
      if (conflictSold.length > 0) {
        return res.status(409).json({
          success: false,
          error: `Seat(s) ${conflictSold.join(', ')} have already been purchased. Please choose different seats.`,
          conflictSeats: conflictSold
        });
      }

      // Check if any seat is already held by someone else
      const conflictHeld = [];
      for (const [ref, hold] of session.holds.entries()) {
        if (ref !== holdReference) {
          for (const s of upperSeats) {
            if (hold.seats.map((x) => String(x).trim().toUpperCase()).includes(s)) {
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
        seats: upperSeats,
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
        seats: upperSeats,
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

    // 4. CONFIRM & CONVERT HELD SEATS TO PERMANENTLY SOLD
    if (action === 'confirm_seats') {
      const confirmed = confirmSeatsSold({
        eventId,
        sessionId: effectiveSessionId,
        showtime,
        date,
        seats,
        holdReference
      });

      return res.status(200).json({
        success: true,
        confirmedSeats: seats.map((s) => String(s).trim().toUpperCase()),
        soldSeats: confirmed
      });
    }

    return res.status(400).json({ success: false, error: 'Unknown action specified.' });
  } catch (err) {
    console.error('[SeatHold Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
