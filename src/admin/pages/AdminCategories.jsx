import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, CheckCircle2, XCircle, AlertCircle, ArrowUp, ArrowDown, Film, Music, Smile, Compass, Theater, Sun, Layers } from 'lucide-react';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: 'Layers',
    status: 'active'
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin-categories');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success && Array.isArray(json.categories)) {
          setCategories(json.categories);
        }
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: 'Layers',
      status: 'active'
    });
    setError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || '',
      icon: cat.icon || 'Layers',
      status: cat.status || 'active'
    });
    setError(null);
    setShowModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...(editingCategory ? { id: editingCategory.id } : {}),
        ...formData
      };

      const res = await fetch('/api/admin-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to save category');
      }

      setShowModal(false);
      fetchCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    const confirmed = window.confirm(
      cat.events_count > 0 
        ? `This category has ${cat.events_count} event(s) linked to it. To protect event links from being orphaned, it will be marked as inactive. Proceed?` 
        : `Are you sure you want to delete category "${cat.name}"?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch('/api/admin-categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cat.id })
      });
      const json = await res.json();
      if (json.success) {
        if (json.message) alert(json.message);
        fetchCategories();
      }
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  const handleMoveOrder = async (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= categories.length) return;

    const updated = [...categories];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);

    setCategories(updated);

    try {
      await fetch('/api/admin-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reorder', categories: updated })
      });
    } catch (err) {
      console.error('Error saving reorder:', err);
    }
  };

  const getIconComponent = (iconName) => {
    switch (iconName) {
      case 'Film': return <Film size={18} className="text-ticket-burgundy" />;
      case 'Music': return <Music size={18} className="text-ticket-burgundy" />;
      case 'Smile': return <Smile size={18} className="text-ticket-burgundy" />;
      case 'Theater': return <Theater size={18} className="text-ticket-burgundy" />;
      case 'Compass': return <Compass size={18} className="text-ticket-burgundy" />;
      case 'Sun': return <Sun size={18} className="text-ticket-burgundy" />;
      default: return <Layers size={18} className="text-ticket-burgundy" />;
    }
  };

  const filtered = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-playfair text-3xl font-semibold text-ticket-charcoal tracking-wide mb-1">Categories Management</h1>
          <p className="text-ticket-charcoal/60 text-sm">Manage customer-facing categories, ordering, icon branding, and associated event counts.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-ticket-charcoal text-ticket-white hover:bg-ticket-charcoal/90 text-sm font-medium rounded-full shadow-md hover:shadow-lg transition-all duration-300 self-start sm:self-auto"
        >
          <Plus size={16} />
          Create Category
        </button>
      </div>

      {/* Search panel */}
      <div className="flex justify-between items-center bg-ticket-white p-4 border border-ticket-beige/60 rounded-3xl shadow-sm">
        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ticket-charcoal/40" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-ticket-ivory border border-ticket-beige/60 rounded-full text-sm outline-none focus:border-ticket-gold focus:bg-white transition-all placeholder:text-ticket-charcoal/30 text-ticket-charcoal"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-ticket-gold/30 border-t-ticket-burgundy rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-ticket-white border border-ticket-beige/60 rounded-3xl shadow-sm">
          <p className="text-ticket-charcoal/60 text-sm">No categories found.</p>
        </div>
      ) : (
        <div className="bg-ticket-white border border-ticket-beige/60 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-ticket-beige/40 bg-ticket-ivory/30 text-ticket-charcoal/50 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Order</th>
                  <th className="px-6 py-4">Category Name</th>
                  <th className="px-6 py-4">URL Slug</th>
                  <th className="px-6 py-4">Linked Events</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige/25">
                {filtered.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-ivory/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          disabled={idx === 0}
                          onClick={() => handleMoveOrder(idx, -1)}
                          className="p-1 hover:bg-ticket-ivory rounded disabled:opacity-20 text-ticket-charcoal/60"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <span className="font-mono text-xs font-bold text-ticket-charcoal px-1">{idx + 1}</span>
                        <button
                          disabled={idx === categories.length - 1}
                          onClick={() => handleMoveOrder(idx, 1)}
                          className="p-1 hover:bg-ticket-ivory rounded disabled:opacity-20 text-ticket-charcoal/60"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-ticket-burgundy/10 border border-ticket-gold/20 flex items-center justify-center shrink-0">
                          {getIconComponent(cat.icon)}
                        </div>
                        <div>
                          <span className="font-playfair font-bold text-ticket-charcoal text-base">{cat.name}</span>
                          <p className="text-xs text-ticket-charcoal/50 line-clamp-1">{cat.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-ticket-burgundy font-semibold">
                      /category/{cat.slug}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-ticket-charcoal">
                      <span className="px-3 py-1 bg-ticket-ivory border border-ticket-beige rounded-full text-xs">
                        {cat.events_count || 0} Events
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold">
                      <span className={`px-2.5 py-1 rounded-full border ${
                        cat.status === 'active' 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-beige/20 text-ticket-charcoal/60 border-ticket-beige/40'
                      }`}>
                        {cat.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          title="Edit Category"
                          className="p-2 border border-ticket-beige hover:border-ticket-burgundy hover:text-ticket-burgundy text-ticket-charcoal/60 rounded-xl transition-all"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          title="Deactivate / Delete"
                          className="p-2 border border-ticket-beige hover:border-red-500 hover:text-red-500 text-ticket-charcoal/60 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-ticket-white rounded-3xl border border-ticket-beige/80 shadow-2xl p-6 sm:p-8 my-auto">
            <h3 className="font-playfair text-2xl font-bold text-ticket-charcoal mb-1">
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </h3>
            <p className="text-xs text-ticket-charcoal/60 mb-6">
              Changes will flow directly to customer-facing category navigation.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-ticket-charcoal block mb-1">Category Display Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Comedy Special"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    setFormData(prev => ({ ...prev, name, slug: editingCategory ? prev.slug : slug }));
                  }}
                  className="w-full px-4 py-2.5 bg-ticket-ivory border border-ticket-beige/80 rounded-xl text-sm focus:border-ticket-gold outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ticket-charcoal block mb-1">URL Slug</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. comedy-special"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2.5 font-mono bg-ticket-ivory border border-ticket-beige/80 rounded-xl text-sm focus:border-ticket-gold outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ticket-charcoal block mb-1">Icon Style</label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-4 py-2.5 bg-ticket-ivory border border-ticket-beige/80 rounded-xl text-sm focus:border-ticket-gold outline-none"
                >
                  <option value="Film">Film (Movies / Screenings)</option>
                  <option value="Music">Music (Live In Rhythm / Concerts)</option>
                  <option value="Smile">Smile (The Laugh Lounge / Comedy)</option>
                  <option value="Theater">Theater (Theatre & Stage Plays)</option>
                  <option value="Compass">Compass (Experiences & Attractions)</option>
                  <option value="Sun">Sun (Beyond The Walls / Outdoor)</option>
                  <option value="Layers">Layers (Default General)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-ticket-charcoal block mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief tagline for category browse page"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-ticket-ivory border border-ticket-beige/80 rounded-xl text-sm focus:border-ticket-gold outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ticket-charcoal block mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2.5 bg-ticket-ivory border border-ticket-beige/80 rounded-xl text-sm focus:border-ticket-gold outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
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
                  {saving ? 'Saving...' : (editingCategory ? 'Update Category' : 'Create Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
