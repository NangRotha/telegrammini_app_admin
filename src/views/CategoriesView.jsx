import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Tags,
  Plus,
  Trash2,
  Edit3,
  Search,
  RefreshCw,
  X,
  Check,
  Sparkles,
  AlertCircle,
  Package,
  Layers,
  FolderCheck,
  FolderOpen,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../services/api';
import { useRealtime } from '../hooks/useRealtime';

// Quick Preset Emojis for easy category icon selection
const PRESET_ICONS = [
  { icon: '📱', label: 'Tech' },
  { icon: '👕', label: 'Fashion' },
  { icon: '👟', label: 'Shoes' },
  { icon: '⌚', label: 'Watches' },
  { icon: '💄', label: 'Beauty' },
  { icon: '🍔', label: 'Food' },
  { icon: '🎮', label: 'Gaming' },
  { icon: '🏠', label: 'Home' },
  { icon: '⚡', label: 'Gadgets' },
  { icon: '📚', label: 'Books' },
  { icon: '🚲', label: 'Sports' },
  { icon: '🎁', label: 'Gifts' },
  { icon: '☕', label: 'Cafe' },
  { icon: '🎨', label: 'Art' },
  { icon: '🧸', label: 'Toys' },
  { icon: '📦', label: 'General' },
];

export function CategoriesView() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // null = Create, object = Edit
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: '📦',
  });
  const [slugCustomized, setSlugCustomized] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadCategories = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
      showToast(err.message || 'Failed to load categories', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Real-time synchronization
  useRealtime(
    useCallback(
      (event) => {
        if (event.type === 'CATEGORY_UPDATED' || event.type === 'PRODUCT_UPDATED') {
          loadCategories(true);
        }
      },
      [loadCategories]
    )
  );

  // Auto-generate slug from name
  const generateSlug = (val) => {
    return val
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleNameChange = (val) => {
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: slugCustomized ? prev.slug : generateSlug(val),
    }));
  };

  const handleSlugChange = (val) => {
    setSlugCustomized(true);
    setFormData((prev) => ({
      ...prev,
      slug: val
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-'),
    }));
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      icon: '📦',
    });
    setSlugCustomized(false);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon || '📦',
    });
    setSlugCustomized(true);
    setIsModalOpen(true);
  };

  // Submit Create or Edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      alert('Category name and slug are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim().toLowerCase(),
        icon: formData.icon.trim() || '📦',
      };

      if (editingCategory) {
        // Update
        const updated = await updateCategory(editingCategory.id, payload);
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? updated : c))
        );
        showToast(`Category "${updated.name}" updated successfully!`);
      } else {
        // Create
        const created = await createCategory(payload);
        setCategories((prev) => [...prev, created]);
        showToast(`Category "${created.name}" created successfully!`);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(`Error saving category: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Delete Category
  const handleDelete = async (cat) => {
    const productCount = cat.product_count || 0;
    const warningText =
      productCount > 0
        ? `Category "${cat.name}" contains ${productCount} product(s).\n\nDeleting this category will keep those products in your store as Uncategorized.\n\nAre you sure you want to delete it?`
        : `Are you sure you want to delete category "${cat.name}"?`;

    if (!window.confirm(warningText)) return;

    try {
      await deleteCategory(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      showToast(`Category "${cat.name}" deleted.`);
    } catch (err) {
      alert(`Failed to delete category: ${err.message}`);
    }
  };

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(
      (c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
    );
  }, [categories, search]);

  // Metric stats
  const stats = useMemo(() => {
    const total = categories.length;
    const totalProducts = categories.reduce(
      (acc, c) => acc + (c.product_count || 0),
      0
    );
    const activeCollections = categories.filter(
      (c) => (c.product_count || 0) > 0
    ).length;
    const emptyCollections = total - activeCollections;
    return { total, totalProducts, activeCollections, emptyCollections };
  }, [categories]);

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
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Tags className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Category Management
            </h1>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Create, edit, and organize product categories with custom slugs, icons, and real-time storefront sync.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadCategories()}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition-all disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Categories */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Categories</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {stats.total.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500">Active store collections</span>
        </div>

        {/* Total Linked Products */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Categorized Products</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            {stats.totalProducts.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500">Products assigned to categories</span>
        </div>

        {/* Active Collections */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Stocked Collections</span>
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
              <FolderCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-violet-400 mt-2">
            {stats.activeCollections.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500">Categories with products</span>
        </div>

        {/* Empty Collections */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Empty Categories</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <FolderOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">
            {stats.emptyCollections.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500">Ready for new products</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories by name or /slug..."
            className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Categories Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800/60">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
            Loading categories...
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800/60">
            <Tags className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-60" />
            No categories found matching "{search}".
          </div>
        ) : (
          filteredCategories.map((cat) => {
            const productCount = cat.product_count || 0;

            return (
              <div
                key={cat.id}
                className="group relative p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/50 flex flex-col justify-between shadow-xl transition-all hover:shadow-indigo-500/5 backdrop-blur-sm"
              >
                <div>
                  {/* Top Row: Icon & Action Buttons */}
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/90 border border-slate-700/60 flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform">
                      {cat.icon || '📦'}
                    </div>

                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-indigo-600 text-slate-400 hover:text-white border border-slate-700/60 transition-all"
                        title="Edit category"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-600 text-slate-400 hover:text-white border border-slate-700/60 transition-all"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Category Name & Slug */}
                  <div className="mt-4">
                    <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                      {cat.name}
                    </h3>
                    <div className="mt-0.5 inline-flex items-center gap-1 font-mono text-[11px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                      <span>/{cat.slug}</span>
                    </div>
                  </div>
                </div>

                {/* Footer: Product Count Badge */}
                <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Products</span>
                  <div
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold ${
                      productCount > 0
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-500 border border-slate-700/50'
                    }`}
                  >
                    <Package className="w-3 h-3" />
                    <span>
                      {productCount} {productCount === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ================= MODAL: Add / Edit Category ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 to-transparent">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  {editingCategory ? (
                    <Edit3 className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                  </h2>
                  <span className="text-[11px] text-slate-400">
                    {editingCategory
                      ? `Updating: ${editingCategory.name}`
                      : 'Create a product category'}
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

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Icon Selection & Live Preview */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Category Emoji Icon
                </label>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-indigo-500/50 flex items-center justify-center text-3xl shadow-inner shrink-0">
                    {formData.icon || '📦'}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) =>
                        setFormData({ ...formData, icon: e.target.value })
                      }
                      placeholder="e.g. 📱 or paste any emoji"
                      className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Pick a preset below or paste custom emoji
                    </span>
                  </div>
                </div>

                {/* Quick Emoji Preset Chips */}
                <div className="grid grid-cols-8 gap-1.5 p-2 bg-slate-800/40 rounded-xl border border-slate-800">
                  {PRESET_ICONS.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: item.icon })}
                      className={`h-8 rounded-lg flex items-center justify-center text-base hover:bg-slate-700 transition-colors ${
                        formData.icon === item.icon
                          ? 'bg-indigo-600/40 border border-indigo-500'
                          : 'bg-slate-800/60'
                      }`}
                      title={item.label}
                    >
                      {item.icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Name */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Category Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Smart Watches"
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    URL Slug <span className="text-rose-400">*</span>
                  </label>
                  {!slugCustomized && (
                    <span className="text-[10px] text-indigo-400 font-medium">
                      Auto-generated
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">
                    /
                  </span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="smart-watches"
                    className="w-full pl-6 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-indigo-300 font-mono focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Used for product filtering in customer Telegram Mini App.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
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
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
                >
                  {saving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {saving
                      ? 'Saving...'
                      : editingCategory
                      ? 'Save Changes'
                      : 'Create Category'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
