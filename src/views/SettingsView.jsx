import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Store,
  Lock,
  Upload,
  Check,
  RefreshCw,
  Sparkles,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import {
  getSettings,
  updateSettings,
  changeAdminPassword,
  uploadMedia,
} from '../services/api';

const PRESET_LOGOS = ['🛍', '🏪', '💎', '⚡', '🎁', '🚀', '👟', '☕', '📱', '👑', '🎯', '✨'];

export function SettingsView({ onSettingsUpdated }) {
  const [settings, setSettings] = useState({
    store_name: 'Mini Shop',
    store_logo: '🛍',
    store_tagline: 'Store Admin',
  });
  const [loading, setLoading] = useState(true);
  const [savingBranding, setSavingBranding] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [toast, setToast] = useState(null);

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load store settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Upload Logo Image
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const res = await uploadMedia(file);
      setSettings((prev) => ({ ...prev, store_logo: res.url }));
      showToast('Logo image uploaded!');
    } catch (err) {
      alert(`Logo upload failed: ${err.message}`);
    } finally {
      setUploadingLogo(false);
    }
  };

  // Save Branding
  const handleSaveBranding = async (e) => {
    e.preventDefault();
    if (!settings.store_name.trim()) {
      alert('Store name cannot be empty');
      return;
    }

    setSavingBranding(true);
    try {
      const updated = await updateSettings({
        store_name: settings.store_name.trim(),
        store_logo: settings.store_logo.trim() || '🛍',
        store_tagline: settings.store_tagline.trim() || 'Store Admin',
      });
      setSettings(updated);
      showToast('Store branding and logo updated successfully!');
      if (onSettingsUpdated) onSettingsUpdated(updated);
    } catch (err) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setSavingBranding(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);

    if (!passwordForm.currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }
    if (passwordForm.newPassword.length < 4) {
      setPasswordError('New password must be at least 4 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }

    setSavingPassword(true);
    try {
      await changeAdminPassword(passwordForm.currentPassword, passwordForm.newPassword);
      showToast('Admin password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const isImageLogo = settings.store_logo?.startsWith('http') || settings.store_logo?.startsWith('/uploads');

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Toast */}
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
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Sliders className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Store & Security Settings
          </h1>
        </div>
        <p className="text-slate-400 text-xs mt-1">
          Customize your store branding, logo name, logo icon/image, and update your administrator password.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Branding CRUD Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white">Store Logo & Branding</h2>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Syncs to User App & Admin</span>
            </div>

            <form onSubmit={handleSaveBranding} className="space-y-4">
              {/* Logo Visual Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Store Logo (Image or Icon)
                </label>

                <div className="flex items-center gap-4">
                  {/* Live Logo Preview Box */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 border-2 border-indigo-500/50 flex items-center justify-center text-3xl shadow-xl shadow-indigo-600/20 overflow-hidden shrink-0">
                    {isImageLogo ? (
                      <img
                        src={settings.store_logo}
                        alt="Store Logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{settings.store_logo || '🛍'}</span>
                    )}
                  </div>

                  {/* Actions: Upload Image or Type Emoji */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={settings.store_logo}
                        onChange={(e) =>
                          setSettings({ ...settings, store_logo: e.target.value })
                        }
                        placeholder="Paste image URL or emoji"
                        className="flex-1 px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />

                      <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-colors shrink-0">
                        {uploadingLogo ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                        <span>Upload Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                        />
                      </label>
                    </div>

                    {/* Quick Preset Emoji Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-500 font-semibold mr-1">
                        Presets:
                      </span>
                      {PRESET_LOGOS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setSettings({ ...settings, store_logo: emoji })}
                          className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all ${
                            settings.store_logo === emoji
                              ? 'bg-indigo-600 border border-indigo-400 shadow'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Store Name / Name Logo */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Store Name (Logo Name) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={settings.store_name}
                  onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                  placeholder="e.g. Mini Shop"
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Displayed in the top navigation bar of both Admin and Shopper Mini App.
                </span>
              </div>

              {/* Tagline / Subtitle */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Store Subtitle / Tagline
                </label>
                <input
                  type="text"
                  value={settings.store_tagline}
                  onChange={(e) =>
                    setSettings({ ...settings, store_tagline: e.target.value })
                  }
                  placeholder="e.g. Store Admin / Official Telegram Store"
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={savingBranding}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98]"
                >
                  {savingBranding ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{savingBranding ? 'Saving...' : 'Save Branding Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right 1 Col: Live Preview & Password Change */}
        <div className="space-y-6">
          {/* Live Preview Box */}
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-sm space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Header Live Preview
            </span>

            {/* Simulated Sidebar Header */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 overflow-hidden text-xl shrink-0">
                {isImageLogo ? (
                  <img src={settings.store_logo} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span>{settings.store_logo || '🛍'}</span>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-white leading-none truncate">
                  {settings.store_name || 'Mini Shop'}
                </h3>
                <span className="text-[11px] text-indigo-400 font-medium">
                  {settings.store_tagline || 'Store Admin'}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 block text-center">
              Customers will see this branding across the application.
            </span>
          </div>

          {/* Change Password Box */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">Change Admin Password</h2>
            </div>

            {passwordError && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  placeholder="At least 4 characters"
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  placeholder="Repeat new password"
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  {savingPassword ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  <span>{savingPassword ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
