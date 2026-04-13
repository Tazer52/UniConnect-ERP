// frontend/api.js
// All fetch() calls to the Express backend live here.

const API_BASE = 'http://localhost:3000/api';

// ── TOKEN HELPERS ────────────────────────────────────────────
function getToken()        { return localStorage.getItem('uc_token'); }
function saveToken(token)  { localStorage.setItem('uc_token', token); }
function clearToken()      { localStorage.removeItem('uc_token'); localStorage.removeItem('uc_user'); }
function getUser()         { return JSON.parse(localStorage.getItem('uc_user') || 'null'); }
function saveUser(user)    { localStorage.setItem('uc_user', JSON.stringify(user)); }

// ── BASE FETCH WRAPPER ───────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) }
  });

  const data = await response.json();

  if (!response.ok) {
    // If 401, token expired – redirect to login
    if (response.status === 401) {
      clearToken();
      window.location.reload();
    }
    throw new Error(data.error || 'API error');
  }

  return data;
}

// ── FILE UPLOAD WRAPPER ──────────────────────────────────────
async function apiUpload(endpoint, formData) {
  const token = getToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
      window.location.reload();
    }
    throw new Error(data.error || 'API error');
  }

  return data;
}

// ── AUTH ─────────────────────────────────────────────────────
const Auth = {
  async login(email, password) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    saveToken(data.token);
    saveUser(data.user);
    return data;
  },
  logout() {
    clearToken();
    window.location.reload();
  },
  getUser,
  isLoggedIn: () => !!getToken()
};

// ── STUDENTS ─────────────────────────────────────────────────
const Students = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/students${q ? '?' + q : ''}`);
  },
  getById:    (id) => apiFetch(`/students/${id}`),
  create:     (data) => apiFetch('/students', { method: 'POST', body: JSON.stringify(data) }),
  update:     (id, data) => apiFetch(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getGrades:  (id) => apiFetch(`/students/${id}/grades`),
  getCourses: (id) => apiFetch(`/students/${id}/courses`),
  enroll:     (id, course_ids) => apiFetch(`/students/${id}/enroll`, { method: 'POST', body: JSON.stringify({ course_ids }) }),
  getSubmissions: (id) => apiFetch(`/students/${id}/submissions`)
};

// ── COURSES ──────────────────────────────────────────────────
const Courses = {
  getAll:        (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/courses${q ? '?' + q : ''}`);
  },
  getById:       (id) => apiFetch(`/courses/${id}`),
  create:        (data) => apiFetch('/courses', { method: 'POST', body: JSON.stringify(data) }),
  update:        (id, data) => apiFetch(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getStudents:   (id) => apiFetch(`/courses/${id}/students`),
  getAssignments:(id) => apiFetch(`/courses/${id}/assignments`),
  submitAssignment: (assignmentId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiUpload(`/courses/assignments/${assignmentId}/submit`, formData);
  },
  getSubmissions: (courseId, assignmentId) => apiFetch(`/courses/${courseId}/assignments/${assignmentId}/submissions`),
  gradeSubmission: (submissionId, data) => apiFetch(`/courses/submissions/${submissionId}/grade`, { method: 'POST', body: JSON.stringify(data) })
};

// ── FACULTY ──────────────────────────────────────────────────
const Faculty = {
  getAll:       () => apiFetch('/faculty'),
  getCourses:   (id) => apiFetch(`/faculty/${id}/courses`),
  getStudents:  (id) => apiFetch(`/faculty/${id}/students`),
  submitGrades: (id, course_id, grades) =>
    apiFetch(`/faculty/${id}/grades`, { method: 'POST', body: JSON.stringify({ course_id, grades }) })
};

// ── REPORTS ──────────────────────────────────────────────────
const Reports = {
  getTranscript:    (studentId) => apiFetch(`/reports/transcript/${studentId}`),
  getEnrollment:    () => apiFetch('/reports/enrollment'),
  getGPA:           (studentId) => apiFetch(`/reports/gpa/${studentId}`)
};
