import React, { useState } from 'react';
import { Store, Lock, User, ArrowRight, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { adminLogin } from '../services/api';

export function LoginView({ onLoginSuccess, storeInfo }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter username and password');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await adminLogin(username.trim(), password);
      localStorage.setItem('admin_token', res.token);
      localStorage.setItem('admin_username', res.username);
      onLoginSuccess(res);
    } catch (err) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const storeName = storeInfo?.store_name || 'Mini Shop';
  const storeLogo = storeInfo?.store_logo || '🛍';

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4 select-none relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm rounded-3xl bg-slate-900/90 border border-slate-800 p-7 shadow-2xl backdrop-blur-xl relative z-10 animate-in fade-in zoom-in-95">
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 border border-white/20 flex items-center justify-center text-3xl shadow-xl shadow-indigo-600/30">
            {storeLogo.startsWith('http') ? (
              <img src={storeLogo} alt="Logo" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <span>{storeLogo}</span>
            )}
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">{storeName}</h1>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-semibold">
            <Lock className="w-3 h-3" />
            <span>Store Administrator Portal</span>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Admin Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-[10px] text-slate-500 border-t border-slate-800/80 pt-4">
          Default credentials: <span className="text-slate-400 font-mono">admin / admin123</span>
        </div>
      </div>
    </div>
  );
}
