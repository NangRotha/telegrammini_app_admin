import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Star,
  RefreshCw,
  Image as ImageIcon,
  Layers,
  Upload,
  Video,
  Film,
  Loader2,
} from 'lucide-react';
import {
  getProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadMedia,
} from '../services/api';
import { useRealtime } from '../hooks/useRealtime';

export function ProductsView() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
    sub_images: [],
    video_url: '',
    stock: 50,
    is_active: true,
    is_featured: false,
  });
  const [saving, setSaving] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingSubs, setUploadingSubs] = useState(false);

  const mainImageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const subImagesInputRef = useRef(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        getProducts({ search, categoryId: selectedCategory || null }),
        getCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [search, selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time synchronization
  useRealtime(
    useCallback(
      (event) => {
        if (event.type === 'PRODUCT_UPDATED') {
          if (event.data?.action === 'delete' && event.data?.product_id) {
            setProducts((prev) => prev.filter((p) => p.id !== event.data.product_id));
          } else if (event.data?.action === 'update' && event.data?.product) {
            const updated = event.data.product;
            setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          }
          loadData(true);
        }
        if (event.type === 'CATEGORY_UPDATED') {
          loadData(true);
        }
      },
      [loadData]
    )
  );

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      title: '',
      description: '',
      price: '',
      category_id: categories[0]?.id || '',
      image_url: '',
      sub_images: [],
      video_url: '',
      stock: 50,
      is_active: true,
      is_featured: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      title: prod.title,
      description: prod.description || '',
      price: prod.price,
      category_id: prod.category_id || '',
      image_url: prod.image_url || '',
      sub_images: Array.isArray(prod.sub_images) ? [...prod.sub_images] : [],
      video_url: prod.video_url || '',
      stock: prod.stock,
      is_active: prod.is_active,
      is_featured: prod.is_featured,
    });
    setIsModalOpen(true);
  };

  // Local PC Image Upload Handler
  const handleUploadMainImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMain(true);
    try {
      const res = await uploadMedia(file);
      setFormData((prev) => ({ ...prev, image_url: res.url }));
    } catch (err) {
      alert(`Image upload failed: ${err.message}`);
    } finally {
      setUploadingMain(false);
      if (e.target) e.target.value = '';
    }
  };

  // Local PC Video Upload Handler
  const handleUploadVideo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const res = await uploadMedia(file);
      setFormData((prev) => ({ ...prev, video_url: res.url }));
    } catch (err) {
      alert(`Video upload failed: ${err.message}`);
    } finally {
      setUploadingVideo(false);
      if (e.target) e.target.value = '';
    }
  };

  // Local PC Sub-Images Multi-Upload Handler
  const handleUploadSubImages = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingSubs(true);
    try {
      const uploadPromises = files.map((f) => uploadMedia(f));
      const results = await Promise.all(uploadPromises);
      const newUrls = results.map((r) => r.url);
      setFormData((prev) => ({
        ...prev,
        sub_images: [...(prev.sub_images || []), ...newUrls],
      }));
    } catch (err) {
      alert(`Sub-images upload failed: ${err.message}`);
    } finally {
      setUploadingSubs(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleAddSubImage = () => {
    setFormData((prev) => ({
      ...prev,
      sub_images: [...(prev.sub_images || []), ''],
    }));
  };

  const handleSubImageChange = (index, value) => {
    setFormData((prev) => {
      const updated = [...(prev.sub_images || [])];
      updated[index] = value;
      return { ...prev, sub_images: updated };
    });
  };

  const handleRemoveSubImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      sub_images: prev.sub_images.filter((_, i) => i !== index),
    }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleToggleActive = async (prod) => {
    try {
      const updated = await updateProduct(prod.id, { is_active: !prod.is_active });
      setProducts((prev) => prev.map((p) => (p.id === prod.id ? updated : p)));
    } catch (err) {
      alert(`Toggle failed: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.price) {
      alert('Title and Price are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
        category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
        sub_images: (formData.sub_images || []).filter((url) => url && url.trim() !== ''),
      };

      if (editingProduct) {
        const updated = await updateProduct(editingProduct.id, payload);
        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? updated : p)));
      } else {
        const created = await createProduct(payload);
        setProducts((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white">Product Catalog</h1>
          <p className="text-xs text-slate-400">
            Create, modify, and monitor store inventory with gallery support
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by title or description..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
            Loading catalog...
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No products found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/40 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Item & Photos</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Featured</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {products.map((p) => {
                  const subCount = p.sub_images?.length || 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Item */}
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="relative shrink-0">
                            <img
                              src={p.image_url}
                              alt={p.title}
                              className="w-11 h-11 rounded-lg object-cover bg-slate-800 border border-slate-700/60"
                            />
                            {subCount > 0 && (
                              <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white font-bold text-[9px] px-1 py-0.2 rounded-md shadow">
                                +{subCount}
                              </span>
                            )}
                          </div>
                          <div className="max-w-[220px]">
                            <div className="font-semibold text-white truncate flex items-center gap-1.5">
                              <span className="truncate">{p.title}</span>
                              {p.video_url && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 text-[10px] font-bold border border-violet-500/30 shrink-0">
                                  <Film className="w-2.5 h-2.5" /> Video
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {p.description}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-4 text-slate-300">
                        {p.category ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                            <span>{p.category.icon}</span>
                            <span>{p.category.name}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="p-4 font-bold text-emerald-400">
                        ${p.price.toFixed(2)}
                      </td>

                      {/* Stock */}
                      <td className="p-4 font-medium text-slate-300">
                        {p.stock > 0 ? (
                          <span>{p.stock} in stock</span>
                        ) : (
                          <span className="text-rose-400 font-bold">Out of stock</span>
                        )}
                      </td>

                      {/* Featured */}
                      <td className="p-4">
                        {p.is_featured ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                            <Star className="w-3 h-3 fill-indigo-400" /> Yes
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">No</span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleActive(p)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                            p.is_active
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {p.is_active ? 'Active' : 'Hidden'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 border border-rose-800/40"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. AeroPro Wireless ANC Headphones"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="29.99"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                >
                  <option value="">No Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Main Display Image */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Main Display Image *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => mainImageInputRef.current?.click()}
                    disabled={uploadingMain}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {uploadingMain ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Upload className="w-3 h-3" />
                    )}
                    <span>{uploadingMain ? 'Uploading...' : 'Upload Image from PC'}</span>
                  </button>
                  <input
                    ref={mainImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadMainImage}
                    className="hidden"
                  />
                </div>

                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="Or paste image URL (e.g. https://... or /uploads/...)"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  required
                />

                {formData.image_url && (
                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                      <img
                        src={formData.image_url}
                        alt="Main Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => (e.target.style.display = 'none')}
                      />
                    </div>
                    <div className="text-[11px] text-slate-400">
                      <p className="font-semibold text-white">Main Image Selected</p>
                      <p className="truncate max-w-[300px] text-slate-500">{formData.image_url}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Product Video (Shows FIRST in Product Detail!) */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-gradient-to-r from-violet-950/30 to-purple-950/20 border border-violet-800/40">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-violet-200 flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-violet-400" />
                      <span>Product Video (Shows FIRST in Product Detail)</span>
                    </label>
                    <p className="text-[10px] text-violet-400/80">
                      Upload an MP4/WebM video to showcase your product at the top of product details.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploadingVideo}
                    className="px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
                  >
                    {uploadingVideo ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Video className="w-3 h-3" />
                    )}
                    <span>{uploadingVideo ? 'Uploading...' : 'Upload Video from PC'}</span>
                  </button>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={handleUploadVideo}
                    className="hidden"
                  />
                </div>

                <input
                  type="text"
                  value={formData.video_url || ''}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder="Or paste video URL (e.g. https://... or /uploads/videos/...)"
                  className="w-full px-3 py-2 bg-slate-900 border border-violet-800/50 rounded-xl text-xs text-white"
                />

                {formData.video_url && (
                  <div className="space-y-1.5 pt-1">
                    <div className="relative rounded-xl overflow-hidden bg-black border border-violet-800/60 max-h-40">
                      <video
                        src={formData.video_url}
                        controls
                        className="w-full max-h-40 object-contain bg-black"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-violet-300 font-medium truncate max-w-[340px]">
                        Attached: {formData.video_url}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, video_url: '' })}
                        className="text-rose-400 hover:text-rose-300 underline font-semibold"
                      >
                        Remove Video
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sub-Images Gallery */}
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    <span>Sub-Images (Additional Angles & Gallery)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => subImagesInputRef.current?.click()}
                      disabled={uploadingSubs}
                      className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                      {uploadingSubs ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Upload className="w-3 h-3" />
                      )}
                      <span>{uploadingSubs ? 'Uploading...' : 'Upload from PC'}</span>
                    </button>
                    <input
                      ref={subImagesInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleUploadSubImages}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={handleAddSubImage}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition-colors border border-slate-700"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add URL</span>
                    </button>
                  </div>
                </div>

                {formData.sub_images?.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">
                    No extra angles added yet. Click "Upload from PC" to attach photos directly.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {formData.sub_images.map((url, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        {url ? (
                          <img
                            src={url}
                            alt={`Preview ${idx + 1}`}
                            className="w-8 h-8 rounded-lg object-cover bg-slate-900 border border-slate-700 shrink-0"
                            onError={(e) => (e.target.style.display = 'none')}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-[10px] text-slate-500 shrink-0">
                            #{idx + 1}
                          </div>
                        )}
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => handleSubImageChange(idx, e.target.value)}
                          placeholder={`Photo URL #${idx + 1}`}
                          className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSubImage(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe key features and materials..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white resize-none"
                />
              </div>

              <div className="flex items-center space-x-6 pt-2">
                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Feature on Storefront</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Active (Visible in Mini App)</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
                >
                  {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
