import api from '../config/apiConfig';

// Export API endpoints as named exports
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.get('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh')
};

export const paymentsAPI = {
  getPayments: (params) => api.get('/payments', { params }),
  getPayment: (id) => api.get(`/payments/${id}`),
  createPayment: (data) => api.post('/payments', data),
  updatePayment: (id, data) => api.put(`/payments/${id}`, data),
  deletePayment: (id) => api.delete(`/payments/${id}`)
};

export const campaignsAPI = {
  getCampaigns: (params) => api.get('/campaigns', { params }),
  getCampaign: (id) => api.get(`/campaigns/${id}`),
  createCampaign: (data) => api.post('/campaigns', data),
  updateCampaign: (id, data) => api.put(`/campaigns/${id}`, data),
  deleteCampaign: (id) => api.delete(`/campaigns/${id}`),
  exportCampaigns: (params) => api.get('/campaigns/export', {
    params,
    responseType: 'blob'
  }),
};


export const contactsAPI = {
  getContacts: (params) => api.get('/contacts', { params }),
  getContact: (id) => api.get(`/contacts/${id}`),
  createContact: (data) => api.post('/contacts', data),
  updateContact: (id, data) => api.put(`/contacts/${id}`, data),
  deleteContact: (id) => api.delete(`/contacts/${id}`),
  exportContacts: (params) => api.get('/contacts/export', { 
    params,
    responseType: 'blob'
  }),
};

export const organizationsAPI = {
  getOrganizations: (params) => api.get('/organizations', { params }),
  getOrganization: (id) => api.get(`/organizations/${id}`),
  createOrganization: (data) => api.post('/organizations', data),
  updateOrganization: (id, data) => api.put(`/organizations/${id}`, data),
  deleteOrganization: (id) => api.delete(`/organizations/${id}`),
  exportOrganizations: (params) => api.get('/organizations/export', {
    params,
    responseType: 'blob'
  }),
};

export const donationsAPI = {
  getDonations: (params) => api.get('/donations', { params }),
  getDonation: (id) => api.get(`/donations/${id}`),
  createDonation: (data) => api.post('/donations', data),
  updateDonation: (id, data) => api.put(`/donations/${id}`, data),
  deleteDonation: (id) => api.delete(`/donations/${id}`),
  getMonthlyDonationStatus: () => api.get('/donations/monthly/status'),
  updateSubscriptionStatus: (id, data) => api.put(`/donations/${id}/subscription`, data),
  exportDonations: (params) => api.get('/donations/export', { 
    params,
    responseType: 'blob' 
  }),
};

export const usersAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

export const agenciesAPI = {
  getAgencies: (params) => api.get('/agencies', { params }),
  getAgency: (id) => api.get(`/agencies/${id}`),
  createAgency: (data) => api.post('/agencies', data),
  updateAgency: (id, data) => api.put(`/agencies/${id}`, data),
  deleteAgency: (id) => api.delete(`/agencies/${id}`),
  exportAgencies: (params) => api.get('/agencies/export', {
    params,
    responseType: 'blob'
  }),
};

export const channelsAPI = {
  getChannels: (params) => api.get('/channels', { params }),
  getChannel: (id) => api.get(`/channels/${id}`),
  createChannel: (data) => api.post('/channels', data),
  updateChannel: (id, data) => api.put(`/channels/${id}`, data),
  deleteChannel: (id) => api.delete(`/channels/${id}`),
  exportChannels: (params) => api.get('/channels/export', {
    params,
    responseType: 'blob'
  }),
};

export const receiptsAPI = {
  getReceipts: (params) => api.get('/receipts', { params }),
  generateReceipts: (data) => api.post('/receipts/generate', data),
  exportReceipts: (params) => api.get('/receipts/export', {
    params,
    responseType: 'blob'
  }),
};

export const journeysAPI = {
  getJourneys: (params) => api.get('/journeys', { params }),
  getJourneyRuns: (id) => api.get(`/journeys/${id}/runs`),
  createJourney: (data) => api.post('/journeys', data),
  updateJourney: (id, data) => api.put(`/journeys/${id}`, data),
  deleteJourney: (id) => api.delete(`/journeys/${id}`),
  activateJourney: (id) => api.post(`/journeys/${id}/activate`),
  deactivateJourney: (id) => api.post(`/journeys/${id}/deactivate`),
  enrollContacts: (id, data) => api.post(`/journeys/${id}/enroll`, data),
};

export const reportsAPI = {
  getReports: (params) => api.get('/reports', { params }),
  getReport: (id) => api.get(`/reports/${id}`),
  createReport: (data) => api.post('/reports', data),
  updateReport: (id, data) => api.put(`/reports/${id}`, data),
  deleteReport: (id) => api.delete(`/reports/${id}`),
  runReport: (id, overrides) => api.post(`/reports/${id}/run`, overrides || {}),
  exportReport: (id, params) => api.get(`/reports/${id}/export`, { params, responseType: 'blob' }),
};

export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
  resetSettings: () => api.post('/settings/reset'),
};

// Export the API instance as default
export default api;

// Export API base URL for other parts of the app
export { API_BASE_URL };
