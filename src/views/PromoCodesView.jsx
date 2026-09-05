import React, { useState, useEffect, useCallback } from 'react';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Check,
  Copy,
  Sparkles,
  Percent,
  DollarSign,
  Search,
  RefreshCw,
  X,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Calculator,
} from 'lucide-react';
import {
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
} from '../services/api';
import { useRealtime } from '../hooks/useRealtime';

export function PromoCodesView() {
  const [promocodes, setPromocodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteConfirmPromo, setDeleteConfirmPromo] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Quick Calculator State
  const [testCode, setTestCode] = useState('');
  const [testSubtotal, setTestSubtotal] = useState('50');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_spend: '0',
    max_discount: '',
    description: '',
    is_active: true,
  });

  const loadPromoCodes = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getPromoCodes(false);
      setPromocodes(data);
    } catch (err) {
      console.error('Error loading promo codes:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPromoCodes();
  }, [loadPromoCodes]);

  // Real-time synchronization for promo codes
  useRealtime(
    useCallback(
      (event) => {
        if (event.type === 'PROMO_UPDATED') {
          loadPromoCodes(true);
        }
      },
      [loadPromoCodes]
    )
  );

  const handleOpenCreate = () => {
    setEditingPromo(null);
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: '10',
      min_spend: '0',
      max_discount: '',
      description: '',
      is_active: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (promo) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value.toString(),
      min_spend: promo.min_spend.toString(),
      max_discount: promo.max_discount ? promo.max_discount.toString() : '',
      description: promo.description || '',
      is_active: promo.is_active,
    });
    setModalOpen(true);
  };

  const handleToggleActive = async (promo) => {
    try {
      const updated = await updatePromoCode(promo.id, {
        is_active: !promo.is_active,
      });
      setPromocodes((prev) =>
        prev.map((p) => (p.id === promo.id ? updated : p))
      );
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const confirmDeletePromo = async (promo) => {
    if (!promo) return;
    setDeleting(true);
    try {
      await deletePromoCode(promo.id);
      setPromocodes((prev) => prev.filter((p) => p.id !== promo.id));
      showToast(`Promo code "${promo.code}" deleted successfully!`);
      setDeleteConfirmPromo(null);
      if (modalOpen && editingPromo?.id === promo.id) {
        setModalOpen(false);
      }
    } catch (err) {
      alert(`Failed to delete promo code: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      alert('Please enter a promo code');
      return;
    }
    const val = parseFloat(formData.discount_value);
    if (isNaN(val) || val <= 0) {
      alert('Discount value must be greater than 0');
      return;
    }

    setSaving(true);
    const payload = {
      code: formData.code.trim().toUpperCase(),
      discount_type: formData.discount_type,
      discount_value: val,
      min_spend: parseFloat(formData.min_spend) || 0,
      max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
      description: formData.description.trim(),
      is_active: formData.is_active,
    };

    try {
      if (editingPromo) {
        const updated = await updatePromoCode(editingPromo.id, payload);
        setPromocodes((prev) =>
          prev.map((p) => (p.id === editingPromo.id ? updated : p))
        );
      } else {
        const created = await createPromoCode(payload);
        setPromocodes((prev) => [created, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      alert(`Error saving promo code: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleTestCode = async (e) => {
    e.preventDefault();
    if (!testCode.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/promocodes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: testCode.trim().toUpperCase(),
          subtotal: parseFloat(testSubtotal) || 0,
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({ valid: false, message: 'Network error checking code' });
    } finally {
      setTesting(false);
    }
  };

  const filtered = promocodes.filter(
    (p) =>
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white">Promo Codes & Discounts</h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-3 h-3" />
              Store Marketing
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Create coupon codes, percentage discounts, and order thresholds
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadPromoCodes()}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Promo Code</span>
          </button>
        </div>
      </div>

      {/* Interactive Coupon Validator Tester */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Live Coupon Tester</div>
            <div className="text-[11px] text-slate-400">
              Test how discount codes apply to cart subtotals
            </div>
          </div>
        </div>

        <form onSubmit={handleTestCode} className="flex items-center flex-wrap gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Code (e.g. WELCOME10)"
            value={testCode}
            onChange={(e) => setTestCode(e.target.value.toUpperCase())}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white uppercase font-mono font-bold w-36 placeholder:normal-case placeholder:font-sans placeholder:text-slate-500"
          />
          <div className="relative">
            <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">$</span>
            <input
              type="number"
              step="0.01"
              placeholder="50.00"
              value={testSubtotal}
              onChange={(e) => setTestSubtotal(e.target.value)}
              className="pl-6 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono w-24"
            />
          </div>
          <button
            type="submit"
            disabled={testing}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            {testing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span>Test</span>}
          </button>
        </form>

        {testResult && (
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
              testResult.valid
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {testResult.valid ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  Valid: Saved <b>${testResult.discount_amount.toFixed(2)}</b> (Total: ${testResult.final_total.toFixed(2)})
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>{testResult.message}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search promo codes or descriptions..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Promo Codes Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
          Loading promotional codes...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
          No promo codes found. Click "Create Promo Code" to add one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((promo) => {
            const isPct = promo.discount_type === 'percentage';
            return (
              <div
                key={promo.id}
                className={`p-5 rounded-2xl bg-slate-900 border transition-all relative overflow-hidden flex flex-col justify-between ${
                  promo.is_active
                    ? 'border-slate-800 hover:border-slate-700 shadow-lg'
                    : 'border-slate-800/50 opacity-60'
                }`}
              >
                {/* Top Badge & Status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      onClick={() => handleCopyCode(promo.code)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono font-black text-sm tracking-wider flex items-center gap-1.5 cursor-pointer hover:bg-indigo-500/25 transition-colors shadow-sm"
                      title="Click to copy code"
                    >
                      <span>{promo.code}</span>
                      {copiedCode === promo.code ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-indigo-400/80" />
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleActive(promo)}
                      className={`p-1 rounded-lg transition-colors ${
                        promo.is_active
                          ? 'text-emerald-400 hover:text-emerald-300'
                          : 'text-slate-500 hover:text-slate-400'
                      }`}
                      title={promo.is_active ? 'Click to deactivate' : 'Click to activate'}
                    >
                      {promo.is_active ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-500 border border-slate-700">
                          Inactive
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Discount Value Display */}
                <div className="space-y-1 mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white">
                      {isPct ? `${promo.discount_value}%` : `$${promo.discount_value.toFixed(2)}`}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Discount
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {promo.description || 'General promotional discount'}
                  </p>
                </div>

                {/* Conditions Pill Strip */}
                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800/80 text-[11px] space-y-1.5 mb-4">
                  <div className="flex justify-between text-slate-400">
                    <span>Min Spend:</span>
                    <span className="font-semibold text-slate-200">
                      {promo.min_spend > 0 ? `$${promo.min_spend.toFixed(2)}` : 'No minimum'}
                    </span>
                  </div>
                  {isPct && promo.max_discount && (
                    <div className="flex justify-between text-slate-400">
                      <span>Max Cap:</span>
                      <span className="font-semibold text-amber-400">
                        ${promo.max_discount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400">
                    <span>Type:</span>
                    <span className="font-semibold text-slate-300 capitalize">
                      {promo.discount_type}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
                  <button
                    onClick={() => handleOpenEdit(promo)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1 border border-slate-700/60 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteConfirmPromo(promo)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-medium flex items-center gap-1 border border-rose-500/20 transition-colors"
                    title="Delete promo code"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Promo Code Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-400" />
                <h2 className="text-base font-bold text-white">
                  {editingPromo ? 'Edit Promo Code' : 'Create New Promo Code'}
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Code */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g. SUMMER25"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono font-bold tracking-wider uppercase focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Discount Type
                  </label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) =>
                      setFormData({ ...formData, discount_type: e.target.value })
                    }
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {formData.discount_type === 'percentage'
                      ? 'Discount Rate (%) *'
                      : 'Discount Amount ($) *'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({ ...formData, discount_value: e.target.value })
                    }
                    placeholder={formData.discount_type === 'percentage' ? '15' : '5.00'}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Minimum Spend & Max Discount Cap */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Minimum Spend ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.min_spend}
                    onChange={(e) =>
                      setFormData({ ...formData, min_spend: e.target.value })
                    }
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Max Discount Cap ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.max_discount}
                    onChange={(e) =>
                      setFormData({ ...formData, max_discount: e.target.value })
                    }
                    placeholder="Optional (e.g. 50)"
                    disabled={formData.discount_type !== 'percentage'}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Description / Customer Note
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="e.g. 15% off for first-time orders"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="promoActive"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="promoActive" className="text-xs text-slate-300 cursor-pointer">
                  Activate this promo code immediately
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                {editingPromo ? (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmPromo(editingPromo)}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 border border-rose-500/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Code</span>
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                  >
                    {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{saving ? 'Saving...' : editingPromo ? 'Update Code' : 'Save Promo Code'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmPromo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete Promo Code</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Are you sure you want to permanently delete code{' '}
                  <span className="font-mono text-amber-400 font-bold">
                    {deleteConfirmPromo.code}
                  </span>?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteConfirmPromo(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => confirmDeletePromo(deleteConfirmPromo)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all"
              >
                {deleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{deleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <Check className="w-4 h-4" />
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
