import { 
  getAllVenuesFromStore, 
  saveVenueToStore, 
  deleteVenueFromStore, 
  getAllEventsFromStore, 
  getAllBookingsFromStore,
  recordActivityToStore 
} from './services/persistenceService.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    // GET: List all venues or single venue with associated events & bookings
    if (req.method === 'GET') {
      const id = req.query?.id || (req.url ? new URL(req.url, 'http://localhost').searchParams.get('id') : null);
      const venues = getAllVenuesFromStore();
      const allEvents = getAllEventsFromStore();
      const allBookings = getAllBookingsFromStore();

      if (id) {
        const venue = venues.find(v => v.id === id);
        if (!venue) {
          return res.status(404).json({ success: false, error: 'Venue not found' });
        }

        // Attach events hosted at this venue
        const venueEvents = allEvents.filter(e => 
          (e.venue_name && e.venue_name.toLowerCase() === venue.name.toLowerCase()) ||
          e.venue_id === venue.id
        );

        // Attach bookings for these events
        const eventIds = new Set(venueEvents.map(e => e.id));
        const venueBookings = allBookings.filter(b => eventIds.has(b.event_id) || (b.events && eventIds.has(b.events.id)));

        return res.status(200).json({
          success: true,
          venue: {
            ...venue,
            events: venueEvents,
            bookings: venueBookings
          }
        });
      }

      // Enrich list with event count and capacity
      const enrichedVenues = venues.map(v => {
        const matchingEvents = allEvents.filter(e => 
          (e.venue_name && e.venue_name.toLowerCase() === v.name.toLowerCase()) ||
          e.venue_id === v.id
        );
        return {
          ...v,
          events_count: matchingEvents.length
        };
      });

      return res.status(200).json({ success: true, venues: enrichedVenues });
    }

    // POST: Create or Update Venue
    if (req.method === 'POST') {
      const venueData = req.body || {};
      if (!venueData.name) {
        return res.status(400).json({ success: false, error: 'Venue name is required' });
      }

      const saved = saveVenueToStore(venueData);

      recordActivityToStore({
        id: `act-ven-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: venueData.id ? 'venue_updated' : 'venue_created',
        customer: 'Admin',
        status: 'success',
        details: `Venue "${saved.name}" in ${saved.city || 'UAE'} saved with status ${saved.status}`
      });

      return res.status(200).json({ success: true, venue: saved });
    }

    // DELETE: Safe deletion / Archive
    if (req.method === 'DELETE') {
      const { id } = req.body || req.query || {};
      if (!id) {
        return res.status(400).json({ success: false, error: 'Venue ID is required' });
      }

      const allEvents = getAllEventsFromStore();
      const venues = getAllVenuesFromStore();
      const targetVenue = venues.find(v => v.id === id);

      if (!targetVenue) {
        return res.status(404).json({ success: false, error: 'Venue not found' });
      }

      const isUsedByEvents = allEvents.some(e => 
        (e.venue_name && e.venue_name.toLowerCase() === targetVenue.name.toLowerCase()) ||
        e.venue_id === id
      );

      // Section I Requirement: Do not delete a venue if doing so would break historical bookings. Use archive/deactivate.
      const archived = deleteVenueFromStore(id);
      return res.status(200).json({
        success: true,
        archived: true,
        message: isUsedByEvents 
          ? `Venue "${targetVenue.name}" has associated events. It has been deactivated/archived to maintain historical integrity.` 
          : `Venue "${targetVenue.name}" archived successfully.`,
        venue: archived
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('[Admin Venues API Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
