import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Plus, Trash2, Upload, AlertCircle } from 'lucide-react';
import { createEvent, updateEvent, getAdminEventById, deleteTicketType } from '../../services/eventsService';
import { supabase } from '../../lib/supabase';

const AdminEventForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState(null);

  // Form states
  const [eventData, setEventData] = useState({
    event_name: '',
    slug: '',
    category: 'Concerts',
    description: '',
    short_description: '',
    venue_name: '',
    city: '',
    event_date: '',
    start_time: '',
    end_time: '',
    event_image: '',
    status: 'draft',
    featured: false,
  });

  const [ticketTypes, setTicketTypes] = useState([
    { name: 'General Admission', price: 150, capacity: 100, sold_quantity: 0, status: 'active' }
  ]);

  const [deletedTicketIds, setDeletedTicketIds] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (isEdit) {
      fetchEventData();
    }
  }, [id]);

  const fetchEventData = async () => {
    setFetching(true);
    const { data, error } = await getAdminEventById(id);
    if (error) {
      setError("Failed to load event data.");
    } else if (data) {
      setEventData({
        event_name: data.event_name || '',
        slug: data.slug || '',
        category: data.category || 'Concerts',
        description: data.description || '',
        short_description: data.short_description || '',
        venue_name: data.venue_name || '',
        city: data.city || '',
        event_date: data.event_date || '',
        start_time: data.start_time || '',
        end_time: data.end_time || '',
        event_image: data.event_image || '',
        status: data.status || 'draft',
        featured: data.featured || false,
      });
      if (data.ticket_types && data.ticket_types.length > 0) {
        setTicketTypes(data.ticket_types);
      }
    }
    setFetching(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEventData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Auto-generate slug from name
  useEffect(() => {
    if (!isEdit && eventData.event_name) {
      const generatedSlug = eventData.event_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setEventData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [eventData.event_name, isEdit]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `event-images/${fileName}`;

      // Upload file to Supabase storage bucket named 'events' (create bucket if not exists via SQL or dashboard)
      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('events')
        .getPublicUrl(filePath);

      setEventData(prev => ({ ...prev, event_image: publicUrl }));
    } catch (err) {
      console.error('Error uploading image:', err.message);
      setError("Image upload failed. Ensure bucket 'events' exists in your storage.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Ticket handlers
  const handleAddTicket = () => {
    setTicketTypes(prev => [...prev, { name: '', price: 100, capacity: 50, sold_quantity: 0, status: 'active' }]);
  };

  const handleRemoveTicket = (index, ticketId) => {
    if (ticketId) {
      setDeletedTicketIds(prev => [...prev, ticketId]);
    }
    setTicketTypes(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleTicketChange = (index, field, value) => {
    setTicketTypes(prev => prev.map((t, idx) => idx === index ? { ...t, [field]: value } : t));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Process deletions of tickets if edit mode
      if (isEdit && deletedTicketIds.length > 0) {
        await Promise.all(deletedTicketIds.map(tId => deleteTicketType(tId)));
      }

      // 2. Save event & tickets
      let result;
      if (isEdit) {
        result = await updateEvent(id, eventData, ticketTypes);
      } else {
        result = await createEvent(eventData, ticketTypes);
      }

      if (result.error) throw result.error;

      navigate('/admin/events');
    } catch (err) {
      console.error('Error saving event:', err);
      setError(err.message || 'An error occurred while saving the event.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-ticket-gold/30 border-t-ticket-burgundy rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/events')}
          className="p-2 border border-ticket-beige hover:border-ticket-burgundy hover:text-ticket-burgundy text-ticket-charcoal/60 rounded-xl transition-all"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="font-playfair text-3xl font-semibold text-ticket-charcoal tracking-wide mb-1">
            {isEdit ? 'Edit Event' : 'Create Event'}
          </h1>
          <p className="text-ticket-charcoal/60 text-sm">Fill in details, ticket categories, and pricing information.</p>
        </div>
      </div>

      {error && (
        <div className="flex gap-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-sm items-start">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Event Info */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Section: Basic Information */}
          <div className="bg-ticket-white border border-ticket-beige/60 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <h3 className="font-playfair text-lg font-semibold text-ticket-charcoal mb-2 border-b border-ticket-beige/40 pb-2">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
                <label className="text-xs font-semibold text-ticket-charcoal/60 uppercase">Event Name</label>
                <input 
                  type="text" 
                  name="event_name"
                  value={eventData.event_name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Coldplay Live in Concert"
                  className="px-4 py-3 bg-ticket-ivory border border-ticket-beige/60 rounded-2xl text-sm outline-none focus:border-ticket-gold focus:bg-white transition-all text-ticket-charcoal"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ticket-charcoal/60 uppercase">Slug</label>
                <input 
                  type="text" 
                  name="slug"
                  value={eventData.slug}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. coldplay-live-concert"
                  className="px-4 py-3 bg-ticket-ivory border border-ticket-beige/60 rounded-2xl text-sm outline-none focus:border-ticket-gold focus:bg-white transition-all text-ticket-charcoal"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ticket-charcoal/60 uppercase">Category</label>
                <select
                  name="category"
                  value={eventData.category}
                  onChange={handleInputChange}
                  className="px-4 py-3 bg-ticket-ivory border border-ticket-beige/60 rounded-2xl text-sm outline-none focus:border-ticket-gold focus:bg-white transition-all text-ticket-charcoal"
                >
                  {['Concerts', 'Sports', 'Theatre', 'Culture', 'Dining', 'Entertainment', 'Family'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
                <label className="text-xs font-semibold text-ticket-charcoal/60 uppercase">Short Description</label>
                <input 
                  type="text" 
                  name="short_description"
                  value={eventData.short_description}
                  onChange={handleInputChange}
                  placeholder="A brief catchphrase or hook for lists"
                  className="px-4 py-3 bg-ticket-ivory border border-ticket-beige/60 rounded-2xl text-sm outline-none focus:border-ticket-gold focus:bg-white transition-all text-ticket-charcoal"
                />
              </div>

              <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
                <label className="text-xs font-semibold text-ticket-charcoal/60 uppercase">Full Description</label>
                <textarea 
                  name="description"
                  value={eventData.description}
                  onChange={handleInputChange}
                  rows={5}
                  placeholder="Full event details, program schedule, instructions..."
                  className="px-4 py-3 bg-ticket-ivory border border-ticket-beige/60 rounded-2xl text-sm outline-none focus:border-ticket-gold focus:bg-white transition-all text-ticket-charcoal resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Location, Date & Time */}
          <div className="bg-ticket-white border border-ticket-beige/60 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <h3 className="font-playfair text-lg font-semibold text-ticket-charcoal mb-2 border-b border-ticket-beige/40 pb-2">Location & Schedule</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ticket-charcoal/60 uppercase">Venue Name</label>
                <input 
                  type="text" 
                  name="venue_name"
                  value={eventData.venue_name}
                  onChange={handleInputChange}
                  placeholder="e.g. Coca-Cola Arena"
                  className="px-4 py-3 bg-ticket-ivory border border-ticket-beige/60 rounded-2xl text-sm outline-none focus:border-ticket-gold focus:bg-white transition-all text-ticket-charcoal"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ticket-charcoal/60 uppercase">City</label>
                <input 
                  type="text" 
                  name="city"
                  value={eventData.city}
                  onChange={handleInputChange}
                  placeholder="e.g. Dubai"
                  className="px-4 py-3 bg-ticket-ivory border border-ticket-beige/60 rounded-2xl text-sm outline-none focus:border-ticket-gold focus:bg-white transition-all text-ticket-charcoal"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ticket-charcoal/60 uppercase">Event Date</label>
                <input 
                  type="date" 
                  name="event_date"
                  value={eventData.event_date}
                  onChange={handleInputChange}
                  required
                  className="px-4 py-3 bg-ticket-ivory border border-ticket-beige/60 rounded-2xl text-sm outline-none focus:border-ticket-gold focus:bg-white transition-all text-ticket-charcoal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-ticket-charcoal/60 uppercase">Start Time</label>
                  <input 
                    type="time" 
                    name="start_time"
                    value={eventData.start_time}
                    onChange={handleInputChange}
                    className="px-4 py-3 bg-ticket-ivory border border-ticket-beige/60 rounded-2xl text-sm outline-none focus:border-ticket-gold focus:bg-white transition-all text-ticket-charcoal"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-ticket-charcoal/60 uppercase">End Time</label>
                  <input 
                    type="time" 
                    name="end_time"
                    value={eventData.end_time}
                    onChange={handleInputChange}
                    className="px-4 py-3 bg-ticket-ivory border border-ticket-beige/60 rounded-2xl text-sm outline-none focus:border-ticket-gold focus:bg-white transition-all text-ticket-charcoal"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Ticket Types */}
          <div className="bg-ticket-white border border-ticket-beige/60 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-ticket-beige/40 pb-2 mb-2">
              <h3 className="font-playfair text-lg font-semibold text-ticket-charcoal">Ticket Categories</h3>
              <button
                type="button"
                onClick={handleAddTicket}
                className="flex items-center gap-1.5 text-xs font-semibold text-ticket-burgundy hover:text-ticket-charcoal transition-colors uppercase tracking-wider"
              >
                <Plus size={14} /> Add Ticket Type
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {ticketTypes.map((ticket, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-ivory/40 border border-ticket-beige/40 rounded-2xl items-end relative">
                  <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2">
                    <label className="text-[10px] font-semibold text-ticket-charcoal/60 uppercase">Category Name</label>
                    <input 
                      type="text" 
                      value={ticket.name}
                      onChange={(e) => handleTicketChange(idx, 'name', e.target.value)}
                      required
                      placeholder="e.g. VIP, Premium, General"
                      className="px-4 py-2 bg-ticket-white border border-ticket-beige/60 rounded-xl text-sm outline-none focus:border-ticket-gold transition-all text-ticket-charcoal"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-ticket-charcoal/60 uppercase">Price (AED)</label>
                    <input 
                      type="number" 
                      value={ticket.price}
                      onChange={(e) => handleTicketChange(idx, 'price', Number(e.target.value))}
                      required
                      min={0}
                      className="px-4 py-2 bg-ticket-white border border-ticket-beige/60 rounded-xl text-sm outline-none focus:border-ticket-gold transition-all text-ticket-charcoal"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 relative">
                    <label className="text-[10px] font-semibold text-ticket-charcoal/60 uppercase">Capacity</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={ticket.capacity}
                        onChange={(e) => handleTicketChange(idx, 'capacity', Number(e.target.value))}
                        required
                        min={1}
                        className="px-4 py-2 bg-ticket-white border border-ticket-beige/60 rounded-xl text-sm outline-none focus:border-ticket-gold transition-all text-ticket-charcoal w-full"
                      />
                      {ticketTypes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTicket(idx, ticket.id)}
                          className="p-2 border border-ticket-beige hover:border-red-500 hover:text-red-500 text-ticket-charcoal/60 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right 1 Col: Status & Settings */}
        <div className="flex flex-col gap-6">
          
          {/* Section: Publishing Settings */}
          <div className="bg-ticket-white border border-ticket-beige/60 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <h3 className="font-playfair text-lg font-semibold text-ticket-charcoal mb-2 border-b border-ticket-beige/40 pb-2">Publishing</h3>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-ticket-charcoal/60 uppercase">Status</label>
              <select
                name="status"
                value={eventData.status}
                onChange={handleInputChange}
                className="px-4 py-3 bg-ticket-ivory border border-ticket-beige/60 rounded-2xl text-sm outline-none focus:border-ticket-gold focus:bg-white transition-all text-ticket-charcoal"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="sold_out">Sold Out</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex items-center gap-3 py-2">
              <input 
                type="checkbox" 
                id="featured"
                name="featured"
                checked={eventData.featured}
                onChange={handleInputChange}
                className="w-4 h-4 text-ticket-burgundy border-ticket-beige focus:ring-ticket-gold rounded"
              />
              <label htmlFor="featured" className="text-sm font-medium text-ticket-charcoal cursor-pointer">
                Feature Event on Homepage
              </label>
            </div>
          </div>

          {/* Section: Cover Image */}
          <div className="bg-ticket-white border border-ticket-beige/60 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <h3 className="font-playfair text-lg font-semibold text-ticket-charcoal mb-2 border-b border-ticket-beige/40 pb-2">Event Image</h3>
            
            <div className="flex flex-col gap-3">
              <div className="w-full h-44 bg-ivory/50 rounded-2xl overflow-hidden border border-ticket-beige border-dashed flex flex-col items-center justify-center relative group">
                {eventData.event_image ? (
                  <>
                    <img src={eventData.event_image} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                      <label className="px-4 py-2 bg-ticket-white text-ticket-charcoal rounded-full text-xs font-semibold cursor-pointer shadow-md">
                        Change Image
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    </div>
                  </>
                ) : (
                  <label className="flex flex-col items-center gap-2 cursor-pointer p-4 text-center">
                    <Upload size={24} className="text-ticket-burgundy" />
                    <span className="text-xs font-semibold text-ticket-charcoal/60 uppercase">Upload Banner Image</span>
                    <span className="text-[10px] text-ticket-charcoal/40 font-light">Max size 5MB</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
                {uploadingImage && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-ticket-gold/30 border-t-ticket-burgundy rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-[10px] font-semibold text-ticket-charcoal/60 uppercase">Image URL (Optional Alternative)</label>
                <input 
                  type="text" 
                  name="event_image"
                  value={eventData.event_image}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                  className="px-4 py-2 bg-ticket-ivory border border-ticket-beige/60 rounded-xl text-xs outline-none focus:border-ticket-gold focus:bg-white transition-all text-ticket-charcoal"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="w-full py-4 bg-ticket-charcoal text-ticket-white rounded-full font-semibold hover:bg-ticket-charcoal/90 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={18} />
                Save Event
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default AdminEventForm;
