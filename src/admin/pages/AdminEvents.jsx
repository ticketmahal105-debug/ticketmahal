import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Eye, EyeOff, Archive, Trash2, Search, Calendar, MapPin } from 'lucide-react';
import { getAdminEvents, updateEvent } from '../../services/eventsService';

const AdminEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await getAdminEvents();
    if (!error) {
      setEvents(data || []);
    }
    setLoading(false);
  };

  const handleToggleStatus = async (event) => {
    const newStatus = event.status === 'published' ? 'draft' : 'published';
    const { error } = await updateEvent(event.id, { status: newStatus });
    if (!error) {
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, status: newStatus } : e));
    }
  };

  const handleArchive = async (event) => {
    const { error } = await updateEvent(event.id, { status: 'archived' });
    if (!error) {
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, status: 'archived' } : e));
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.event_name.toLowerCase().includes(search.toLowerCase()) || 
                          (event.city && event.city.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = filterStatus === 'all' ? true : event.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'published': return 'bg-green-50 text-green-700 border-green-200';
      case 'draft': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'sold_out': return 'bg-red-50 text-red-700 border-red-200';
      case 'completed': return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'archived': return 'bg-gray-100 text-gray-500 border-gray-300';
      default: return 'bg-beige/20 text-charcoal/60 border-beige/40';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-playfair text-3xl font-semibold text-charcoal tracking-wide mb-1">Events Management</h1>
          <p className="text-charcoal/60 text-sm">Create, publish, edit, and monitor your event listings.</p>
        </div>
        <button
          onClick={() => navigate('/admin/events/new')}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-charcoal text-white hover:bg-charcoal/90 text-sm font-medium rounded-full shadow-md hover:shadow-lg transition-all duration-300 self-start sm:self-auto"
        >
          <Plus size={16} />
          Create Event
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 border border-beige/60 rounded-3xl shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/40" />
          <input
            type="text"
            placeholder="Search events by name, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-ivory border border-beige/60 rounded-full text-sm outline-none focus:border-champagne focus:bg-white transition-all placeholder:text-charcoal/30 text-charcoal"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto py-1">
          {['all', 'published', 'draft', 'sold_out', 'archived'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-full text-xs font-medium border capitalize whitespace-nowrap transition-all ${
                filterStatus === status
                  ? 'bg-champagne/10 text-champagne border-champagne/30'
                  : 'bg-white text-charcoal/60 border-beige/60 hover:bg-ivory'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Events Table / Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-champagne/30 border-t-champagne rounded-full animate-spin" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-20 bg-white border border-beige/60 rounded-3xl shadow-sm">
          <p className="text-charcoal/60 text-sm">No events found matching your criteria.</p>
        </div>
      ) : (
        <div className="bg-white border border-beige/60 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-beige/40 bg-ivory/30 text-charcoal/50 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Event Info</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Capacity / Sales</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige/25">
                {filteredEvents.map((event) => {
                  const totalCapacity = event.ticket_types?.reduce((acc, t) => acc + t.capacity, 0) || 0;
                  const totalSold = event.ticket_types?.reduce((acc, t) => acc + t.sold_quantity, 0) || 0;
                  
                  return (
                    <tr key={event.id} className="hover:bg-ivory/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-beige/20 rounded-xl overflow-hidden shrink-0 border border-beige/40">
                            {event.event_image ? (
                              <img src={event.event_image} alt={event.event_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-playfair font-bold text-champagne/60 text-lg">
                                {event.event_name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-charcoal font-playfair text-base line-clamp-1">{event.event_name}</h4>
                            <span className="text-xs text-champagne font-medium uppercase tracking-wider">{event.category}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-charcoal/80">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-champagne shrink-0" />
                          <span>{new Date(event.event_date).toLocaleDateString()}</span>
                        </div>
                        {event.start_time && (
                          <span className="text-xs text-charcoal/50 block ml-6 mt-0.5">{event.start_time} - {event.end_time || 'End'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-charcoal/80">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-champagne shrink-0" />
                          <span className="truncate max-w-[150px]">{event.venue_name || 'TBD'}</span>
                        </div>
                        {event.city && (
                          <span className="text-xs text-charcoal/50 block ml-6 mt-0.5">{event.city}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-charcoal/80">
                        <div>
                          <span className="font-semibold text-charcoal">{totalSold}</span> / {totalCapacity} Sold
                        </div>
                        <div className="w-24 bg-beige/35 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div 
                            className="bg-champagne h-full rounded-full" 
                            style={{ width: `${totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : 0}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold">
                        <span className={`px-2.5 py-1 rounded-full border ${getStatusStyle(event.status)}`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(event)}
                            title={event.status === 'published' ? 'Unpublish / Draft' : 'Publish'}
                            className="p-2 border border-beige hover:border-champagne hover:text-champagne text-charcoal/60 rounded-xl transition-all"
                          >
                            {event.status === 'published' ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            onClick={() => navigate(`/admin/events/${event.id}/edit`)}
                            title="Edit Event"
                            className="p-2 border border-beige hover:border-champagne hover:text-champagne text-charcoal/60 rounded-xl transition-all"
                          >
                            <Edit size={16} />
                          </button>
                          {event.status !== 'archived' && (
                            <button
                              onClick={() => handleArchive(event)}
                              title="Archive Event"
                              className="p-2 border border-beige hover:border-red-500 hover:text-red-500 text-charcoal/60 rounded-xl transition-all"
                            >
                              <Archive size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
