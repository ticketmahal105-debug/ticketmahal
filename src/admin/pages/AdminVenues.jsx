import { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Edit, Trash2, Eye, ExternalLink, Calendar, Receipt, Users, AlertCircle, X, ShieldAlert } from 'lucide-react';

const AdminVenues = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [selectedVenueDetails, setSelectedVenueDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    area: '',
    city: 'Dubai',
    emirate: 'Dubai',
    country: 'United Arab Emirates',
    description: '',
    entry_instructions: '',
    map_url: '',
    capacity: 500,
    doors_open: '30 mins before showtime',
    status: 'active'
  });

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin-venues');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success && Array.isArray(json.venues)) {
          setVenues(json.venues);
        }
      }
    } catch (err) {
      console.error('Error fetching venues:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingVenue(null);
    setFormData({
      name: '',
      address: '',
      area: '',
      city: 'Dubai',
      emirate: 'Dubai',
      country: 'United Arab Emirates',
      description: '',
      entry_instructions: '',
      map_url: '',
      capacity: 500,
      doors_open: '30 mins before showtime',
      status: 'active'
    });
    setError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (venue) => {
    setEditingVenue(venue);
    setFormData({
      name: venue.name || '',
      address: venue.address || '',
      area: venue.area || '',
      city: venue.city || 'Dubai',
      emirate: venue.emirate || 'Dubai',
      country: venue.country || 'United Arab Emirates',
      description: venue.description || '',
      entry_instructions: venue.entry_instructions || '',
      map_url: venue.map_url || '',
      capacity: venue.capacity || 500,
      doors_open: venue.doors_open || '30 mins before showtime',
      status: venue.status || 'active'
    });
    setError(null);
    setShowModal(true);
  };

  const handleViewVenueDetails = async (venue) => {
    setLoadingDetails(true);
    setSelectedVenueDetails(null);
    try {
      const res = await fetch(`/api/admin-venues?id=${venue.id}`);
      const json = await res.json();
      if (json.success && json.venue) {
        setSelectedVenueDetails(json.venue);
      }
    } catch (err) {
      console.error('Error fetching venue details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSaveVenue = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...(editingVenue ? { id: editingVenue.id } : {}),
        ...formData
      };

      const res = await fetch('/api/admin-venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to save venue');
      }

      setShowModal(false);
      fetchVenues();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (venue) => {
    const confirmed = window.confirm(
      venue.events_count > 0
        ? `This venue has ${venue.events_count} event(s) and historical bookings. To protect booking integrity, it will be safely archived/deactivated. Proceed?`
        : `Are you sure you want to archive "${venue.name}"?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch('/api/admin-venues', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: venue.id })
      });
      const json = await res.json();
      if (json.success) {
        if (json.message) alert(json.message);
        fetchVenues();
      }
    } catch (err) {
      console.error('Error archiving venue:', err);
    }
  };

  const filteredVenues = venues.filter(v => {
    const query = search.toLowerCase();
    const matchesSearch = v.name.toLowerCase().includes(query) ||
                          (v.area && v.area.toLowerCase().includes(query)) ||
                          (v.city && v.city.toLowerCase().includes(query));
    const matchesCity = filterCity === 'all' ? true : v.city?.toLowerCase() === filterCity.toLowerCase();
    return matchesSearch && matchesCity;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-playfair text-3xl font-semibold text-ticket-charcoal tracking-wide mb-1">Venues Management</h1>
          <p className="text-ticket-charcoal/60 text-sm">Manage multi-purpose theatres, auditoriums, seating layouts, and operational entry rules.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-ticket-charcoal text-ticket-white hover:bg-ticket-charcoal/90 text-sm font-medium rounded-full shadow-md hover:shadow-lg transition-all duration-300 self-start sm:self-auto"
        >
          <Plus size={16} />
          Create Venue
        </button>
      </div>

      {/* Filter panel */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-ticket-white p-4 border border-ticket-beige/60 rounded-3xl shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ticket-charcoal/40" />
          <input
            type="text"
            placeholder="Search venue name, area, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-ticket-ivory border border-ticket-beige/60 rounded-full text-sm outline-none focus:border-ticket-gold focus:bg-white transition-all placeholder:text-ticket-charcoal/30 text-ticket-charcoal"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto py-1">
          {['all', 'dubai', 'abu dhabi'].map((city) => (
            <button
              key={city}
              onClick={() => setFilterCity(city)}
              className={`px-4 py-2 rounded-full text-xs font-medium border capitalize whitespace-nowrap transition-all ${
                filterCity === city
                  ? 'bg-ticket-burgundy/10 text-ticket-burgundy border-ticket-gold/30'
                  : 'bg-ticket-white text-ticket-charcoal/60 border-ticket-beige/60 hover:bg-ivory'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Venues */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-ticket-gold/30 border-t-ticket-burgundy rounded-full animate-spin" />
        </div>
      ) : filteredVenues.length === 0 ? (
        <div className="text-center py-20 bg-ticket-white border border-ticket-beige/60 rounded-3xl shadow-sm">
          <p className="text-ticket-charcoal/60 text-sm">No venues found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVenues.map((venue) => (
            <div
              key={venue.id}
              className="bg-ticket-white border border-ticket-beige/70 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="inline-flex items-center justify-center px-2.5 py-1 bg-ticket-burgundy/10 text-ticket-burgundy text-[11px] font-bold rounded-full border border-ticket-gold/20 whitespace-nowrap shadow-2xs">
                    {venue.city}, {venue.emirate || 'UAE'}
                  </span>
                  <span className={`inline-flex items-center justify-center px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full whitespace-nowrap border shadow-2xs ${
                    venue.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-300'
                  }`}>
                    {venue.status}
                  </span>
                </div>

                <h3 className="font-playfair text-xl font-bold text-ticket-charcoal mb-1 line-clamp-1">
                  {venue.name}
                </h3>
                <p className="text-xs text-ticket-charcoal/50 flex items-center gap-1.5 mb-3">
                  <MapPin size={13} className="text-ticket-burgundy shrink-0" />
                  <span className="truncate">{venue.address || venue.area}</span>
                </p>

                <p className="text-xs text-ticket-charcoal/70 line-clamp-2 mb-4">
                  {venue.description || 'Premier event and cinema entertainment destination.'}
                </p>

                <div className="grid grid-cols-2 gap-2 p-3 bg-ticket-ivory rounded-2xl border border-ticket-beige/50 text-xs text-ticket-charcoal/80 mb-4">
                  <div>
                    <span className="text-[10px] text-ticket-charcoal/40 uppercase font-semibold block">Capacity</span>
                    <span className="font-bold text-ticket-charcoal">{venue.capacity?.toLocaleString() || 500} Seats</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-ticket-charcoal/40 uppercase font-semibold block">Hosted Shows</span>
                    <span className="font-bold text-ticket-burgundy">{venue.events_count || 0} Events</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-ticket-beige/60">
                <button
                  onClick={() => handleViewVenueDetails(venue)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-ticket-burgundy hover:underline"
                >
                  <Eye size={14} /> View Events & Ledger
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(venue)}
                    title="Edit Venue"
                    className="p-2 border border-ticket-beige hover:border-ticket-burgundy hover:text-ticket-burgundy text-ticket-charcoal/60 rounded-xl transition-all"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(venue)}
                    title="Archive Venue"
                    className="p-2 border border-ticket-beige hover:border-red-500 hover:text-red-500 text-ticket-charcoal/60 rounded-xl transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VENUE DETAIL DRAWER / MODAL */}
      {selectedVenueDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-ticket-white rounded-3xl border border-ticket-beige/80 shadow-2xl p-6 sm:p-8 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-ticket-beige/60 pb-4 mb-6">
              <div>
                <span className="text-xs uppercase tracking-wider text-ticket-burgundy font-bold">Venue Overview</span>
                <h3 className="font-playfair text-2xl font-bold text-ticket-charcoal">{selectedVenueDetails.name}</h3>
                <p className="text-xs text-ticket-charcoal/60 mt-0.5">{selectedVenueDetails.address}, {selectedVenueDetails.city}</p>
              </div>
              <button
                onClick={() => setSelectedVenueDetails(null)}
                className="p-2 rounded-full hover:bg-ticket-ivory text-ticket-charcoal/60"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Instructions & Map */}
              <div className="p-4 bg-ticket-ivory rounded-2xl border border-ticket-beige/60 space-y-2 text-xs">
                <div className="font-bold text-ticket-charcoal">Entry Instructions:</div>
                <p className="text-ticket-charcoal/80">{selectedVenueDetails.entry_instructions || 'Please present digital e-ticket QR at the main entrance gate.'}</p>
                <div className="pt-2 flex items-center justify-between text-ticket-charcoal/60">
                  <span>Doors Open: <strong>{selectedVenueDetails.doors_open || '30 mins before showtime'}</strong></span>
                  {selectedVenueDetails.map_url && (
                    <a
                      href={selectedVenueDetails.map_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ticket-burgundy font-semibold inline-flex items-center gap-1 hover:underline"
                    >
                      Google Maps Link <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>

              {/* Associated Events */}
              <div>
                <h4 className="font-playfair text-lg font-bold text-ticket-charcoal mb-3 flex items-center gap-2">
                  <Calendar size={18} className="text-ticket-burgundy" /> Events Hosted at this Venue ({selectedVenueDetails.events?.length || 0})
                </h4>
                {selectedVenueDetails.events?.length === 0 ? (
                  <p className="text-xs text-ticket-charcoal/50 italic p-4 bg-ticket-ivory rounded-xl">No active shows scheduled at this venue currently.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedVenueDetails.events.map(e => (
                      <div key={e.id} className="p-3 bg-white border border-ticket-beige/60 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-ticket-charcoal text-sm">{e.event_name}</span>
                          <span className="text-ticket-charcoal/50 block">{e.event_date} • {e.category}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          e.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {e.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Associated Bookings */}
              <div>
                <h4 className="font-playfair text-lg font-bold text-ticket-charcoal mb-3 flex items-center gap-2">
                  <Receipt size={18} className="text-ticket-burgundy" /> Booking Transactions ({selectedVenueDetails.bookings?.length || 0})
                </h4>
                {selectedVenueDetails.bookings?.length === 0 ? (
                  <p className="text-xs text-ticket-charcoal/50 italic p-4 bg-ticket-ivory rounded-xl">No bookings recorded for this venue yet.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedVenueDetails.bookings.map(b => (
                      <div key={b.booking_number} className="p-3 bg-white border border-ticket-beige/60 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono font-bold text-ticket-burgundy">{b.booking_number}</span>
                          <span className="text-ticket-charcoal/60 ml-2">{b.customer_name}</span>
                        </div>
                        <div className="font-semibold text-ticket-charcoal">
                          AED {b.total_amount || 0}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT VENUE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-ticket-white rounded-3xl border border-ticket-beige/80 shadow-2xl p-6 sm:p-8 my-auto">
            <h3 className="font-playfair text-2xl font-bold text-ticket-charcoal mb-1">
              {editingVenue ? 'Edit Venue' : 'Create New Venue'}
            </h3>
            <p className="text-xs text-ticket-charcoal/60 mb-6">
              Venues are reusable across multiple Ticket Mahal event seasons.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveVenue} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-ticket-charcoal block mb-1">Venue Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dubai Opera"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-ticket-ivory border border-ticket-beige/80 rounded-xl text-sm focus:border-ticket-gold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-ticket-charcoal block mb-1">Area / Landmark</label>
                  <input
                    type="text"
                    placeholder="e.g. Downtown Dubai"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full px-4 py-2.5 bg-ticket-ivory border border-ticket-beige/80 rounded-xl text-sm focus:border-ticket-gold outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-ticket-charcoal block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dubai"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2.5 bg-ticket-ivory border border-ticket-beige/80 rounded-xl text-sm focus:border-ticket-gold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-ticket-charcoal block mb-1">Street Address</label>
                <input
                  type="text"
                  placeholder="e.g. Sheikh Mohammed bin Rashid Blvd"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 bg-ticket-ivory border border-ticket-beige/80 rounded-xl text-sm focus:border-ticket-gold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-ticket-charcoal block mb-1">Total Seating Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-ticket-ivory border border-ticket-beige/80 rounded-xl text-sm focus:border-ticket-gold outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-ticket-charcoal block mb-1">Default Doors Open</label>
                  <input
                    type="text"
                    placeholder="e.g. 60 mins before show"
                    value={formData.doors_open}
                    onChange={(e) => setFormData({ ...formData, doors_open: e.target.value })}
                    className="w-full px-4 py-2.5 bg-ticket-ivory border border-ticket-beige/80 rounded-xl text-sm focus:border-ticket-gold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-ticket-charcoal block mb-1">Google Maps URL</label>
                <input
                  type="url"
                  placeholder="https://maps.google.com/?q=..."
                  value={formData.map_url}
                  onChange={(e) => setFormData({ ...formData, map_url: e.target.value })}
                  className="w-full px-4 py-2.5 bg-ticket-ivory border border-ticket-beige/80 rounded-xl text-sm focus:border-ticket-gold outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ticket-charcoal block mb-1">Entry & Security Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Attire guidelines, parking details, usher gate entrance..."
                  value={formData.entry_instructions}
                  onChange={(e) => setFormData({ ...formData, entry_instructions: e.target.value })}
                  className="w-full px-4 py-2.5 bg-ticket-ivory border border-ticket-beige/80 rounded-xl text-sm focus:border-ticket-gold outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ticket-charcoal block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Overview of venue amenities and sound system..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-ticket-ivory border border-ticket-beige/80 rounded-xl text-sm focus:border-ticket-gold outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-ticket-beige/60">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-ticket-beige text-ticket-charcoal/70 hover:bg-ticket-ivory rounded-xl text-sm font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-ticket-charcoal hover:bg-ticket-charcoal/90 text-ticket-white rounded-xl text-sm font-semibold transition-all shadow-md"
                >
                  {saving ? 'Saving...' : (editingVenue ? 'Update Venue' : 'Create Venue')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVenues;
