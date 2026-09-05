import React from 'react';
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingBag,
  Bot,
  Ticket,
  ExternalLink,
  Store,
  Coins,
  Bell,
  Sliders,
  LogOut,
} from 'lucide-react';

export function Sidebar({ currentTab, setCurrentTab, storeInfo, onLogout }) {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: 'promocodes', label: 'Promo Codes', icon: Ticket },
    { id: 'points', label: 'Loyalty Points', icon: Coins },
    { id: 'alerts', label: 'Alert Popups', icon: Bell },
    { id: 'orders', label: 'Orders Workflow', icon: ShoppingBag },
    { id: 'bot', label: 'Telegram Bot', icon: Bot },
    { id: 'settings', label: 'Store & Security', icon: Sliders },
  ];

  const storeName = storeInfo?.store_name || 'Mini Shop';
  const storeLogo = storeInfo?.store_logo || '🛍';
  const storeTagline = storeInfo?.store_tagline || 'Store Admin';
  const isImageLogo = storeLogo.startsWith('http') || storeLogo.startsWith('/uploads');

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-screen select-none">
      <div>
        {/* Dynamic Logo & Header */}
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 overflow-hidden text-lg shrink-0">
            {isImageLogo ? (
              <img src={storeLogo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span>{storeLogo}</span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm text-white leading-none truncate">{storeName}</h1>
            <span className="text-[11px] text-indigo-400 font-medium truncate block mt-0.5">
              {storeTagline}
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Customer App Link & Logout */}
      <div className="p-4 border-t border-slate-800 space-y-2.5">
        <a
          href={
            import.meta.env.VITE_USER_APP_URL ||
            (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
              ? 'https://telegram-mini-app-user.vercel.app'
              : 'http://localhost:5173')
          }
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <span>🛍</span> Launch User Mini App
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>

        {/* Logout Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-slate-800/40 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-900/50 text-xs font-medium transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        )}

        <div className="flex items-center space-x-2.5 px-2 pt-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[11px] text-slate-400">Bot: @minishopnuckbot</span>
        </div>
      </div>
    </aside>
  );
}
