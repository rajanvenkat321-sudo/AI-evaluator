/* ===================================================
   auth.js — Session & Role Management
   =================================================== */

const Auth = {
  SESSION_KEY: 'rub_session',
  API_BASE: '/api',

  async login(email, password) {
    try {
      const res = await fetch(`${this.API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!data.ok) return data;
      
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(data.user));
      if (typeof fetchAtlasDataToLocal === 'function') {
        await fetchAtlasDataToLocal();
      }
      return { ok: true, user: data.user };
    } catch (err) {
      console.error(err);
      return { ok: false, error: 'Network error or server down.' };
    }
  },

  logout() {
    sessionStorage.removeItem(this.SESSION_KEY);
    localStorage.clear();
    window.location.href = _rootPath() + 'index.html';
  },

  getSession() {
    try { return JSON.parse(sessionStorage.getItem(this.SESSION_KEY)); }
    catch { return null; }
  },

  isLoggedIn() { return !!this.getSession(); },

  requireRole(role) {
    const s = this.getSession();
    if (!s) { window.location.href = _rootPath() + 'index.html'; return null; }
    if (role && s.role !== role) { window.location.href = _rootPath() + 'index.html'; return null; }
    return s;
  },

  requireAnyRole(...roles) {
    const s = this.getSession();
    if (!s) { window.location.href = _rootPath() + 'index.html'; return null; }
    if (!roles.includes(s.role)) { window.location.href = _rootPath() + 'index.html'; return null; }
    return s;
  },
};

/* ── Path helper ─────────────────────────────────── */
function _rootPath() {
  const path = window.location.pathname.replace(/\\/g, '/');
  if (path.includes('/student/') || path.includes('/teacher/') ||
      path.includes('/admin/')   || path.includes('/evaluation/')) {
    return '../';
  }
  return './';
}

/* ── Toast Notification ──────────────────────────── */
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span></span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(20px)';
    toast.style.transition = '0.3s'; setTimeout(() => toast.remove(), 300); }, duration);
}

/* ── Loading Overlay ─────────────────────────────── */
function showLoading(text = 'Processing…') {
  let el = document.getElementById('loading-overlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'loading-overlay';
    el.className = 'loading-overlay';
    el.innerHTML = `<div class="spinner"></div><p class="loading-text" id="loading-text">${text}</p>`;
    document.body.appendChild(el);
  } else {
    document.getElementById('loading-text').textContent = text;
    el.style.display = 'flex';
  }
}
function updateLoadingText(text) {
  const el = document.getElementById('loading-text');
  if (el) el.textContent = text;
}
function hideLoading() {
  const el = document.getElementById('loading-overlay');
  if (el) el.style.display = 'none';
}

/* ── Modal Helpers ───────────────────────────────── */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}
function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
}
// Close on backdrop click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) closeAllModals();
});

/* ── Sidebar builder ─────────────────────────────── */
function buildSidebar(role, activeItem) {
  const session = Auth.getSession();
  if (!session) return;

  const navs = {
    student: [
      { id: 'dashboard', icon: '', label: 'Dashboard',    href: '../student/index.html#dashboard' },
      { id: 'submit',    icon: '', label: 'Submit Work',  href: '../student/index.html#submit' },
      { id: 'history',   icon: '', label: 'My Submissions', href: '../student/index.html#history' },
      { id: 'results',   icon: '', label: 'My Results',   href: '../student/index.html#results' },
    ],
    teacher: [
      { id: 'dashboard', icon: '', label: 'Dashboard',      href: '../teacher/index.html#dashboard' },
      { id: 'rubrics',   icon: '', label: 'Manage Rubrics', href: '../teacher/index.html#rubrics' },
      { id: 'assignments',icon: '', label: 'Assignments',    href: '../teacher/index.html#assignments' },
      { id: 'reports',   icon: '', label: 'Reports',        href: '../teacher/index.html#reports' },
    ],
    admin: [
      { id: 'dashboard', icon: '', label: 'Dashboard',    href: '../admin/index.html#dashboard' },
      { id: 'users',     icon: '', label: 'Users',        href: '../admin/index.html#users' },
      { id: 'rubrics',   icon: '', label: 'All Rubrics',  href: '../admin/index.html#rubrics' },
      { id: 'activity',  icon: '', label: 'Activity',     href: '../admin/index.html#activity' },
      { id: 'settings',  icon: '',  label: 'Settings',    href: '../admin/index.html#settings' },
    ],
  };

  const roleColors = { student: '#43e97b', teacher: '#6c63ff', admin: '#fc5c7d' };
  const items = navs[role] || [];
  const initials = session.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();

  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <div class="logo-icon">E</div>
      <div class="logo-text">EvalAI<span>Rubric Evaluator</span></div>
    </div>
    <div class="sidebar-section">
      <div class="sidebar-section-label">Navigation</div>
      <nav class="sidebar-nav" id="sidebar-nav">
        ${items.map(n => `
          <a class="nav-item ${n.id === activeItem ? 'active' : ''}" href="${n.href}" data-section="${n.id}">
            <span class="nav-icon">${n.icon}</span>
            <span>${n.label}</span>
          </a>`).join('')}
      </nav>
    </div>
    <div style="flex:1"></div>
    <div class="sidebar-footer">
      <div class="user-card">
        <div class="avatar" style="background: linear-gradient(135deg, ${roleColors[role]}, #6c63ff);">${initials}</div>
        <div class="user-info">
          <div class="user-name">${session.name}</div>
          <div class="user-role" style="color:${roleColors[role]}">${role}</div>
        </div>
        <button onclick="Auth.logout()" title="Logout" style="background:none;border:none;color:var(--text-muted);font-size:.9rem;font-weight:bold;cursor:pointer;margin-left:4px;" title="Logout">Logout</button>
      </div>
    </div>
  `;

  // SPA-style section switching
  document.querySelectorAll('#sidebar-nav .nav-item').forEach(link => {
    link.addEventListener('click', e => {
      const section = link.dataset.section;
      if (section && typeof showSection === 'function') {
        e.preventDefault();
        showSection(section);
        document.querySelectorAll('#sidebar-nav .nav-item').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('open');
      }
    });
  });
}

/* ── Header builder ── */
function buildHeader(title, actions = '') {
  const header = document.getElementById('top-header');
  if (!header) return;
  header.innerHTML = `
    <button class="menu-btn" onclick="document.getElementById('sidebar').classList.toggle('open')">☰</button>
    <div class="header-title">${title}</div>
    <div class="header-actions">${actions}</div>
  `;
}

/* ── Confirm dialog ── */
function confirmDialog(message, onConfirm) {
  if (window.confirm(message)) onConfirm();
}
