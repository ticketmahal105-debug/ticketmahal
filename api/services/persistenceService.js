import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

// Memory store
const store = {
  bookings: [],
  tickets: [],
  activities: []
};

// Load existing data on startup
try {
  if (fs.existsSync(STORE_FILE)) {
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.bookings)) store.bookings = parsed.bookings;
    if (Array.isArray(parsed.tickets)) store.tickets = parsed.tickets;
    if (Array.isArray(parsed.activities)) store.activities = parsed.activities;
    console.log(`[PersistenceService] Loaded ${store.bookings.length} bookings, ${store.tickets.length} tickets from store.json`);
  }
} catch (err) {
  console.warn('[PersistenceService] Notice loading store.json:', err.message);
}

function persistToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    // Ephemeral / read-only filesystem (e.g. some serverless containers)
    // In-memory cache continues serving requests seamlessly
  }
}

export function saveBookingToStore(booking, tickets = []) {
  if (!booking || !booking.booking_number) return;

  // Deduplicate booking by booking_number
  const bIdx = store.bookings.findIndex(b => b.booking_number === booking.booking_number);
  if (bIdx !== -1) {
    store.bookings[bIdx] = { ...store.bookings[bIdx], ...booking };
  } else {
    store.bookings.unshift(booking);
  }

  // Deduplicate and save tickets
  if (Array.isArray(tickets)) {
    tickets.forEach(t => {
      const tIdx = store.tickets.findIndex(existing => existing.ticket_number === t.ticket_number);
      if (tIdx !== -1) {
        store.tickets[tIdx] = { ...store.tickets[tIdx], ...t };
      } else {
        store.tickets.unshift(t);
      }
    });
  }

  persistToDisk();
}

export function getAllBookingsFromStore() {
  return [...store.bookings];
}

export function getAllTicketsFromStore() {
  return [...store.tickets];
}

export function getBookingFromStore(lookup) {
  if (!lookup) return null;
  return store.bookings.find(b => 
    b.booking_number === lookup || 
    b.id === lookup || 
    b.access_token === lookup || 
    b.access_token_hash === lookup
  ) || null;
}

export function getTicketsForBookingFromStore(bookingRef) {
  if (!bookingRef) return [];
  return store.tickets.filter(t => 
    t.booking_reference === bookingRef || 
    t.booking_id === bookingRef
  );
}

export function recordActivityToStore(activity) {
  if (!activity) return;
  store.activities.unshift(activity);
  if (store.activities.length > 200) store.activities.pop();
  persistToDisk();
}

export function getAllActivitiesFromStore() {
  return [...store.activities];
}
