/* ═══════════════════════════════════════════════════
   ABSOLUTION — Auth v4
   Hiérarchie : super_admin / admin / admin_wow / admin_swtor / membre
   Grades jeu  : visiteur / recrue / membre / officier / gm
═══════════════════════════════════════════════════ */
const SB  = window.SB_URL;
const KEY = window.SB_KEY;

/* ── Hiérarchie des grades globaux ── */
const GLOBAL_ROLES = ['membre', 'admin_swtor', 'admin_wow', 'admin', 'super_admin'];

/* ── Labels affichés sur le site ── */
const GLOBAL_LABEL = {
  super_admin: 'Super Admin',
  admin:       'Admin',
  admin_wow:   'Admin WoW',
  admin_swtor: 'Admin SWTOR',
  membre:      'Membre'
};

/* ── Couleurs des badges ── */
const GLOBAL_COLOR = {
  super_admin: '#F0C040',
  admin:       '#A855F7',
  admin_wow:   '#3B82F6',
  admin_swtor: '#EF4444',
  membre:      '#4AE08A'
};

/* ── Grades par jeu (purement visuels) ── */
const GAME_GRADES  = ['visiteur', 'recrue', 'roster', 'membre', 'officier', 'gm'];
const GAME_LABEL   = {
  visiteur: 'Visiteur',
  recrue:   'Recrue',
  roster:   'Roster',
  membre:   'Membre',
  officier: 'Officier',
  gm:       'GM'
};

let _user = null, _profile = null;

/* ── Helpers de rôle ── */
function hasGlobalRole(minRole) {
  if (!_profile) return false;
  const userIdx = GLOBAL_ROLES.indexOf(_profile.role_global);
  const minIdx  = GLOBAL_ROLES.indexOf(minRole);
  return userIdx >= minIdx;
}

function isSuperAdmin()  { return _profile?.role_global === 'super_admin'; }
function isAdmin()       { return hasGlobalRole('admin'); }
function isAdminWow()    { return hasGlobalRole('admin_wow'); }
function isAdminSwtor()  { return hasGlobalRole('admin_swtor'); }
function isStaff()       { return hasGlobalRole('admin_swtor'); } // tout grade admin et au-dessus

function canManageWow()  {
  return isSuperAdmin() || isAdmin() || _profile?.role_global === 'admin_wow';
}
function canManageSwtor() {
  return isSuperAdmin() || isAdmin() || _profile?.role_global === 'admin_swtor';
}

/* ── Accès calendrier selon grade jeu ── */
function hasWowAccess() {
  return GAME_GRADES.indexOf(_profile?.role_wow) >= GAME_GRADES.indexOf('recrue');
}
function hasSwtorAccess() {
  return GAME_GRADES.indexOf(_profile?.role_swtor) >= GAME_GRADES.indexOf('recrue');
}
function hasAnyGameAccess() {
  return hasWowAccess() || hasSwtorAccess();
}

/* ── Supabase client léger ── */
const sb = {
  tok()  { try { return JSON.parse(localStorage.getItem('abs_sess'))?.access_token || null; } catch { return null; } },
  sess() { try { return JSON.parse(localStorage.getItem('abs_sess')); } catch { return null; } },
  save(s){ s ? localStorage.setItem('abs_sess', JSON.stringify(s)) : localStorage.removeItem('abs_sess'); },
  uid(tok) {
    try { return JSON.parse(atob((tok || this.tok()).split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).sub; }
    catch { return null; }
  },
  async req(path, opts = {}) {
    const r = await fetch(SB + path, {
      headers: {
        'apikey': KEY,
        'Authorization': 'Bearer ' + (this.tok() || KEY),
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...opts.headers
      },
      ...opts
    });
    const t = await r.text();
    return { ok: r.ok, status: r.status, data: t ? JSON.parse(t) : {} };
  },
  async signIn(email, pass) {
    const r = await this.req('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass })
    });
    if (!r.ok) return { error: r.data?.message || 'Identifiants incorrects' };
    this.save(r.data);
    return { data: r.data };
  },
  async signUp(email, pass, username, discord) {
    const r = await this.req('/auth/v1/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass, data: { username } })
    });
    if (!r.ok) return { error: r.status === 422 ? 'User already registered' : (r.data?.message || 'Erreur') };
    if (r.data.session) {
      this.save(r.data.session);
      await this.req('/rest/v1/profiles', {
        method: 'POST',
        headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          id: r.data.user.id,
          username,
          discord_pseudo: discord || null,
          role_global: 'membre',
          role_wow:    'visiteur',
          role_swtor:  'visiteur'
        })
      });
      return { data: r.data, needsConfirm: false };
    }
    const r2 = await this.req('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass })
    });
    if (r2.ok && r2.data.access_token) {
      this.save(r2.data);
      const uid = this.uid(r2.data.access_token);
      await this.req('/rest/v1/profiles', {
        method: 'POST',
        headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          id: uid,
          username,
          discord_pseudo: discord || null,
          role_global: 'membre',
          role_wow:    'visiteur',
          role_swtor:  'visiteur'
        })
      });
      return { data: { ...r.data, session: r2.data }, needsConfirm: false };
    }
    return { data: r.data, needsConfirm: true };
  },
  async signOut() {
    try { await this.req('/auth/v1/logout', { method: 'POST' }); } catch {}
    this.save(null);
    _user = null; _profile = null;
    renderNav();
  },
  async profile(uid) {
    const r = await this.req(`/rest/v1/profiles?id=eq.${uid}&select=*`);
    return r.ok && Array.isArray(r.data) ? r.data[0] || null : null;
  },
  async refresh() {
    const s = this.sess();
    if (!s?.refresh_token) return null;
    const r = await this.req('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: s.refresh_token })
    });
    if (r.ok) { this.save(r.data); return r.data; }
    this.save(null); return null;
  }
};

/* ── Navigation ── */
function renderNav() {
  const z = document.getElementById('nav-auth-zone');

  /* Même sans nav-auth-zone (ex: page admin), on appelle onAuthReady */
  if (!z) {
    _applyCalendarNavVisibility();
    if (typeof onAuthReady === 'function') onAuthReady(_user, _profile);
    return;
  }

  if (!_user || !_profile) {
    z.innerHTML = `
      <button class="nav-auth-btn" onclick="openAuth('login')">Connexion</button>
      <button class="nav-auth-btn primary" onclick="openAuth('register')">S'inscrire</button>`;
  } else {
    const role  = _profile.role_global || 'membre';
    const name  = _profile.username || 'Membre';
    const color = GLOBAL_COLOR[role] || '#4AE08A';
    const label = GLOBAL_LABEL[role] || role;

    z.innerHTML = `
      <span class="nav-user-label">
        <span class="nav-user-dot" style="background:${color}"></span>
        ${name}
        <span class="nav-role-badge">${label}</span>
      </span>
      <a href="profil.html" class="nav-auth-btn">Mon profil</a>
      ${isStaff() ? `<a href="admin.html" class="nav-auth-btn admin-btn">⚙ Admin</a>` : ''}
      <button class="nav-auth-btn" onclick="sb.signOut()">Déconnexion</button>`;
  }

  /* ── Visibilité du lien Calendrier dans la nav ── */
  _applyCalendarNavVisibility();

  if (typeof onAuthReady === 'function') onAuthReady(_user, _profile);
}

function _applyCalendarNavVisibility() {
  /* Cherche tous les liens vers calendrier.html dans la nav et le menu mobile */
  document.querySelectorAll('a[href="calendrier.html"], a[id="nl-calendrier"]').forEach(function(el) {
    const li = el.closest('li') || el;
    if (!_profile || !hasAnyGameAccess()) {
      li.style.display = 'none';
    } else {
      li.style.display = '';
    }
  });
}

/* ── Auth modal ── */
function openAuth(tab)  { document.getElementById('auth-modal')?.classList.add('open'); switchTab(tab); }
function closeAuth()    { document.getElementById('auth-modal')?.classList.remove('open'); clearErr(); }
function switchTab(t)   {
  ['login', 'register'].forEach(x => {
    document.getElementById('tab-' + x)?.classList.toggle('active', x === t);
    document.getElementById('form-' + x)?.classList.toggle('active', x === t);
  });
}
function setErr(msg)  { document.querySelectorAll('.auth-error').forEach(e => { e.textContent = msg; e.style.display = msg ? 'block' : 'none'; }); }
function clearErr()   { setErr(''); }
function xlErr(e)     {
  const m = (typeof e === 'string' ? e : e?.message || '').toLowerCase();
  if (m.includes('invalid') || m.includes('credentials')) return 'Email ou mot de passe incorrect.';
  if (m.includes('already'))   return 'Cet email est déjà utilisé.';
  if (m.includes('confirmed')) return 'Confirmez votre email d\'abord.';
  return 'Une erreur est survenue.';
}

/* ── Connexion ── */
async function doLogin() {
  const email = document.getElementById('login-email')?.value?.trim();
  const pass  = document.getElementById('login-password')?.value;
  if (!email || !pass) { setErr('Remplissez tous les champs.'); return; }
  const btn = document.getElementById('btn-login');
  if (btn) { btn.disabled = true; btn.textContent = '...'; }
  clearErr();
  const r = await sb.signIn(email, pass);
  if (btn) { btn.disabled = false; btn.textContent = 'Se connecter'; }
  if (r.error) { setErr(xlErr(r.error)); return; }
  _user = { id: sb.uid(r.data.access_token) };
  sb.save(r.data);
  _profile = await sb.profile(_user.id);
  if (!_profile) {
    try {
      const pay = JSON.parse(atob(r.data.access_token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
      const username = sessionStorage.getItem('abs_pending_username') || (pay.email || '').split('@')[0] || 'Membre';
      const discord  = sessionStorage.getItem('abs_pending_discord') || null;
      sessionStorage.removeItem('abs_pending_username');
      sessionStorage.removeItem('abs_pending_discord');
      await fetch(SB + '/rest/v1/profiles', {
        method: 'POST',
        headers: { 'apikey': KEY, 'Authorization': 'Bearer ' + r.data.access_token, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ id: _user.id, username, discord_pseudo: discord, role_global: 'membre', role_wow: 'visiteur', role_swtor: 'visiteur' })
      });
    } catch(e) { console.error('Erreur création profil:', e); }
    _profile = await sb.profile(_user.id);
  }
  renderNav();
  closeAuth();
}

/* ── Inscription ── */
async function doRegister() {
  const username = document.getElementById('reg-username')?.value?.trim();
  const discord  = document.getElementById('reg-discord')?.value?.trim();
  const email    = document.getElementById('reg-email')?.value?.trim();
  const pass     = document.getElementById('reg-password')?.value;
  const pass2    = document.getElementById('reg-password2')?.value;
  if (!username || !email || !pass)  { setErr('Remplissez tous les champs.'); return; }
  if (pass !== pass2)                { setErr('Les mots de passe ne correspondent pas.'); return; }
  if (pass.length < 6)               { setErr('Mot de passe trop court (6 min.).'); return; }
  const btn = document.getElementById('btn-register');
  if (btn) { btn.disabled = true; btn.textContent = '...'; }
  clearErr();
  sessionStorage.setItem('abs_pending_username', username);
  sessionStorage.setItem('abs_pending_discord',  discord || '');
  const r = await sb.signUp(email, pass, username, discord);
  if (btn) { btn.disabled = false; btn.textContent = "S'inscrire"; }
  if (r.error)       { setErr(xlErr(r.error)); return; }
  if (r.needsConfirm){ setErr('Compte créé — vérifiez votre email.'); return; }
  _user    = { id: sb.uid(r.data.session?.access_token) };
  _profile = await sb.profile(_user.id);
  renderNav();
  closeAuth();
}

/* ── Initialisation au chargement ── */
async function initAuth() {
  const sess = sb.sess();
  if (!sess?.access_token) { renderNav(); return; }
  try {
    const parts = sess.access_token.split('.');
    const pay   = JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/')));
    if (pay.exp < Date.now() / 1000) {
      const ns = await sb.refresh();
      if (!ns) throw new Error('Session expirée');
    }
    _user    = { id: pay.sub };
    _profile = await sb.profile(pay.sub);
    if (!_profile) {
      const username = sessionStorage.getItem('abs_pending_username') || pay.email?.split('@')[0] || 'Membre';
      const discord  = sessionStorage.getItem('abs_pending_discord') || null;
      sessionStorage.removeItem('abs_pending_username');
      sessionStorage.removeItem('abs_pending_discord');
      await sb.req('/rest/v1/profiles', {
        method: 'POST',
        headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify({ id: pay.sub, username, discord_pseudo: discord, role_global: 'membre', role_wow: 'visiteur', role_swtor: 'visiteur' })
      });
      _profile = await sb.profile(pay.sub);
    }
  } catch { sb.save(null); }
  renderNav();
}

/* ── Guard : protéger une page entière ── */
function requireGameAccess(redirectUrl) {
  redirectUrl = redirectUrl || 'index.html';
  if (!_profile) {
    /* Attendre que le profil soit chargé */
    const orig = window.onAuthReady;
    window.onAuthReady = function(u, p) {
      if (orig) orig(u, p);
      if (!p || !hasAnyGameAccess()) window.location.href = redirectUrl;
    };
  } else if (!hasAnyGameAccess()) {
    window.location.href = redirectUrl;
  }
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', initAuth)
  : initAuth();
