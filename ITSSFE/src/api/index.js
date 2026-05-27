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

  // Step 1: Gán site cho mỗi mặt hàng (1 site / 1 mặt hàng)
  getMerchandiseAssignments: (id) => wrap('get', `/requests/${id}/merchandise-assignments`),
  saveMerchandiseAssignments: (id, assignments) => wrap('post', `/requests/${id}/merchandise-assignments`, assignments),
  // Step 2
  sendInquiries: (id) => wrap('post', `/requests/${id}/send-inquiries`),
  // Step 3
  getInquiryStatus: (id) => wrap('get', `/requests/${id}/inquiry-status`),
  // Step 4
  getInventoryMatrix: (id) => wrap('get', `/requests/${id}/inventory-matrix`),
  // Tạo PO
  createPOBatch: (id, orders) => wrap('post', `/requests/${id}/po-batch`, orders),
};

export const inquiryApi = {
  getAll: () => wrap('get', '/inquiries'),
  getByRequest: (id) => wrap('get', `/inquiries/request/${id}`),
  getPendingForSite: (siteId) => wrap('get', `/inquiries/pending/site/${siteId}`),
  getById: (id) => wrap('get', `/inquiries/${id}`),
  getItems: (id) => wrap('get', `/inquiries/${id}/items`),
  createForRequest: (id) => wrap('post', `/inquiries/request/${id}/create`),
  respond: (id, items) => wrap('post', `/inquiries/${id}/respond`, items),
  getMatrix: (id) => wrap('get', `/inquiries/matrix/${id}`),
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
