import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  Eye,
  Send,
  X,
  RefreshCw,
  Phone,
  MapPin,
  MessageSquare,
  Bell,
  Sparkles,
  QrCode,
  CreditCard,
  Check,
  ExternalLink,
} from 'lucide-react';
import { getAllOrders, updateOrderStatus, checkOrderPayment } from '../services/api';
import { useRealtime } from '../hooks/useRealtime';

export function OrdersView() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [realtimeAlert, setRealtimeAlert] = useState(null);

  // Status update modal state
  const [newStatus, setNewStatus] = useState('pending');
  const [newPaymentStatus, setNewPaymentStatus] = useState('unpaid');
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [customMessage, setCustomMessage] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getAllOrders(statusFilter || null);
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Real-time synchronization
  useRealtime(
    useCallback((event) => {
      if (event.type === 'ORDER_CREATED') {
        loadOrders(true);
        setRealtimeAlert({
          type: 'new_order',
          title: 'New Order Received!',
          message: `Order #${event.data?.order_number} for $${event.data?.total_amount} by ${event.data?.customer_name}`,
        });
        setTimeout(() => setRealtimeAlert(null), 8000);
      } else if (event.type === 'ORDER_STATUS_UPDATED' || event.type === 'PAYMENT_CONFIRMED') {
        loadOrders(true);
      }
    }, [loadOrders])
  );

  const handleOpenOrder = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setNewPaymentStatus(order.payment_status || 'unpaid');
    setCustomMessage('');
    setNotifyCustomer(Boolean(order.user_id));
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      const updated = await updateOrderStatus(
        selectedOrder.id,
        newStatus,
        notifyCustomer,
        customMessage,
        newPaymentStatus
      );
      setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? updated : o)));
      setSelectedOrder(updated);
      alert('Order updated successfully and Telegram notification sent!');
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleVerifyAbaPayment = async () => {
    if (!selectedOrder?.order_number || verifyingPayment) return;
    setVerifyingPayment(true);
    try {
      const res = await checkOrderPayment(selectedOrder.order_number);
      if (res.paid) {
        const updated = {
          ...selectedOrder,
          payment_status: 'paid',
          status: res.order_status || selectedOrder.status,
        };
        setSelectedOrder(updated);
        setNewPaymentStatus('paid');
        setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? updated : o)));
        alert(`Payment Confirmed for Order #${selectedOrder.order_number}! Marked as Paid.`);
      } else {
        alert(`Payment Check: Status is "${res.status || 'pending'}". Payment has not been completed yet.`);
      }
    } catch (err) {
      alert(`Verification error: ${err.message}`);
    } finally {
      setVerifyingPayment(false);
    }
  };

  const getPaymentBadge = (order) => {
    const isKhqr = order.payment_method === 'khqr';
    const isPaid = order.payment_status === 'paid';
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${
            isKhqr
              ? 'bg-[#003954]/50 border-[#00b4d8]/40 text-[#00b4d8]'
              : 'bg-slate-800 border-slate-700 text-slate-300'
          }`}
        >
          {isKhqr ? <QrCode className="w-3 h-3 text-[#00b4d8]" /> : <CreditCard className="w-3 h-3 text-slate-400" />}
          <span>{isKhqr ? 'ABA Pay' : 'COD'}</span>
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
            isPaid
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
          }`}
        >
          {isPaid ? 'PAID' : 'UNPAID'}
        </span>
      </div>
    );
  };


  const getStatusBadge = (status) => {
    const config = {
      pending: { label: 'Pending', bg: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
      confirmed: { label: 'Confirmed', bg: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
      shipped: { label: 'Shipped', bg: 'bg-purple-500/10 text-purple-300 border-purple-500/20' },
      delivered: { label: 'Delivered', bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
      cancelled: { label: 'Cancelled', bg: 'bg-rose-500/10 text-rose-300 border-rose-500/20' },
    };
    const c = config[status] || config.pending;
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${c.bg}`}>
        {c.label}
      </span>
    );
  };

  const tabs = [
    { id: '', label: 'All Orders' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white">Orders Workflow</h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Live Real-Time
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Fulfill orders and send real-time Telegram alerts to buyers
          </p>
        </div>
        <button
          onClick={() => loadOrders()}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Real-time Order Alert Toast */}
      {realtimeAlert && (
        <div className="p-4 rounded-2xl bg-indigo-950/80 border border-indigo-500/50 shadow-lg shadow-indigo-500/10 flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">{realtimeAlert.title}</div>
              <div className="text-[11px] text-indigo-200">{realtimeAlert.message}</div>
            </div>
          </div>
          <button
            onClick={() => setRealtimeAlert(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-800 pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              statusFilter === tab.id
                ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No orders found in this view.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/40 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Order Number</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-indigo-300">
                      {o.order_number}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-white">{o.customer_name}</div>
                      {o.user_id && (
                        <div className="text-[10px] text-sky-400 font-mono">
                          TG ID: {o.user_id}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-slate-300">{o.customer_phone}</td>
                    <td className="p-4 font-bold text-emerald-400">
                      ${o.total_amount.toFixed(2)}
                    </td>
                    <td className="p-4">{getPaymentBadge(o)}</td>
                    <td className="p-4">{getStatusBadge(o.status)}</td>
                    <td className="p-4 text-slate-400">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenOrder(o)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold flex items-center gap-1.5 ml-auto border border-slate-700/80"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail & Management Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono">
                  Order Details
                </span>
                <h2 className="text-base font-bold text-indigo-300 font-mono">
                  {selectedOrder.order_number}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Shipping Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="font-semibold text-white">
                  {selectedOrder.customer_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phone:</span>
                <span className="font-semibold text-slate-200">
                  {selectedOrder.customer_phone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Address:</span>
                <span className="font-semibold text-slate-200 text-right max-w-[240px]">
                  {selectedOrder.delivery_address}
                </span>
              </div>
              {selectedOrder.notes && (
                <div className="flex justify-between border-t border-slate-700/50 pt-2">
                  <span className="text-slate-400">Note:</span>
                  <span className="text-slate-300 italic text-right">
                    {selectedOrder.notes}
                  </span>
                </div>
              )}
            </div>

            {/* Payment Status & ABA Pay Details */}
            <div className="p-3.5 rounded-2xl bg-[#00283b]/70 border border-[#00b4d8]/25 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-[#00b4d8]" />
                  <span>Payment Gateway</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    selectedOrder.payment_method === 'khqr'
                      ? 'bg-[#003954] text-[#00b4d8] border border-[#00b4d8]/40'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {selectedOrder.payment_method === 'khqr' ? 'ABA Pay / KHQR' : 'Cash on Delivery'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    selectedOrder.payment_status === 'paid'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}>
                    {selectedOrder.payment_status === 'paid' ? 'PAID' : 'UNPAID'}
                  </span>
                </div>
              </div>

              {selectedOrder.payment_method === 'khqr' && (
                <div className="pt-2 border-t border-[#00b4d8]/20 flex items-center justify-between flex-wrap gap-2">
                  <div className="text-[11px] text-slate-300">
                    <div><b>Merchant:</b> NANG ROTHA (ABA Bank)</div>
                    {selectedOrder.khqr_md5 && (
                      <div className="font-mono text-[10px] text-slate-400 truncate max-w-[200px]">
                        MD5: {selectedOrder.khqr_md5}
                      </div>
                    )}
                  </div>

                  {selectedOrder.payment_status !== 'paid' ? (
                    <button
                      type="button"
                      onClick={handleVerifyAbaPayment}
                      disabled={verifyingPayment}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#005a84] to-[#003954] hover:from-[#00699b] hover:to-[#004769] border border-[#00b4d8]/40 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-[#00b4d8] ${verifyingPayment ? 'animate-spin' : ''}`} />
                      <span>{verifyingPayment ? 'Checking V2...' : 'Check ABA Status (v2)'}</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Confirmed via khqr.cc
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Purchased Items */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Items in Order
              </h4>
              <div className="rounded-xl bg-slate-800/40 border border-slate-800 divide-y divide-slate-800">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="p-3 flex justify-between text-xs">
                    <div>
                      <span className="font-semibold text-white">
                        {item.product_title}
                      </span>
                      <span className="text-slate-400 block text-[11px]">
                        ${item.price.toFixed(2)} × {item.quantity}
                      </span>
                    </div>
                    <span className="font-bold text-emerald-400">
                      ${item.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-white px-2 pt-1">
                <span>Total Amount</span>
                <span className="text-emerald-400 text-base">
                  ${selectedOrder.total_amount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Status Update Form */}
            <form onSubmit={handleUpdateStatus} className="pt-3 border-t border-slate-800 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Order Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Payment Status
                  </label>
                  <select
                    value={newPaymentStatus}
                    onChange={(e) => setNewPaymentStatus(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>


              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> Optional Note for Telegram Notification
                </label>
                <input
                  type="text"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="e.g. Courier tracking link: dhl.com/track/123..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="notifyCust"
                  checked={notifyCustomer}
                  onChange={(e) => setNotifyCustomer(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="notifyCust" className="text-xs text-slate-300 cursor-pointer">
                  Notify customer automatically via Telegram Bot (@minishopnuckbot)
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{updating ? 'Updating...' : 'Save & Dispatch Alert'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
