const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('campus_os_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'API request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch (e) {
      errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email_or_roll, password, portal) => 
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email_or_roll, password, portal })
    }),
  
  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

  getMe: () => request('/auth/me'),

  updateLanguage: (language) =>
    request(`/auth/language?language=${language}`, { method: 'PUT' }),

  // Student
  getStudentDashboard: () => request('/student/dashboard'),
  getStudentComplaints: () => request('/student/complaints'),
  createComplaint: (data) =>
    request('/student/complaints', { method: 'POST', body: JSON.stringify(data) }),
  getGatePasses: () => request('/student/requests/gatepass'),
  createGatePass: (data) =>
    request('/student/requests/gatepass', { method: 'POST', body: JSON.stringify(data) }),
  getCertificates: () => request('/student/requests/certificates'),
  createCertificate: (data) =>
    request('/student/requests/certificates', { method: 'POST', body: JSON.stringify(data) }),
  getSchedule: () => request('/student/schedule'),
  getNotices: () => request('/student/notices'),
  markNoticeRead: (id) => request(`/student/notices/${id}/read`, { method: 'POST' }),

  // Staff
  getStaffDashboard: () => request('/staff/dashboard'),
  getStaffTickets: () => request('/staff/tickets'),
  updateTicketStatus: (id, status, note, assigned_to) =>
    request(`/staff/tickets/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note, assigned_to })
    }),
  markAttendance: (data) =>
    request('/staff/attendance/mark', { method: 'POST', body: JSON.stringify(data) }),
  getStaffStudents: () => request('/staff/students'),
  getStaffGatePassQueue: () => request('/staff/gatepass/queue'),
  actOnGatePass: (id, action, note) =>
    request(`/staff/gatepass/${id}/action`, {
      method: 'POST',
      body: JSON.stringify({ action, note })
    }),

  // Admin
  getAdminAnalytics: () => request('/admin/dashboard/analytics'),
  mergeIncidents: (data) =>
    request('/admin/incidents/merge', { method: 'POST', body: JSON.stringify(data) }),
  getIncidents: () => request('/admin/incidents'),
  composeNotice: (data) =>
    request('/admin/notices', { method: 'POST', body: JSON.stringify(data) }),
  getNoticesAnalytics: () => request('/admin/notices/analytics'),
  triggerNoticeReminder: (id) => request(`/admin/notices/${id}/trigger-auto-reminder`, { method: 'POST' }),
  triggerNoticeSmsFallback: (id) => request(`/admin/notices/${id}/trigger-sms-fallback`, { method: 'POST' }),
  getAdminCertificates: () => request('/admin/certificates'),
  updateCertificateStatus: (id, status) =>
    request(`/admin/certificates/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),

  // Mess
  getMessHalls: () => request('/mess/halls'),
  addMenuItem: (data) => request('/mess/menu-items', { method: 'POST', body: JSON.stringify(data) }),
  submitMessFeedback: (data) => request('/mess/feedback', { method: 'POST', body: JSON.stringify(data) }),
  getMessAnalytics: () => request('/mess/analytics'),

  // Voice
  processVoiceTranscript: (transcript, page_context, language) =>
    request('/voice/process', {
      method: 'POST',
      body: JSON.stringify({ transcript, page_context, language })
    }),
  getVoiceStatus: () => request('/voice/status'),

  // Map & 3D
  getCurrentMap: () => request('/map/current'),
  getNavigationRoute: (start, destination) =>
    request(`/map/navigation-route?start=${encodeURIComponent(start)}&destination=${encodeURIComponent(destination)}`),
  addMapPin: (data) => request('/map/pins', { method: 'POST', body: JSON.stringify(data) }),
  deleteMapPin: (id) => request(`/map/pins/${id}`, { method: 'DELETE' }),

  // Ask Campus
  queryAskCampus: (query, context) =>
    request('/ask/query', {
      method: 'POST',
      body: JSON.stringify({ query, context })
    }),
  getAskHistory: () => request('/ask/history'),

  // SMS Simulator (Section 10)
  sendSmsWebhook: (sender_phone, message) =>
    request('/sms-webhook', {
      method: 'POST',
      body: JSON.stringify({ sender_phone, message })
    })
};
