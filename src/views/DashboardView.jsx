import React, { useEffect, useState, useCallback } from 'react';
import {
  DollarSign,
  ShoppingBag,
  Package,
  Clock,
  ArrowUpRight,
  RefreshCw,
  CheckCircle2,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { getDashboardStats } from '../services/api';
import { useRealtime } from '../hooks/useRealtime';

export function DashboardView({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Real-time synchronization for dashboard metrics
  useRealtime(
    useCallback(
      (event) => {
        if (
          event.type === 'ORDER_CREATED' ||
          event.type === 'ORDER_STATUS_UPDATED' ||
          event.type === 'PRODUCT_UPDATED'
        ) {
          loadStats(true);
        }
      },
      [loadStats]
    )
  );

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Revenue',
      value: `$${stats?.total_revenue?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      badge: '+18.4% this week',
    },
    {
      label: 'Total Orders',
      value: stats?.total_orders || 0,
      icon: ShoppingBag,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
      badge: `${stats?.pending_orders || 0} pending`,
    },
    {
      label: 'Products in Catalog',
      value: stats?.total_products || 0,
      icon: Package,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10 border-violet-500/20',
      badge: 'Active & Stocked',
    },
    {
      label: 'Completed Orders',
      value: stats?.completed_orders || 0,
      icon: CheckCircle2,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20',
      badge: 'Delivered',
    },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white">Store Analytics & Overview</h1>
          <p className="text-xs text-slate-400">
            Real-time sales, order streams, and inventory monitoring
          </p>
        </div>
        <button
          onClick={loadStats}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`p-5 rounded-2xl border ${card.bg} bg-slate-900/80 backdrop-blur-sm shadow-lg`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400">{card.label}</span>
                <div className={`p-2 rounded-xl bg-slate-800/80 ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white">{card.value}</div>
              <div className="mt-2 flex items-center text-[11px] text-slate-400 gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">{card.badge}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate('products')}
          className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 hover:border-indigo-500/50 transition-all text-left group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Manage Products
            </span>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">Add or Edit Items</h3>
          <p className="text-xs text-slate-400">
            Update prices, images, descriptions and stock levels.
          </p>
        </button>

        <button
          onClick={() => onNavigate('orders')}
          className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 to-slate-900 border border-purple-500/20 hover:border-purple-500/50 transition-all text-left group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
              Order Fulfillment
            </span>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">Process Customer Orders</h3>
          <p className="text-xs text-slate-400">
            Change status to Shipped or Delivered & notify via Telegram.
          </p>
        </button>

        <button
          onClick={() => onNavigate('bot')}
          className="p-4 rounded-2xl bg-gradient-to-br from-sky-950/40 to-slate-900 border border-sky-500/20 hover:border-sky-500/50 transition-all text-left group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
              Bot Integration
            </span>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">@minishopnuckbot</h3>
          <p className="text-xs text-slate-400">
            Manage WebApp links and test real-time Telegram alerts.
          </p>
        </button>
      </div>

      {/* Recent Orders Section */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white">Recent Orders</h2>
          <button
            onClick={() => onNavigate('orders')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            View All Orders →
          </button>
        </div>

        {stats?.recent_orders?.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No orders placed yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase tracking-wider border-b border-slate-800 font-semibold">
                <tr>
                  <th className="pb-3">Order #</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stats?.recent_orders?.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-mono font-bold text-indigo-300">
                      {order.order_number}
                    </td>
                    <td className="py-3 text-white font-medium">
                      {order.customer_name}
                    </td>
                    <td className="py-3 text-slate-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 font-bold text-emerald-400">
                      ${order.total_amount.toFixed(2)}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {order.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
