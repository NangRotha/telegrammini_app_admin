import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Coins,
  Plus,
  Search,
  RefreshCw,
  Gift,
  MinusCircle,
  Edit3,
  Trash2,
  RotateCcw,
  Check,
  Copy,
  Users,
  DollarSign,
  TrendingUp,
  Sparkles,
  X,
  AlertCircle,
  Send,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
} from 'lucide-react';
import {
  getUsers,
  createUser,
  updateUser,
  adjustUserPoints,
  resetUserPoints,
  deleteUser,
} from '../services/api';
import { useRealtime } from '../hooks/useRealtime';

export function PointsView() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [toast, setToast] = useState(null);

  // Modals state
  const [awardModal, setAwardModal] = useState({ open: false, user: null, mode: 'award' }); // 'award' or 'deduct'
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, user: null });
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [pointsDelta, setPointsDelta] = useState(100);
  const [pointsReason, setPointsReason] = useState('Store VIP Bonus');
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  // Register Form
  const [newUser, setNewUser] = useState({
    id: '',
    first_name: '',
    last_name: '',
    username: '',
    phone: '',
    default_address: '',
    points: 100,
  });

  // Edit Form
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    phone: '',
    default_address: '',
    points: 0,
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadUsers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getUsers(search);
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
      showToast(err.message || 'Failed to fetch customer points', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Real-time updates subscription
  useRealtime((event) => {
    if (
      event.type === 'POINTS_UPDATED' ||
      event.type === 'USER_CREATED' ||
      event.type === 'USER_DELETED' ||
      event.type === 'PROFILE_UPDATED' ||
      event.type === 'ORDER_CREATED'
    ) {
      loadUsers(true);
    }
  });

  // Aggregate Metrics
  const stats = useMemo(() => {
    const totalMembers = users.length;
    const totalPoints = users.reduce((acc, u) => acc + (u.points || 0), 0);
    const totalUsdValue = (totalPoints / 100).toFixed(2);
    const avgPoints = totalMembers > 0 ? Math.round(totalPoints / totalMembers) : 0;
    return { totalMembers, totalPoints, totalUsdValue, avgPoints };
  }, [users]);

  // Copy Telegram ID
  const handleCopyId = (id) => {
    navigator.clipboard.writeText(String(id));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Award or Deduct Modal
  const handleOpenAdjust = (user, mode = 'award') => {
    setAwardModal({ open: true, user, mode });
    setPointsDelta(mode === 'award' ? 100 : 50);
    setPointsReason(mode === 'award' ? 'Store VIP Reward' : 'Points Balance Adjustment');
    setNotifyCustomer(true);
  };

  // Submit Point Adjustment (+ or -)
  const handleSavePointsAdjust = async (e) => {
    e.preventDefault();
    if (!awardModal.user) return;
    const isAward = awardModal.mode === 'award';
    const delta = isAward ? Math.abs(Number(pointsDelta)) : -Math.abs(Number(pointsDelta));

    if (delta === 0) {
      alert('Points amount cannot be zero');
      return;
    }

    setActionLoading(true);
    try {
      const updated = await adjustUserPoints(
        awardModal.user.id,
        delta,
        pointsReason,
        notifyCustomer
      );
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      showToast(
        `${isAward ? 'Awarded +' : 'Deducted -'}${Math.abs(delta).toLocaleString()} points to ${updated.first_name || updated.id}${
          notifyCustomer ? ' (Telegram notified)' : ''
        }`
      );
      setAwardModal({ open: false, user: null, mode: 'award' });
    } catch (err) {
      alert(`Error adjusting points: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Reset Points to 0
  const handleResetPoints = async (user) => {
    if (
      !window.confirm(
        `Are you sure you want to RESET loyalty points to 0 for ${user.first_name || user.id}? Current balance: ${user.points.toLocaleString()} pts.`
      )
    ) {
      return;
    }

    try {
      const updated = await resetUserPoints(user.id);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      showToast(`Reset points to 0 for ${user.first_name || user.id}`);
    } catch (err) {
      alert(`Failed to reset points: ${err.message}`);
    }
  };

  // Delete User Account
  const handleDeleteUser = async (user) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete customer profile for ${user.first_name || user.id} (Telegram ID: ${user.id})?`
      )
    ) {
      return;
    }

    try {
      await deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      showToast(`Customer ${user.first_name || user.id} deleted`);
    } catch (err) {
      alert(`Failed to delete customer: ${err.message}`);
    }
  };

  // Open Edit User Modal
  const handleOpenEdit = (user) => {
    setEditModal({ open: true, user });
    setEditForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      username: user.username || '',
      phone: user.phone || '',
      default_address: user.default_address || '',
      points: user.points || 0,
    });
  };

  // Save Edit User
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editModal.user) return;
    setActionLoading(true);
    try {
      const updated = await updateUser(editModal.user.id, {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        username: editForm.username,
        phone: editForm.phone,
        default_address: editForm.default_address,
        points: Number(editForm.points),
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      showToast(`Updated customer ${updated.first_name || updated.id}`);
      setEditModal({ open: false, user: null });
    } catch (err) {
      alert(`Failed to update customer: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Register New Customer with Points
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newUser.id || !newUser.first_name) {
      alert('Telegram ID and First Name are required');
      return;
    }
    setActionLoading(true);
    try {
      const created = await createUser({
        id: Number(newUser.id),
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        username: newUser.username ? newUser.username.replace('@', '') : '',
        phone: newUser.phone,
        default_address: newUser.default_address,
        points: Number(newUser.points) || 100,
      });
      setUsers((prev) => [created, ...prev.filter((u) => u.id !== created.id)]);
      showToast(`Registered member ${created.first_name} with ${created.points.toLocaleString()} points!`);
      setCreateModalOpen(false);
      setNewUser({
        id: '',
        first_name: '',
        last_name: '',
        username: '',
        phone: '',
        default_address: '',
        points: 100,
      });
    } catch (err) {
      alert(`Failed to register customer: ${err.message}`);
    } finally {
      setActionLoading(false);
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
              <Coins className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Customer Loyalty Points
            </h1>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Award, deduct, edit, and manage member reward points with real-time Telegram bot sync.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadUsers()}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition-all disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register Member</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Members */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Enrolled Customers</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {stats.totalMembers.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500">Registered member profiles</span>
        </div>

        {/* Total Points */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Points Outstanding</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">
            {stats.totalPoints.toLocaleString()} <span className="text-xs font-normal text-slate-400">pts</span>
          </div>
          <span className="text-[11px] text-slate-500">Avg: {stats.avgPoints.toLocaleString()} pts / member</span>
        </div>

        {/* Monetary Value */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Circulation Value</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            ${stats.totalUsdValue} <span className="text-xs font-normal text-slate-400">USD</span>
          </div>
          <span className="text-[11px] text-slate-500">Backed at 100 pts = $1.00 USD</span>
        </div>

        {/* Conversion Rate Info */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-indigo-500/10 border border-amber-500/20 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300">Reward Rules</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span>Earn Rate:</span>
              <span className="text-emerald-400 font-mono">10 pts / $1 spent</span>
            </div>
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span>Redeem Rate:</span>
              <span className="text-amber-400 font-mono">100 pts = $1.00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, @username, phone, or Telegram ID..."
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

      {/* Users & Points Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 border-b border-slate-800 font-medium">
              <tr>
                <th className="py-3 px-4">Member Profile</th>
                <th className="py-3 px-4">Telegram ID</th>
                <th className="py-3 px-4">Contact & Delivery</th>
                <th className="py-3 px-4">Points Balance</th>
                <th className="py-3 px-4">USD Value</th>
                <th className="py-3 px-4 text-right">Loyalty Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
                    Loading customer loyalty points...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <Coins className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-60" />
                    No customers found matching "{search}".
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const points = u.points || 0;
                  const usdValue = (points / 100).toFixed(2);
                  const isTopEarner = points >= 500;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Profile */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500/20 to-indigo-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-300 text-xs shrink-0 overflow-hidden">
                            {u.avatar_url ? (
                              <img
                                src={u.avatar_url}
                                alt={u.first_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (u.first_name?.[0] || 'U').toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <span>
                                {u.first_name} {u.last_name}
                              </span>
                              {isTopEarner && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  VIP
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-indigo-400 font-mono">
                              {u.username ? `@${u.username}` : 'No username'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Telegram ID */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleCopyId(u.id)}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-mono text-[11px] transition-colors border border-slate-700/50"
                          title="Click to copy Telegram ID"
                        >
                          <span>{u.id}</span>
                          {copiedId === u.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-500 group-hover:text-slate-400" />
                          )}
                        </button>
                      </td>

                      {/* Contact & Address */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="text-slate-300 font-medium">
                            {u.phone || <span className="text-slate-600">No phone</span>}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                            {u.default_address || <span className="text-slate-600">No address saved</span>}
                          </div>
                        </div>
                      </td>

                      {/* Points Balance */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold shadow-sm shadow-amber-500/5">
                          <Coins className="w-3.5 h-3.5 text-amber-400" />
                          <span>{points.toLocaleString()} pts</span>
                        </div>
                      </td>

                      {/* USD Value */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-emerald-400 font-mono">
                          ${usdValue}
                        </div>
                        <span className="text-[10px] text-slate-500">discount credit</span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Award Points (+) */}
                          <button
                            onClick={() => handleOpenAdjust(u, 'award')}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold transition-all"
                            title="Award bonus points"
                          >
                            <Gift className="w-3.5 h-3.5" />
                            <span>Award</span>
                          </button>

                          {/* Deduct Points (-) */}
                          <button
                            onClick={() => handleOpenAdjust(u, 'deduct')}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-semibold transition-all"
                            title="Deduct points"
                          >
                            <MinusCircle className="w-3.5 h-3.5" />
                            <span>Deduct</span>
                          </button>

                          {/* Edit Customer / Direct points */}
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                            title="Edit customer profile & points"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Reset to 0 */}
                          <button
                            onClick={() => handleResetPoints(u)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-950/60 text-slate-400 hover:text-amber-400 border border-slate-700/60 transition-colors"
                            title="Reset points to 0"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Account */}
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700/60 transition-colors"
                            title="Delete customer profile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: Award or Deduct Points ================= */}
      {awardModal.open && awardModal.user && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div
              className={`p-4 border-b border-slate-800 flex items-center justify-between ${
                awardModal.mode === 'award'
                  ? 'bg-gradient-to-r from-emerald-500/10 to-transparent'
                  : 'bg-gradient-to-r from-rose-500/10 to-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    awardModal.mode === 'award'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {awardModal.mode === 'award' ? (
                    <Gift className="w-4 h-4" />
                  ) : (
                    <MinusCircle className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {awardModal.mode === 'award' ? 'Award Loyalty Points' : 'Deduct Loyalty Points'}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    To: {awardModal.user.first_name} (ID: {awardModal.user.id})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setAwardModal({ open: false, user: null, mode: 'award' })}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePointsAdjust} className="p-5 space-y-4">
              {/* Current vs New balance */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Current Balance</span>
                  <div className="text-base font-black text-amber-400 mt-0.5">
                    {(awardModal.user.points || 0).toLocaleString()} pts
                  </div>
                  <span className="text-[10px] text-slate-500">
                    ≈ ${((awardModal.user.points || 0) / 100).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">After Adjustment</span>
                  <div
                    className={`text-base font-black mt-0.5 ${
                      awardModal.mode === 'award' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {Math.max(
                      0,
                      (awardModal.user.points || 0) +
                        (awardModal.mode === 'award' ? Number(pointsDelta) : -Number(pointsDelta))
                    ).toLocaleString()}{' '}
                    pts
                  </div>
                  <span className="text-[10px] text-slate-500">
                    ≈ $
                    {(
                      Math.max(
                        0,
                        (awardModal.user.points || 0) +
                          (awardModal.mode === 'award' ? Number(pointsDelta) : -Number(pointsDelta))
                      ) / 100
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Quick Presets */}
              {awardModal.mode === 'award' && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                    Quick Preset Amounts
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[50, 100, 250, 500, 1000].map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => setPointsDelta(preset)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all border ${
                          pointsDelta === preset
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        +{preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Points Amount Input */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Points Amount
                </label>
                <div className="relative">
                  <Coins className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={pointsDelta}
                    onChange={(e) => setPointsDelta(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full pl-10 pr-16 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-emerald-400 font-semibold">
                    ≈ ${(Number(pointsDelta) / 100).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Reason / Note */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Reason / Adjustment Note
                </label>
                <input
                  type="text"
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                  placeholder="e.g. VIP Member Reward, Apology Credit, Holiday Special..."
                  className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Telegram Notification Checkbox */}
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer hover:bg-slate-800 transition-colors">
                <input
                  type="checkbox"
                  checked={notifyCustomer}
                  onChange={(e) => setNotifyCustomer(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-0"
                />
                <div className="flex-1 text-xs">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-sky-400" />
                    <span>Send Telegram bot message to customer</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Instantly notifies @minishopnuckbot chat with new balance.
                  </span>
                </div>
              </label>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAwardModal({ open: false, user: null, mode: 'award' })}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
                    awardModal.mode === 'award'
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-emerald-500/20'
                      : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-rose-500/20'
                  }`}
                >
                  {actionLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : awardModal.mode === 'award' ? (
                    <Gift className="w-3.5 h-3.5" />
                  ) : (
                    <MinusCircle className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {awardModal.mode === 'award'
                      ? `Award +${pointsDelta.toLocaleString()} Points`
                      : `Deduct -${pointsDelta.toLocaleString()} Points`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: Register New Member ================= */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-transparent">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Register Member & Assign Points</h3>
                  <span className="text-[11px] text-slate-400">Add customer profile into database</span>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Telegram ID <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 8401599473"
                    value={newUser.id}
                    onChange={(e) => setNewUser({ ...newUser, id: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Starting Points
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newUser.points}
                    onChange={(e) => setNewUser({ ...newUser, points: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    First Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rotha"
                    value={newUser.first_name}
                    onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Doe"
                    value={newUser.last_name}
                    onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Telegram @username
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. rotha_dev"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 012345678"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Default Shipping Address
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Street 271, Sangkat Boeung Tumpun, Phnom Penh"
                  value={newUser.default_address}
                  onChange={(e) => setNewUser({ ...newUser, default_address: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
                >
                  {actionLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5" />
                  )}
                  <span>Register Customer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: Edit Customer & Set Exact Points ================= */}
      {editModal.open && editModal.user && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 to-transparent">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Edit Customer Profile & Points</h3>
                  <span className="text-[11px] text-slate-400">
                    Telegram ID: {editModal.user.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditModal({ open: false, user: null })}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              {/* Exact Points Balance field */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <label className="text-[11px] font-bold text-amber-300 block mb-1">
                  Exact Loyalty Points Balance
                </label>
                <div className="relative">
                  <Coins className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                  <input
                    type="number"
                    min="0"
                    required
                    value={editForm.points}
                    onChange={(e) =>
                      setEditForm({ ...editForm, points: Math.max(0, parseInt(e.target.value) || 0) })
                    }
                    className="w-full pl-10 pr-16 py-2 bg-slate-900/90 border border-amber-500/40 rounded-xl text-sm font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-emerald-400 font-semibold">
                    ≈ ${(Number(editForm.points) / 100).toFixed(2)}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Directly sets the customer's total point balance in the database.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Telegram @username
                  </label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Default Shipping Address
                </label>
                <textarea
                  rows="2"
                  value={editForm.default_address}
                  onChange={(e) => setEditForm({ ...editForm, default_address: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModal({ open: false, user: null })}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20"
                >
                  {actionLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
