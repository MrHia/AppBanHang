import axios from 'axios';

const BASE_URL = 'http://localhost:8081/api';

const getAuthHeader = () => {
  if (typeof window === 'undefined') return {};
  const token = sessionStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const api = axios.create({ baseURL: BASE_URL, headers: { 'Content-Type': 'application/json' } });

api.interceptors.response.use(
  res => {
    // Unwrap ApiResponse wrapper: backend returns {success, message, data}
    // We want the actual data in res.data.data
    if (res.data && typeof res.data === 'object' && 'success' in res.data && 'data' in res.data) {
      return res.data.data;
    }
    return res.data;
  },
  err => {
    if (err.response?.status === 401) {
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(err.response?.data || err.message);
  }
);

/**
 * Normalize axios response into the actual payload.
 *
 * The axios response interceptor above already unwraps the BE's ApiResponse
 * shape ({ success, message, data } -> data) and strips axios's outer { data }
 * envelope, so in practice callers receive the payload directly. This helper
 * is a defensive fallback for consumers that still need to handle either an
 * already-unwrapped value or a raw axios-like envelope without sprinkling
 * `r?.data || r` patterns throughout the codebase.
 *
 * Behaviour:
 *  - null/undefined -> returned as-is
 *  - Arrays -> returned as-is (already a payload)
 *  - Objects shaped like { success, data, ... } -> returns `.data`
 *  - Anything else -> returned as-is
 *
 * @template T
 * @param {T | { data: T, success?: boolean }} res
 * @returns {T}
 */
export const normalizeResponse = (res) => {
  if (res == null) return res;
  // Already unwrapped by interceptor or raw
  if (Array.isArray(res)) return res;
  if (res?.data !== undefined && res?.success !== undefined) return res.data; // ApiResponse-like
  return res;
};

const wrap = (method, path, data, params) => {
  const req = { method, url: path, headers: getAuthHeader() };
  if (data) req.data = data;
  if (params) req.params = params;
  return api(req);
};

export const authApi = {
  login: (email, password) => wrap('post', '/auth/login', { email, password }),
  changePassword: (accountId, oldPassword, newPassword) => wrap('post', `/auth/change-password?accountId=${accountId}&oldPassword=${encodeURIComponent(oldPassword)}&newPassword=${encodeURIComponent(newPassword)}`),
};

export const accountApi = {
  getAll: () => wrap('get', '/accounts'),
  getById: (id) => wrap('get', `/accounts/${id}`),
  create: (data) => wrap('post', '/accounts', data),
  update: (id, data) => wrap('put', `/accounts/${id}`, data),
  delete: (id) => wrap('delete', `/accounts/${id}`),
  lock: (id) => wrap('post', `/accounts/${id}/lock`),
  unlock: (id) => wrap('post', `/accounts/${id}/unlock`),
  resetPassword: (id) => wrap('post', `/accounts/${id}/reset-password`),
};

export const siteApi = {
  getAll: () => wrap('get', '/sites'),
  getById: (id) => wrap('get', `/sites/${id}`),
  create: (data) => wrap('post', '/sites', data),
  update: (id, data) => wrap('put', `/sites/${id}`, data),
  deactivate: (id) => wrap('delete', `/sites/${id}`),
};

export const merchandiseApi = {
  getAll: () => wrap('get', '/merchandise'),
  getById: (id) => wrap('get', `/merchandise/${id}`),
  create: (data) => wrap('post', '/merchandise', data),
  update: (id, data) => wrap('put', `/merchandise/${id}`, data),
  deactivate: (id) => wrap('delete', `/merchandise/${id}`),
};

export const requestApi = {
  getAll: () => wrap('get', '/requests'),
  getById: (id) => wrap('get', `/requests/${id}`),
  getByStatus: (status) => wrap('get', `/requests/status/${status}`),
  getItems: (id) => wrap('get', `/requests/${id}/items`),
  create: (data, createdBy) => wrap('post', `/requests?createdBy=${createdBy}`, data),
  addItem: (id, data) => wrap('post', `/requests/${id}/items`, data),
  removeItem: (id) => wrap('delete', `/requests/items/${id}`),
  submit: (id) => wrap('post', `/requests/${id}/submit`),
  updateStatus: (id, status) => wrap('put', `/requests/${id}/status?status=${encodeURIComponent(status)}`),

  // Step 1: Gán site cho mỗi mặt hàng (1 site / 1 mặt hàng)
  getMerchandiseAssignments: (id) => wrap('get', `/requests/${id}/merchandise-assignments`),
  saveMerchandiseAssignments: (id, assignments) => wrap('post', `/requests/${id}/merchandise-assignments`, assignments),
  // Multi-site: chọn nhiều site / mặt hàng
  getSitePicks: (id) => wrap('get', `/requests/${id}/site-picks`),
  saveSitePicks: (id, picks) => wrap('post', `/requests/${id}/site-picks`, picks),
  // 1-step workflow: trả thẳng (site × method) đúng hẹn + tồn kho cho từng mặt hàng
  getSiteOptions: (id) => wrap('get', `/requests/${id}/site-options`),
  // Step 2: Tạo PO batch
  createPOBatch: (id, orders) => wrap('post', `/requests/${id}/po-batch`, orders),
};

export const poApi = {
  getAll: () => wrap('get', '/po'),
  getBySite: (siteId) => wrap('get', `/po/site/${siteId}`),
  getByRequest: (id) => wrap('get', `/po/request/${id}`),
  getById: (id) => wrap('get', `/po/${id}`),
  getDetails: (id) => wrap('get', `/po/${id}/details`),
  create: (data) => wrap('post', '/po', data),
  createDraft: (data) => wrap('post', '/po/draft', data),
  update: (id, data) => wrap('put', `/po/${id}`, data),
  updateWithItems: (id, data) => wrap('put', `/po/${id}/items`, data),
  send: (id) => wrap('post', `/po/${id}/send`),
  confirm: (id) => wrap('post', `/po/${id}/confirm`),
  reject: (id, reason) => wrap('post', `/po/${id}/reject?reason=${encodeURIComponent(reason || '')}`),
  done: (id) => wrap('post', `/po/${id}/done`),
};

export const warehouseApi = {
  getConfirmedPOs: () => wrap('get', '/warehouse/confirmed-pos'),
  receiveGoods: (poId, receivedBy) => wrap('post', `/warehouse/receive/${poId}?receivedBy=${receivedBy}`),
  getReceiptItems: (id) => wrap('get', `/warehouse/receipt/${id}/items`),
  confirmReceipt: (id, items) => wrap('post', `/warehouse/receipt/${id}/confirm`, items),
  getDiscrepancies: (id) => wrap('get', `/warehouse/receipt/${id}/discrepancies`),
  getAllDiscrepancies: () => wrap('get', '/warehouse/discrepancies'),
  resolveDiscrepancy: (id, notes, resolvedBy) => wrap('post', `/warehouse/discrepancy/${id}/resolve?notes=${encodeURIComponent(notes || '')}&resolvedBy=${resolvedBy}`),
};

export const notificationApi = {
  getByRole: (role) => wrap('get', `/notifications?role=${role}`),
  getUnread: (role) => wrap('get', `/notifications/unread?role=${role}`),
  getUnreadCount: (role) => wrap('get', `/notifications/unread-count?role=${role}`),
  markAsRead: (id) => wrap('post', `/notifications/${id}/read`),
};

export const discrepancyApi = {
  getMessages: (id) => wrap('get', `/discrepancies/${id}/messages`),
  sendMessage: (id, senderType, senderId, message) => wrap('post', `/discrepancies/${id}/messages?senderType=${senderType}&senderId=${senderId}&message=${encodeURIComponent(message)}`),
  getByReceipt: (receiptId) => wrap('get', `/discrepancies/receipt/${receiptId}`),
  getBySite: (siteId) => wrap('get', `/discrepancies/site/${siteId}`),
};

export const siteMerchandiseApi = {
  getAll: () => wrap('get', '/site-merchandise'),
  getBySite: (siteId) => wrap('get', `/site-merchandise/site/${siteId}`),
  getAvailable: (siteId) => wrap('get', `/site-merchandise/site/${siteId}/available`),
  addMerchandise: (siteId, data) => wrap('post', `/site-merchandise/site/${siteId}/add`, data),
  updateStock: (id, stockQuantity) => wrap('put', `/site-merchandise/${id}/stock`, null, { stockQuantity }),
  removeMerchandise: (id) => wrap('delete', `/site-merchandise/${id}`),
};

export const auditApi = {
  getAll: () => wrap('get', '/audit'),
  getByEntity: (type, id) => wrap('get', `/audit/entity?entityType=${type}&entityId=${id}`),
};

export default api;
