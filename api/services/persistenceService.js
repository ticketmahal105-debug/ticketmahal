import fs from 'fs';
import path from 'path';
import { dummyMovies } from '../../src/data/dummyMovies.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

// Initial Venues
const defaultVenues = [
  {
    id: 'venue-vox-moe',
    name: 'Vox Cinemas, Mall of the Emirates',
    address: 'Mall of the Emirates, Al Barsha',
    area: 'Al Barsha',
    city: 'Dubai',
    emirate: 'Dubai',
    country: 'United Arab Emirates',
    description: 'Premier cinema destination featuring IMAX laser and luxury dining lounges.',
    entry_instructions: 'Level 2, near food court. Please present digital QR ticket at usher stand.',
    map_url: 'https://maps.google.com/?q=Vox+Cinemas+Mall+of+the+Emirates',
    capacity: 450,
    doors_open: '30 mins before showtime',
    status: 'active',
    created_at: '2026-01-10T08:00:00.000Z'
  },
  {
    id: 'venue-roxy-citywalk',
    name: 'Roxy Cinemas, City Walk',
    address: 'City Walk, Al Safa',
    area: 'City Walk',
    city: 'Dubai',
    emirate: 'Dubai',
    country: 'United Arab Emirates',
    description: 'Boutique cinematic luxury with plush reclining diamond armchairs.',
    entry_instructions: 'Main concourse City Walk. Valet parking available at gate 2.',
    map_url: 'https://maps.google.com/?q=Roxy+Cinemas+City+Walk',
    capacity: 350,
    doors_open: '30 mins before showtime',
    status: 'active',
    created_at: '2026-01-10T08:00:00.000Z'
  },
  {
    id: 'venue-reel-dubaimall',
    name: 'Reel Cinemas, Dubai Mall',
    address: 'The Dubai Mall, Downtown Dubai',
    area: 'Downtown Dubai',
    city: 'Dubai',
    emirate: 'Dubai',
    country: 'United Arab Emirates',
    description: 'One of the world’s largest megaplexes overlooking the Dubai Fountain.',
    entry_instructions: 'Level 2, Parking Cinema P7. Show digital ticket for fast-track entry.',
    map_url: 'https://maps.google.com/?q=Reel+Cinemas+The+Dubai+Mall',
    capacity: 500,
    doors_open: '30 mins before showtime',
    status: 'active',
    created_at: '2026-01-10T08:00:00.000Z'
  },
  {
    id: 'venue-cinema-city',
    name: 'Cinema City, Fountain Views',
    address: 'Downtown Dubai, Sheikh Mohammed Bin Rashid Blvd',
    area: 'Downtown Dubai',
    city: 'Dubai',
    emirate: 'Dubai',
    country: 'United Arab Emirates',
    description: 'Sophisticated entertainment lounge with licensed cinema auditoriums.',
    entry_instructions: 'Fountain Views Mall concourse level.',
    map_url: 'https://maps.google.com/?q=Cinema+City+Fountain+Views',
    capacity: 280,
    doors_open: '30 mins before showtime',
    status: 'active',
    created_at: '2026-01-10T08:00:00.000Z'
  },
  {
    id: 'venue-novo-ibn',
    name: 'Novo Cinemas, Ibn Battuta',
    address: 'Ibn Battuta Mall, Jebel Ali',
    area: 'Jebel Ali',
    city: 'Dubai',
    emirate: 'Dubai',
    country: 'United Arab Emirates',
    description: 'Iconic entertainment destination with immersive audio-visual tech.',
    entry_instructions: 'China Court entrance, Ibn Battuta Mall.',
    map_url: 'https://maps.google.com/?q=Novo+Cinemas+Ibn+Battuta',
    capacity: 320,
    doors_open: '30 mins before showtime',
    status: 'active',
    created_at: '2026-01-10T08:00:00.000Z'
  },
  {
    id: 'venue-dubai-opera',
    name: 'Dubai Opera',
    address: 'Sheikh Mohammed bin Rashid Blvd, Downtown Dubai',
    area: 'Downtown Dubai',
    city: 'Dubai',
    emirate: 'Dubai',
    country: 'United Arab Emirates',
    description: 'The definitive performing arts centre of the UAE, hosting world-class operas, ballets, and concerts.',
    entry_instructions: 'Black tie / smart casual attire recommended. Doors close promptly at event start time.',
    map_url: 'https://maps.google.com/?q=Dubai+Opera',
    capacity: 2000,
    doors_open: '60 mins before curtain call',
    status: 'active',
    created_at: '2026-01-10T08:00:00.000Z'
  },
  {
    id: 'venue-cocacola-arena',
    name: 'Coca-Cola Arena',
    address: 'City Walk, Al Wasl',
    area: 'City Walk',
    city: 'Dubai',
    emirate: 'Dubai',
    country: 'United Arab Emirates',
    description: 'The Middle East’s biggest multipurpose indoor entertainment venue.',
    entry_instructions: 'Gates open 90 mins before show. Security bag check enforced.',
    map_url: 'https://maps.google.com/?q=Coca-Cola+Arena+Dubai',
    capacity: 17000,
    doors_open: '90 mins before event',
    status: 'active',
    created_at: '2026-01-10T08:00:00.000Z'
  },
  {
    id: 'venue-etihad-arena',
    name: 'Etihad Arena',
    address: 'Yas Bay Waterfront, Yas Island',
    area: 'Yas Island',
    city: 'Abu Dhabi',
    emirate: 'Abu Dhabi',
    country: 'United Arab Emirates',
    description: 'Award-winning entertainment arena located on the vibrant Yas Bay Waterfront.',
    entry_instructions: 'Grand concourse entry via Waterfront promenade.',
    map_url: 'https://maps.google.com/?q=Etihad+Arena+Abu+Dhabi',
    capacity: 18000,
    doors_open: '90 mins before event',
    status: 'active',
    created_at: '2026-01-10T08:00:00.000Z'
  }
];

// Initial Categories
const defaultCategories = [
  {
    id: 'cat-movies',
    name: 'Movies',
    slug: 'movies',
    description: 'Exclusive blockbuster screenings, IMAX laser & VIP cinema experiences',
    icon: 'Film',
    display_order: 1,
    status: 'active',
    created_at: '2026-01-10T08:00:00.000Z'
  },
  {
    id: 'cat-concerts',
    name: 'Live In Rhythm',
    slug: 'live-in-rhythm',
    description: 'Electrifying concerts, symphony performances & acoustic festival nights',
    icon: 'Music',
    display_order: 2,
    status: 'active',
    created_at: '2026-01-10T08:00:00.000Z'
  },
  {
    id: 'cat-comedy',
    name: 'The Laugh Lounge',
    slug: 'the-laugh-lounge',
    description: 'Hilarious stand-up specials, international headliners & comedy clubs',
    icon: 'Smile',
    display_order: 3,
    status: 'active',
    created_at: '2026-01-10T08:00:00.000Z'
  },
  {
    id: 'cat-theatre',
    name: 'Theatre & Plays',
    slug: 'theatre-and-plays',
    description: 'Acclaimed broadway touring productions, classical drama & stage plays',
    icon: 'Theater',
    display_order: 4,
    status: 'active',
    created_at: '2026-01-10T08:00:00.000Z'
  },
  {
    id: 'cat-experiences',
    name: 'Experiences & Attractions',
    slug: 'experiences-and-attractions',
    description: 'Curated luxury adventures, theme park admissions & iconic city tours',
    icon: 'Compass',
    display_order: 5,
    status: 'active',
    created_at: '2026-01-10T08:00:00.000Z'
  },
  {
    id: 'cat-outdoor',
    name: 'Beyond The Walls',
    slug: 'beyond-the-walls',
    description: 'Rooftop cinema under the stars, desert safaris & open-air spectacles',
    icon: 'Sun',
    display_order: 6,
    status: 'active',
    created_at: '2026-01-10T08:00:00.000Z'
  }
];

// Initial Promo Codes
const defaultPromoCodes = [
  {
    id: 'promo-welcome10',
    code: 'WELCOME10',
    description: '10% Welcome discount on all premier event tickets',
    discount_type: 'percentage', // 'percentage' | 'fixed'
    discount_value: 10,
    min_order_amount: 100,
    max_discount: 60,
    usage_limit: 500,
    per_customer_limit: 1,
    uses_count: 0,
    valid_from: '2026-01-01',
    valid_until: '2026-12-31',
    status: 'active',
    applicable_events: ['all'],
    created_at: '2026-01-10T08:00:00.000Z'
  },
  {
    id: 'promo-mahal50',
    code: 'MAHAL50',
    description: 'AED 50 Flat Discount for VIP & Premium Reservations',
    discount_type: 'fixed',
    discount_value: 50,
    min_order_amount: 250,
    max_discount: 50,
    usage_limit: 100,
    per_customer_limit: 2,
    uses_count: 0,
    valid_from: '2026-01-01',
    valid_until: '2026-12-31',
    status: 'active',
    applicable_events: ['all'],
    created_at: '2026-01-10T08:00:00.000Z'
  },
  {
    id: 'promo-vippass20',
    code: 'VIPPASS20',
    description: '20% Off Royal Tier & Diamond Seating',
    discount_type: 'percentage',
    discount_value: 20,
    min_order_amount: 350,
    max_discount: 120,
    usage_limit: 50,
    per_customer_limit: 1,
    uses_count: 0,
    valid_from: '2026-01-01',
    valid_until: '2026-12-31',
    status: 'active',
    applicable_events: ['all'],
    created_at: '2026-01-10T08:00:00.000Z'
  }
];

// Initial Events from dummyMovies with structured ticket types
function buildInitialEvents() {
  return dummyMovies.map((m) => ({
    id: m.id,
    event_name: m.title,
    slug: m.slug,
    event_image: m.image,
    backdrop_image: m.backdrop,
    category: m.category || 'Movies',
    venue_name: m.venue,
    city: m.city || 'Dubai',
    event_date: m.releaseDate,
    start_time: '07:30 PM',
    end_time: '10:00 PM',
    doors_open: '07:00 PM',
    description: m.shortDescription,
    short_description: m.shortDescription,
    age_restriction: m.certificate || 'PG-13',
    language: m.language || 'English',
    duration: m.runtime || '2h 15m',
    organizer: 'Ticket Mahal Live Entertainment',
    starting_price: Number(m.startingPrice) || 120,
    currency: m.currency || 'AED',
    status: 'published',
    featured: m.badge === 'BLOCKBUSTER' || m.demandStatus === 'MOST BOOKED',
    created_at: '2026-01-10T08:00:00.000Z',
    ticket_types: [
      { id: `${m.id}-std`, name: 'Standard Admission', price: Number(m.startingPrice) || 120, capacity: 60, sold_quantity: 0, status: 'active', section: 'Main Hall' },
      { id: `${m.id}-prem`, name: 'Premium Tier', price: (Number(m.startingPrice) || 120) + 40, capacity: 40, sold_quantity: 0, status: 'active', section: 'Balcony' },
      { id: `${m.id}-vip`, name: 'VIP Royal Box', price: (Number(m.startingPrice) || 120) + 100, capacity: 20, sold_quantity: 0, status: 'active', section: 'Royal Box' }
    ]
  }));
}

// Memory store
const store = {
  bookings: [],
  tickets: [],
  activities: [],
  events: buildInitialEvents(),
  venues: [...defaultVenues],
  categories: [...defaultCategories],
  promoCodes: [...defaultPromoCodes]
};

// Load existing data from store.json
try {
  if (fs.existsSync(STORE_FILE)) {
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.bookings)) store.bookings = parsed.bookings;
    if (Array.isArray(parsed.tickets)) store.tickets = parsed.tickets;
    if (Array.isArray(parsed.activities)) store.activities = parsed.activities;
    if (Array.isArray(parsed.events) && parsed.events.length > 0) store.events = parsed.events;
    if (Array.isArray(parsed.venues) && parsed.venues.length > 0) store.venues = parsed.venues;
    if (Array.isArray(parsed.categories) && parsed.categories.length > 0) store.categories = parsed.categories;
    if (Array.isArray(parsed.promoCodes) && parsed.promoCodes.length > 0) store.promoCodes = parsed.promoCodes;
  }
} catch (err) {
  console.warn('[PersistenceService] Error loading store.json:', err.message);
}

function persistToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    // Ephemeral runtime fallback
  }
}

// --- BOOKINGS & TICKETS ---
export function saveBookingToStore(booking, tickets = []) {
  if (!booking || !booking.booking_number) return;

  const bIdx = store.bookings.findIndex(b => b.booking_number === booking.booking_number);
  if (bIdx !== -1) {
    store.bookings[bIdx] = { ...store.bookings[bIdx], ...booking };
  } else {
    store.bookings.unshift(booking);
  }

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

export function updateBookingStatusInStore(bookingNumber, newStatus) {
  const b = store.bookings.find(item => item.booking_number === bookingNumber);
  if (b) {
    b.booking_status = newStatus;
    if (newStatus === 'cancelled') {
      store.tickets.forEach(t => {
        if (t.booking_reference === bookingNumber) t.status = 'cancelled';
      });
    }
    persistToDisk();
    return b;
  }
  return null;
}

export function updateTicketStatusInStore(ticketNumber, newStatus, usedAt = null) {
  const t = store.tickets.find(item => item.ticket_number === ticketNumber);
  if (t) {
    t.status = newStatus;
    if (newStatus === 'used' || newStatus === 'checked_in') {
      t.used_at = usedAt || new Date().toISOString();
      t.checked_in_at = t.used_at;
    }
    persistToDisk();
    return t;
  }
  return null;
}

// --- ACTIVITIES ---
export function recordActivityToStore(activity) {
  if (!activity) return;
  store.activities.unshift(activity);
  if (store.activities.length > 300) store.activities.pop();
  persistToDisk();
}

export function getAllActivitiesFromStore() {
  return [...store.activities];
}

// --- EVENTS ---
export function getAllEventsFromStore() {
  return [...store.events];
}

export function getEventFromStore(idOrSlug) {
  if (!idOrSlug) return null;
  return store.events.find(e => e.id === idOrSlug || e.slug === idOrSlug) || null;
}

export function saveEventToStore(eventData, ticketTypes = []) {
  if (!eventData) return null;
  const id = eventData.id || `event-${Date.now()}`;
  const slug = eventData.slug || (eventData.event_name ? eventData.event_name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : id);

  const mergedEvent = {
    ...eventData,
    id,
    slug,
    ticket_types: Array.isArray(ticketTypes) && ticketTypes.length > 0 
      ? ticketTypes 
      : eventData.ticket_types || [
          { id: `${id}-std`, name: 'Standard', price: eventData.starting_price || 120, capacity: 100, sold_quantity: 0, status: 'active' }
        ],
    updated_at: new Date().toISOString()
  };

  const idx = store.events.findIndex(e => e.id === id || e.slug === slug);
  if (idx !== -1) {
    store.events[idx] = { ...store.events[idx], ...mergedEvent };
  } else {
    store.events.unshift({ ...mergedEvent, created_at: new Date().toISOString() });
  }

  persistToDisk();
  return mergedEvent;
}

export function deleteEventFromStore(id) {
  const idx = store.events.findIndex(e => e.id === id || e.slug === id);
  if (idx !== -1) {
    const deleted = store.events.splice(idx, 1)[0];
    persistToDisk();
    return deleted;
  }
  return null;
}

// --- VENUES ---
export function getAllVenuesFromStore() {
  return [...store.venues];
}

export function saveVenueToStore(venueData) {
  if (!venueData || !venueData.name) return null;
  const id = venueData.id || `venue-${Date.now()}`;
  const venue = {
    ...venueData,
    id,
    status: venueData.status || 'active',
    updated_at: new Date().toISOString()
  };

  const idx = store.venues.findIndex(v => v.id === id);
  if (idx !== -1) {
    store.venues[idx] = { ...store.venues[idx], ...venue };
  } else {
    store.venues.push({ ...venue, created_at: new Date().toISOString() });
  }

  persistToDisk();
  return venue;
}

export function deleteVenueFromStore(id) {
  // Archive instead of hard delete to preserve historical integrity
  const venue = store.venues.find(v => v.id === id);
  if (venue) {
    venue.status = 'archived';
    persistToDisk();
    return venue;
  }
  return null;
}

// --- CATEGORIES ---
export function getAllCategoriesFromStore() {
  return [...store.categories].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
}

export function saveCategoryToStore(catData) {
  if (!catData || !catData.name) return null;
  const id = catData.id || `cat-${catData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const slug = catData.slug || catData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const cat = {
    ...catData,
    id,
    slug,
    status: catData.status || 'active',
    updated_at: new Date().toISOString()
  };

  const idx = store.categories.findIndex(c => c.id === id || c.slug === slug);
  if (idx !== -1) {
    store.categories[idx] = { ...store.categories[idx], ...cat };
  } else {
    store.categories.push({ ...cat, created_at: new Date().toISOString() });
  }

  persistToDisk();
  return cat;
}

export function deleteCategoryFromStore(id) {
  const cat = store.categories.find(c => c.id === id || c.slug === id);
  if (cat) {
    cat.status = 'inactive';
    persistToDisk();
    return cat;
  }
  return null;
}

// --- PROMO CODES ---
export function getAllPromoCodesFromStore() {
  return [...store.promoCodes];
}

export function getPromoCodeFromStore(code) {
  if (!code) return null;
  const clean = code.trim().toUpperCase();
  return store.promoCodes.find(p => p.code === clean) || null;
}

export function savePromoCodeToStore(promoData) {
  if (!promoData || !promoData.code) return null;
  const code = promoData.code.trim().toUpperCase();
  const id = promoData.id || `promo-${Date.now()}`;

  const promo = {
    ...promoData,
    id,
    code,
    uses_count: Number(promoData.uses_count) || 0,
    status: promoData.status || 'active',
    updated_at: new Date().toISOString()
  };

  const idx = store.promoCodes.findIndex(p => p.id === id || p.code === code);
  if (idx !== -1) {
    store.promoCodes[idx] = { ...store.promoCodes[idx], ...promo };
  } else {
    store.promoCodes.unshift({ ...promo, created_at: new Date().toISOString() });
  }

  persistToDisk();
  return promo;
}

export function deletePromoCodeFromStore(id) {
  const promo = store.promoCodes.find(p => p.id === id);
  if (promo) {
    promo.status = 'inactive';
    persistToDisk();
    return promo;
  }
  return null;
}

export function recordPromoUsage(code, orderAmount = 0) {
  const promo = getPromoCodeFromStore(code);
  if (promo) {
    promo.uses_count = (Number(promo.uses_count) || 0) + 1;
    persistToDisk();
  }
}
