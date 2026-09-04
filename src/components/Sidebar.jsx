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
} from 'lucide-react';

export function Sidebar({ currentTab, setCurrentTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: 'promocodes', label: 'Promo Codes', icon: Ticket },
    { id: 'orders', label: 'Orders Workflow', icon: ShoppingBag },
    { id: 'bot', label: 'Telegram Bot', icon: Bot },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-screen">
      <div>
        {/* Logo & Header */}
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-white leading-none">Mini Shop</h1>
            <span className="text-[11px] text-indigo-400 font-medium">Store Admin</span>
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

      {/* Footer Info & Customer App Link */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <span>🛍</span> Launch User Mini App
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>

        <div className="flex items-center space-x-2.5 px-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[11px] text-slate-400">Bot: @minishopnuckbot</span>
        </div>
      </div>
    </aside>
  );
}
