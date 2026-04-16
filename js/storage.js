/* ===================================================
   storage.js — Local-First MongoDB Adapter
   =================================================== */

const DB = {
  USERS:       'rub_users',
  RUBRICS:     'rub_rubrics',
  SUBMISSIONS: 'rub_submissions',
  RESULTS:     'rub_results',
  ASSIGNMENTS: 'rub_assignments',
};

const API_BASE = '/api';

/* ── Helpers ──────────────────────────────────────── */
function _get(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
}
function _set(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function now() { return new Date().toISOString(); }

/* ── API Sync Helpers ──────────────────────────────── */
function syncCreate(endpoint, data) {
  fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).catch(e => console.error('Sync error:', e));
}

function syncUpdate(endpoint, data) {
  fetch(`${API_BASE}${endpoint}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).catch(e => console.error('Sync error:', e));
}

function syncDelete(endpoint) {
  fetch(`${API_BASE}${endpoint}`, { method: 'DELETE' }).catch(e => console.error('Sync error:', e));
}

// Global function to pull everything from Atlas on login
async function fetchAtlasDataToLocal() {
  try {
    const urls = ['/users', '/rubrics', '/assignments', '/submissions', '/results'];
    const gets = urls.map(u => fetch(`${API_BASE}${u}`).then(r => r.json()));
    const [u, r, a, s, res] = await Promise.all(gets);
    _set(DB.USERS, u || []);
    _set(DB.RUBRICS, r || []);
    _set(DB.ASSIGNMENTS, a || []);
    _set(DB.SUBMISSIONS, s || []);
    _set(DB.RESULTS, res || []);
    console.log('Atlas data synced to local.');
  } catch (err) {
    console.error('Failed to sync Atlas data:', err);
  }
}

/* ── User CRUD ─────────────────────────────────────── */
const Users = {
  all: ()       => _get(DB.USERS),
  get: (id)     => _get(DB.USERS).find(u => u.id === id),
  findByEmail:  (email) => _get(DB.USERS).find(u => u.email.toLowerCase() === email.toLowerCase()),
  add: (user)   => { const u = { ...user, id: uid(), createdAt: now() }; const all = _get(DB.USERS); all.push(u); _set(DB.USERS, all); syncCreate('/users', u); return u; },
  update: (id, data) => {
    const all = _get(DB.USERS).map(u => u.id === id ? { ...u, ...data } : u); _set(DB.USERS, all); syncUpdate(`/users/${id}`, data);
  },
  delete: (id)  => { _set(DB.USERS, _get(DB.USERS).filter(u => u.id !== id)); syncDelete(`/users/${id}`); },
  count: ()     => _get(DB.USERS).length,
  byRole: (role)=> _get(DB.USERS).filter(u => u.role === role),
};

/* ── Rubric CRUD ───────────────────────────────────── */
const Rubrics = {
  all: ()       => _get(DB.RUBRICS),
  get: (id)     => _get(DB.RUBRICS).find(r => r.id === id),
  byTeacher: (tid) => _get(DB.RUBRICS).filter(r => r.teacherId === tid),
  add: (rub)    => { const r = { ...rub, id: uid(), createdAt: now() }; const all = _get(DB.RUBRICS); all.push(r); _set(DB.RUBRICS, all); syncCreate('/rubrics', r); return r; },
  update: (id, data) => { const all = _get(DB.RUBRICS).map(r => r.id === id ? { ...r, ...data } : r); _set(DB.RUBRICS, all); syncUpdate(`/rubrics/${id}`, data); },
  delete: (id)  => { _set(DB.RUBRICS, _get(DB.RUBRICS).filter(r => r.id !== id)); syncDelete(`/rubrics/${id}`); },
  count: ()     => _get(DB.RUBRICS).length,
};

/* ── Assignment CRUD ───────────────────────────────── */
const Assignments = {
  all: ()       => _get(DB.ASSIGNMENTS),
  get: (id)     => _get(DB.ASSIGNMENTS).find(a => a.id === id),
  byTeacher: (tid)  => _get(DB.ASSIGNMENTS).filter(a => a.teacherId === tid),
  byStudent: (sid)  => _get(DB.ASSIGNMENTS),
  add: (asgn)   => { const a = { ...asgn, id: uid(), createdAt: now() }; const all = _get(DB.ASSIGNMENTS); all.push(a); _set(DB.ASSIGNMENTS, all); syncCreate('/assignments', a); return a; },
  update: (id, data) => { const all = _get(DB.ASSIGNMENTS).map(a => a.id === id ? { ...a, ...data } : a); _set(DB.ASSIGNMENTS, all); syncUpdate(`/assignments/${id}`, data); },
  delete: (id)  => { _set(DB.ASSIGNMENTS, _get(DB.ASSIGNMENTS).filter(a => a.id !== id)); syncDelete(`/assignments/${id}`); },
};

/* ── Submission CRUD ───────────────────────────────── */
const Submissions = {
  all: ()       => _get(DB.SUBMISSIONS),
  get: (id)     => _get(DB.SUBMISSIONS).find(s => s.id === id),
  byStudent: (sid) => _get(DB.SUBMISSIONS).filter(s => s.studentId === sid),
  byAssignment: (aid) => _get(DB.SUBMISSIONS).filter(s => s.assignmentId === aid),
  byStudentAndAssignment: (sid, aid) => _get(DB.SUBMISSIONS).find(s => s.studentId === sid && s.assignmentId === aid),
  add: (sub)    => { const s = { ...sub, id: uid(), submittedAt: now(), status: 'pending' }; const all = _get(DB.SUBMISSIONS); all.push(s); _set(DB.SUBMISSIONS, all); syncCreate('/submissions', s); return s; },
  update: (id, data) => { const all = _get(DB.SUBMISSIONS).map(s => s.id === id ? { ...s, ...data } : s); _set(DB.SUBMISSIONS, all); syncUpdate(`/submissions/${id}`, data); },
  count: ()     => _get(DB.SUBMISSIONS).length,
};

/* ── Results CRUD ──────────────────────────────────── */
const Results = {
  all: ()       => _get(DB.RESULTS),
  get: (id)     => _get(DB.RESULTS).find(r => r.id === id),
  bySubmission: (sid) => _get(DB.RESULTS).find(r => r.submissionId === sid),
  byStudent: (sid)    => _get(DB.RESULTS).filter(r => r.studentId === sid),
  add: (res)    => { const r = { ...res, id: uid(), evaluatedAt: now() }; const all = _get(DB.RESULTS); all.push(r); _set(DB.RESULTS, all); syncCreate('/results', r); return r; },
  count: ()     => _get(DB.RESULTS).length,
};

/* ── Settings (Local Engine) ───────────────────────── */
const Settings = {
  getEngine: () => 'atlas',
  engineLabel: () => 'MongoDB Atlas (Local Syncing)',
};

/* ── Date Helpers ──────────────────────────────────── */
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function scoreColor(pct) { return pct >= 80 ? 'var(--accent-success)' : pct >= 60 ? 'var(--accent-warn)' : 'var(--accent-danger)'; }
function scoreBadge(pct) { return pct >= 80 ? 'badge-green' : pct >= 60 ? 'badge-yellow' : 'badge-red'; }
function gradeLabel(pct) { return pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F'; }
