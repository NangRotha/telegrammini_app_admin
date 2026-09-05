import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bell,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  X,
  Check,
  Sparkles,
  AlertCircle,
  Eye,
  ToggleLeft,
  ToggleRight,
  Upload,
  ExternalLink,
  Image as ImageIcon,
  Megaphone,
  Info,
  AlertTriangle,
} from 'lucide-react';
import {
  getAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  uploadMedia,
} from '../services/api';
import { useRealtime } from '../hooks/useRealtime';

const POPUP_TYPES = [
  { id: 'promo', label: 'Promotion / Sale', icon: Sparkles, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { id: 'announcement', label: 'Store Announcement', icon: Megaphone, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  { id: 'info', label: 'Informational Notice', icon: Info, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  { id: 'warning', label: 'Important Alert', icon: AlertTriangle, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
];

export function AlertsView() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [previewAlert, setPreviewAlert] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    image_url: '',
    button_text: 'Got It',
    button_link: '',
    popup_type: 'promo',
    is_active: true,
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAlerts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getAlerts(false);
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
      showToast(err.message || 'Failed to load alert popups', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Real-time synchronization
  useRealtime(
    useCallback(
      (event) => {
        if (event.type === 'ALERT_UPDATED') {
          loadAlerts(true);
        }
      },
      [loadAlerts]
    )
  );

  // Stats
  const stats = useMemo(() => {
    const total = alerts.length;
    const activeAlert = alerts.find((a) => a.is_active);
    const activeCount = alerts.filter((a) => a.is_active).length;
    const promoCount = alerts.filter((a) => a.popup_type === 'promo').length;
    return { total, activeAlert, activeCount, promoCount };
  }, [alerts]);

  // Open Create
  const handleOpenCreate = () => {
    setEditingAlert(null);
    setFormData({
      title: '',
      message: '',
      image_url: '',
      button_text: 'Shop Now',
      button_link: '',
      popup_type: 'promo',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  // Open Edit
  const handleOpenEdit = (item) => {
    setEditingAlert(item);
    setFormData({
      title: item.title,
      message: item.message || '',
      image_url: item.image_url || '',
      button_text: item.button_text || 'Got It',
      button_link: item.button_link || '',
      popup_type: item.popup_type || 'promo',
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  // Image Upload
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await uploadMedia(file);
      setFormData((prev) => ({ ...prev, image_url: res.url }));
      showToast('Banner image uploaded!');
    } catch (err) {
      alert(`Image upload failed: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  // Toggle is_active
  const handleToggleActive = async (item) => {
    try {
      const updated = await updateAlert(item.id, {
        is_active: !item.is_active,
      });
      setAlerts((prev) =>
        prev.map((a) => (a.id === item.id ? updated : a))
      );
      showToast(
        updated.is_active
          ? `Popup "${updated.title}" is now ACTIVE for shoppers!`
          : `Popup "${updated.title}" deactivated.`
      );
    } catch (err) {
      alert(`Failed to toggle status: ${err.message}`);
    }
  };

  // Submit Save
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Alert popup title is required');
      return;
    }

    setSaving(true);
    try {
      if (editingAlert) {
        const updated = await updateAlert(editingAlert.id, formData);
        setAlerts((prev) =>
          prev.map((a) => (a.id === editingAlert.id ? updated : a))
        );
        showToast(`Alert popup "${updated.title}" updated!`);
      } else {
        const created = await createAlert(formData);
        setAlerts((prev) => [created, ...prev]);
        showToast(`Alert popup "${created.title}" created!`);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(`Failed to save alert popup: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete alert popup "${item.title}"?`)) {
      return;
    }

    try {
      await deleteAlert(item.id);
      setAlerts((prev) => prev.filter((a) => a.id !== item.id));
      showToast(`Alert popup deleted.`);
    } catch (err) {
      alert(`Failed to delete alert popup: ${err.message}`);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium border animate-in fade-in slide-in-from-bottom-5 ${
            toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-800'
              : 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Alert Popups & Announcements
            </h1>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Display promotional banners, discounts, and announcements to shoppers when they launch the Mini App.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadAlerts()}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition-all disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Alert Popup</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Popup Status */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Live Customer Popup</span>
            <div
              className={`w-3 h-3 rounded-full ${
                stats.activeCount > 0 ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
              }`}
            />
          </div>
          <div className="text-lg font-bold text-white mt-2 truncate">
            {stats.activeAlert ? stats.activeAlert.title : 'None Active'}
          </div>
          <span className="text-[11px] text-slate-500">
            {stats.activeCount > 0
              ? `${stats.activeCount} popup(s) active on storefront`
              : 'No popup currently displayed'}
          </span>
        </div>

        {/* Total Announcements */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Created</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Megaphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {stats.total.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500">Campaigns & alerts in database</span>
        </div>

        {/* Promo Campaigns */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Sales & Promos</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">
            {stats.promoCount.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500">Promotional discount popups</span>
        </div>

        {/* Quick Rule Info */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-amber-500/10 border border-indigo-500/20 relative overflow-hidden">
          <span className="text-xs font-semibold text-indigo-300">How It Works</span>
          <p className="text-[11px] text-slate-300 mt-1 leading-snug">
            When a popup is active, shoppers see it upon launching the Mini App. It dismisses cleanly and saves session state.
          </p>
        </div>
      </div>

      {/* Alert Popups List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800/60">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
            Loading alert popups...
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800/60">
            <Bell className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-60" />
            No alert popups created yet. Click "Create Alert Popup" to announce a promotion or update to your customers!
          </div>
        ) : (
          alerts.map((item) => {
            const typeConfig =
              POPUP_TYPES.find((t) => t.id === item.popup_type) || POPUP_TYPES[0];
            const TypeIcon = typeConfig.icon;

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl bg-slate-900/80 border transition-all backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                  item.is_active
                    ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                    : 'border-slate-800/80 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Left: Banner preview & content */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Thumbnail / Icon */}
                  <div className="w-20 h-20 rounded-xl bg-slate-800 border border-slate-700/60 overflow-hidden shrink-0 flex items-center justify-center">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2">
                        <TypeIcon className="w-6 h-6 mx-auto text-amber-400 mb-1" />
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">
                          {item.popup_type}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Text Details */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${typeConfig.color}`}
                      >
                        <TypeIcon className="w-3 h-3" />
                        <span>{typeConfig.label}</span>
                      </span>

                      {item.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>ACTIVE ON STOREFRONT</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-500 border border-slate-700/50">
                          Draft / Inactive
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-base text-white truncate">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {item.message || 'No description text provided.'}
                    </p>

                    {item.button_text && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1 font-mono">
                        <span className="text-indigo-400 font-semibold">Button:</span>
                        <span>"{item.button_text}"</span>
                        {item.button_link && (
                          <span className="text-slate-500 truncate max-w-[200px]">
                            → {item.button_link}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {/* Toggle Active */}
                  <button
                    onClick={() => handleToggleActive(item)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      item.is_active
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                    title="Toggle active status"
                  >
                    {item.is_active ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-400" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-slate-500" />
                        <span>Disabled</span>
                      </>
                    )}
                  </button>

                  {/* Preview Modal */}
                  <button
                    onClick={() => setPreviewAlert(item)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                    title="Preview popup in modal"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                    title="Edit popup"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white border border-slate-700/60 transition-colors"
                    title="Delete popup"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ================= MODAL: Add / Edit Alert Popup ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-transparent shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    {editingAlert ? 'Edit Alert Popup' : 'Create Alert Popup'}
                  </h2>
                  <span className="text-[11px] text-slate-400">
                    Configure announcement for Telegram Mini App
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Type selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Popup Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {POPUP_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, popup_type: t.id })}
                      className={`p-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                        formData.popup_type === t.id
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <t.icon className="w-4 h-4" />
                      <span className="text-[11px]">{t.label.split('/')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Popup Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. 🎉 Grand Summer Sale — 20% OFF Everything!"
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Message / Announcement Body */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Announcement Message
                </label>
                <textarea
                  rows="3"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="e.g. Use promo code SUMMER20 during checkout to get an instant 20% discount on all orders. Free shipping on orders over $50!"
                  className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Banner Image Upload & URL */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Banner Image (Optional)
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://... or upload image"
                      className="flex-1 px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-colors shrink-0">
                      {uploadingImage ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageFileChange}
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>

                  {formData.image_url && (
                    <div className="relative w-full h-32 rounded-xl bg-slate-800 overflow-hidden border border-slate-700">
                      <img
                        src={formData.image_url}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image_url: '' })}
                        className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Button Text & Button Link */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Action Button Text
                  </label>
                  <input
                    type="text"
                    value={formData.button_text}
                    onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                    placeholder="e.g. Shop Now"
                    className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Action Link (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.button_link}
                    onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                    placeholder="e.g. https://... or leave blank"
                    className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer hover:bg-slate-800 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-0"
                />
                <div className="flex-1 text-xs">
                  <div className="font-semibold text-white">
                    Show to customers immediately
                  </div>
                  <span className="text-[10px] text-slate-400">
                    If enabled, customers opening the Telegram Mini App will receive this popup.
                  </span>
                </div>
              </label>

              {/* Submit Buttons */}
              <div className="pt-2 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
                >
                  {saving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{saving ? 'Saving...' : editingAlert ? 'Save Changes' : 'Create Popup'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: Mobile Phone Customer Preview ================= */}
      {previewAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 text-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header banner */}
            <div className="relative">
              {previewAlert.image_url ? (
                <div className="w-full h-44 bg-slate-800 overflow-hidden">
                  <img
                    src={previewAlert.image_url}
                    alt={previewAlert.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-28 bg-gradient-to-br from-amber-500/20 to-indigo-500/20 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-amber-400" />
                </div>
              )}
              <button
                onClick={() => setPreviewAlert(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 text-center space-y-3">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                Customer Preview
              </span>
              <h3 className="text-lg font-black text-white leading-snug">
                {previewAlert.title}
              </h3>
              <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                {previewAlert.message || 'No additional details provided.'}
              </p>

              {/* Action button */}
              <div className="pt-2">
                <button
                  onClick={() => setPreviewAlert(null)}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 font-bold text-slate-950 text-xs shadow-lg shadow-amber-500/20 active:scale-98 transition-all"
                >
                  {previewAlert.button_text || 'Got It'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
