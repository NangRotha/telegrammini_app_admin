const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export function getMediaUrl(url) {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }
  if (url.startsWith('/uploads') && API_BASE.startsWith('http')) {
    try {
      const origin = new URL(API_BASE).origin;
      return `${origin}${url}`;
    } catch {
      return url;
    }
  }
  return url;
}

export async function getDashboardStats() {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return res.json();
}

export async function getProducts({ categoryId, search } = {}) {
  const params = new URLSearchParams();
  if (categoryId) params.append('category_id', categoryId);
  if (search) params.append('search', search);
  params.append('active_only', 'false'); // Admin sees all products (including inactive)

  const res = await fetch(`${API_BASE}/products?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function uploadMedia(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to upload media');
  }
  return res.json();
}

export async function createProduct(payload) {
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to create product');
  }
  return res.json();
}

export async function updateProduct(id, payload) {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to update product');
  }
  return res.json();
}

export async function deleteProduct(id) {
  const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete product');
  return true;
}

export async function getCategories() {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function createCategory(payload) {
  const res = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to create category');
  }
  return res.json();
}

export async function updateCategory(id, payload) {
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to update category');
  }
  return res.json();
}

export async function deleteCategory(id) {
  const res = await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete category');
  return true;
}

export async function getAllOrders(statusFilter) {
  const url = statusFilter
    ? `${API_BASE}/orders?status=${statusFilter}`
    : `${API_BASE}/orders`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export async function updateOrderStatus(
  orderId,
  status,
  notifyCustomer = true,
  customMessage = '',
  paymentStatus = null
) {
  const payload = {
    status,
    notify_customer: notifyCustomer,
    custom_message: customMessage || null,
  };
  if (paymentStatus) {
    payload.payment_status = paymentStatus;
  }

  const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to update status');
  }
  return res.json();
}

export async function checkOrderPayment(orderNumber) {
  const res = await fetch(`${API_BASE}/payment/check/${orderNumber}`);
  if (!res.ok) throw new Error('Failed to check payment status');
  return res.json();
}

export async function getPromoCodes(activeOnly = false) {
  const res = await fetch(`${API_BASE}/promocodes?active_only=${activeOnly}`);
  if (!res.ok) throw new Error('Failed to fetch promo codes');
  return res.json();
}

export async function createPromoCode(payload) {
  const res = await fetch(`${API_BASE}/promocodes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to create promo code');
  }
  return res.json();
}

export async function updatePromoCode(id, payload) {
  const res = await fetch(`${API_BASE}/promocodes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to update promo code');
  }
  return res.json();
}

export async function deletePromoCode(id) {
  const res = await fetch(`${API_BASE}/promocodes/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete promo code');
  return true;
}

export async function getBotInfo() {
  const res = await fetch(`${API_BASE}/bot/info`);
  if (!res.ok) throw new Error('Failed to fetch bot info');
  return res.json();
}

export async function updateBotMenuButton(webAppUrl) {
  const res = await fetch(`${API_BASE}/bot/setup-menu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ web_app_url: webAppUrl || null }),
  });
  if (!res.ok) throw new Error('Failed to update menu button');
  return res.json();
}

export async function sendTestMessage(telegramId, message) {
  const res = await fetch(`${API_BASE}/bot/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegram_id: Number(telegramId), message }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to send message');
  }
  return res.json();
}

// ==================== Loyalty Points & Users CRUD ====================

export async function getUsers(search = '') {
  const url = search ? `${API_BASE}/users?search=${encodeURIComponent(search)}` : `${API_BASE}/users`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch customer loyalty points');
  return res.json();
}

export async function createUser(payload) {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to register customer');
  }
  return res.json();
}

export async function updateUser(id, payload) {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update customer');
  }
  return res.json();
}

export async function adjustUserPoints(id, pointsDelta, reason = '', notifyUser = true) {
  const res = await fetch(`${API_BASE}/users/${id}/points`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      points_delta: Number(pointsDelta),
      reason: reason || 'Admin manual adjustment',
      notify_user: notifyUser,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to adjust points');
  }
  return res.json();
}

export async function resetUserPoints(id) {
  const res = await fetch(`${API_BASE}/users/${id}/points`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to reset points');
  }
  return res.json();
}

export async function deleteUser(id) {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to delete customer');
  }
  return res.json();
}

// ==================== Alert Popups CRUD ====================

export async function getAlerts(activeOnly = false) {
  const res = await fetch(`${API_BASE}/alerts?active_only=${activeOnly}`);
  if (!res.ok) throw new Error('Failed to fetch alert popups');
  return res.json();
}

export async function createAlert(payload) {
  const res = await fetch(`${API_BASE}/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to create alert popup');
  }
  return res.json();
}

export async function updateAlert(id, payload) {
  const res = await fetch(`${API_BASE}/alerts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update alert popup');
  }
  return res.json();
}

export async function deleteAlert(id) {
  const res = await fetch(`${API_BASE}/alerts/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete alert popup');
  return true;
}

// ==================== Store Settings & Branding & Auth ====================

export async function getSettings() {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error('Failed to fetch store settings');
  return res.json();
}

export async function updateSettings(payload) {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update store settings');
  }
  return res.json();
}

export async function adminLogin(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Invalid username or password');
  }
  return res.json();
}

export async function changeAdminPassword(currentPassword, newPassword) {
  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to change password');
  }
  return res.json();
}


