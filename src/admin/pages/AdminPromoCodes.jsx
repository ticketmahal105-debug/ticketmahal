import { useState, useEffect } from 'react';
import { Plus, Search, Tag, Edit, Trash2, CheckCircle2, XCircle, AlertCircle, Calendar, DollarSign, Percent } from 'lucide-react';

const AdminPromoCodes = () => {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_amount: 100,
    max_discount: 60,
    usage_limit: 100,
    per_customer_limit: 1,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '2026-12-31',
    status: 'active'
  });

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin-promo-codes');
      const json = await res.json();
      if (json.success && Array.isArray(json.promoCodes)) {
        setPromos(json.promoCodes);
      }
    } catch (err) {
      console.error('Error fetching promo codes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingPromo(null);
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_amount: 100,
      max_discount: 60,
      usage_limit: 100,
      per_customer_limit: 1,
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: '2026-12-31',
      status: 'active'
    });
    setError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (promo) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code || '',
      description: promo.description || '',
      discount_type: promo.discount_type || 'percentage',
      discount_value: promo.discount_value || 0,
      min_order_amount: promo.min_order_amount || 0,
      max_discount: promo.max_discount || '',
      usage_limit: promo.usage_limit || '',
      per_customer_limit: promo.per_customer_limit || 1,
      valid_from: promo.valid_from || '',
      valid_until: promo.valid_until || '',
      status: promo.status || 'active'
    });
    setError(null);
    setShowModal(true);
  };

  const handleToggleStatus = async (promo) => {
    try {
      const res = await fetch('/api/admin-promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_status', id: promo.id })
      });
      const json = await res.json();
      if (json.success) {
        setPromos(prev => prev.map(p => p.id === promo.id ? json.promo : p));
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleSavePromo = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...(editingPromo ? { id: editingPromo.id } : {}),
        ...formData
      };

      const res = await fetch('/api/admin-promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to save promo code');
      }

      setShowModal(false);
      fetchPromoCodes();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredPromos = promos.filter(p => {
    const query = search.toLowerCase();
    const matchesSearch = (p.code || '').toLowerCase().includes(query) || 
                          (p.description || '').toLowerCase().includes(query);
    const matchesStatus = filterStatus === 'all' ? true : p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-playfair text-3xl font-semibold text-ticket-charcoal tracking-wide mb-1">Promo Codes Management</h1>
          <p className="text-ticket-charcoal/60 text-sm">Create, activate, and track server-validated discounts and promotional campaigns.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-ticket-charcoal text-ticket-white hover:bg-ticket-charcoal/90 text-sm font-medium rounded-full shadow-md hover:shadow-lg transition-all duration-300 self-start sm:self-auto"
        >
          <Plus size={16} />
          Create Promo Code
        </button>
      </div>

      {/* Filter panel */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-ticket-white p-4 border border-ticket-beige/60 rounded-3xl shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ticket-charcoal/40" />
          <input
            type="text"
            placeholder="Search code or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-ticket-ivory border border-ticket-beige/60 rounded-full text-sm outline-none focus:border-ticket-gold focus:bg-white transition-all placeholder:text-ticket-charcoal/30 text-ticket-charcoal"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto py-1">
          {['all', 'active', 'inactive'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-full text-xs font-medium border capitalize whitespace-nowrap transition-all ${
                filterStatus === status
                  ? 'bg-ticket-burgundy/10 text-ticket-burgundy border-ticket-gold/30'
                  : 'bg-ticket-white text-ticket-charcoal/60 border-ticket-beige/60 hover:bg-ivory'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-ticket-gold/30 border-t-ticket-burgundy rounded-full animate-spin" />
        </div>
      ) : filteredPromos.length === 0 ? (
        <div className="text-center py-20 bg-ticket-white border border-ticket-beige/60 rounded-3xl shadow-sm">
          <p className="text-ticket-charcoal/60 text-sm">No promo codes found matching your criteria.</p>
        </div>
      ) : (
        <div className="bg-ticket-white border border-ticket-beige/60 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-ticket-beige/40 bg-ticket-ivory/30 text-ticket-charcoal/50 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Promo Code</th>
                  <th className="px-6 py-4">Discount</th>
                  <th className="px-6 py-4">Validity Period</th>
                  <th className="px-6 py-4">Uses / Limit</th>
                  <th className="px-6 py-4">Revenue Affected</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige/25">
                {filteredPromos.map((promo) => (
                  <tr key={promo.id} className="hover:bg-ivory/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Tag size={16} className="text-ticket-burgundy shrink-0" />
                        <div>
                          <span className="font-mono font-bold text-ticket-charcoal text-sm">{promo.code}</span>
                          <p className="text-xs text-ticket-charcoal/60 line-clamp-1">{promo.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-ticket-burgundy">
                        {promo.discount_type === 'percentage' ? `${promo.discount_value}% OFF` : `AED ${promo.discount_value} FLAT`}
                      </span>
                      <span className="text-xs text-ticket-charcoal/50 block">
                        Min: AED {promo.min_order_amount || 0} {promo.max_discount ? `• Max: AED ${promo.max_discount}` : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-ticket-charcoal/70">
                      <div>From: {promo.valid_from || 'Always'}</div>
                      <div>Until: {promo.valid_until || 'No Expiry'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-ticket-charcoal">
                      <div className="font-semibold">{promo.uses_count || 0} Uses</div>
                      <span className="text-xs text-ticket-charcoal/50">
                        {promo.remaining_uses !== undefined ? `${promo.remaining_uses} remaining` : 'Unlimited'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-ticket-charcoal">
                      AED {Number(promo.revenue_affected || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold">
                      <span className={`px-2.5 py-1 rounded-full border ${
                        promo.status === 'active' 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-beige/20 text-ticket-charcoal/60 border-ticket-beige/40'
                      }`}>
                        {promo.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(promo)}
                          title={promo.status === 'active' ? 'Deactivate' : 'Activate'}
                          className={`p-2 border rounded-xl transition-all ${
                            promo.status === 'active' 
                              ? 'border-ticket-beige hover:border-amber-500 text-ticket-charcoal/60 hover:text-amber-600' 
                              : 'border-ticket-beige hover:border-green-500 text-ticket-charcoal/60 hover:text-green-600'
                          }`}
                        >
                          {promo.status === 'active' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(promo)}
                          title="Edit Promo Code"
                          className="p-2 border border-ticket-beige hover:border-ticket-burgundy hover:text-ticket-burgundy text-ticket-charcoal/60 rounded-xl transition-all"
                        >
                          <Edit size={16} />
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
          <div className="relative w-full max-w-xl bg-ticket-white rounded-3xl border border-ticket-beige/80 shadow-2xl p-6 sm:p-8 my-auto">
            <h3 className="font-playfair text-2xl font-bold text-ticket-charcoal mb-1">
              {editingPromo ? 'Edit Promo Code' : 'Create New Promo Code'}
            </h3>
            <p className="text-xs text-ticket-charcoal/60 mb-6">
              Configured discounts are validated on the server at checkout.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSavePromo} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-ticket-charcoal block mb-1">Promo Code (Uppercase) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP2026"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 font-mono uppercase bg-ticket-ivory border border-ticket-beige/80 rounded-xl text-sm focus:border-ticket-gold outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ticket-charcoal block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. 10% Welcome discount on all premier event tickets"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-ticket-ivory border border-ticket-beige/80 rounded-xl text-sm focus:border-ticket-gold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-ticket-charcoal block mb-1">Discount Type</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                    className="w-full px-4 py-2.5 bg-ticket-ivory border border-ticket-beige/80 rounded-xl text-sm focus:border-ticket-gold outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed AED</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-ticket-charcoal block mb-1">Discount Value *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-ticket-ivory border border-ticket-beige/80 rounded-xl text-sm focus:border-ticket-gold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-ticket-charcoal block mb-1">Min Order Amount (AED)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.min_order_amount}
                    onChange={(e) => setFormData({ ...formData, min_order_amount: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-ticket-ivory border border-ticket-beige/80 rounded-xl text-sm focus:border-ticket-gold outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-ticket-charcoal block mb-1">Max Discount Cap (AED)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Optional limit"
                    value={formData.max_discount}
                    onChange={(e) => setFormData({ ...formData, max_discount: e.target.value ? Number(e.target.value) : '' })}
                    className="w-full px-4 py-2.5 bg-ticket-ivory border border-ticket-beige/80 rounded-xl text-sm focus:border-ticket-gold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-ticket-charcoal block mb-1">Total Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value ? Number(e.target.value) : '' })}
                    className="w-full px-4 py-2.5 bg-ticket-ivory border border-ticket-beige/80 rounded-xl text-sm focus:border-ticket-gold outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-ticket-charcoal block mb-1">Per-Customer Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.per_customer_limit}
                    onChange={(e) => setFormData({ ...formData, per_customer_limit: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-ticket-ivory border border-ticket-beige/80 rounded-xl text-sm focus:border-ticket-gold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-ticket-charcoal block mb-1">Valid From</label>
                  <input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    className="w-full px-4 py-2.5 bg-ticket-ivory border border-ticket-beige/80 rounded-xl text-sm focus:border-ticket-gold outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-ticket-charcoal block mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    className="w-full px-4 py-2.5 bg-ticket-ivory border border-ticket-beige/80 rounded-xl text-sm focus:border-ticket-gold outline-none"
                  />
                </div>
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
                  {saving ? 'Saving...' : (editingPromo ? 'Update Promo' : 'Create Promo')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPromoCodes;
