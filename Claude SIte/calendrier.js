/* ═══════════════════════════════════════════════════
   ABSOLUTION — Calendrier JS v4
   Vue mensuelle + inscrits classés par rôle
═══════════════════════════════════════════════════ */
var CAL_SB  = window.SB_URL;
var CAL_KEY = window.SB_KEY;

var _uid       = null;
var _curGame   = 'wow';
var _curView   = 'month';
var _monthDate = null; // 1er du mois affiché
var _events    = [];
var _signups   = {};
var _mySignups = {};

var DAYS_FR   = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
var MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
var TYPE_LBL  = { raid:'Raid', mythic:'Mythic+', pvp:'PvP', social:'Social', autre:'Évènement' };

var ROLE_CONFIG = {
  tank:  { label:'Tank',  icon:'🔷', color:'#48B8F0', border:'rgba(72,184,240,0.4)'  },
  heal:  { label:'Heal',  icon:'💚', color:'#4AE08A', border:'rgba(74,224,138,0.4)'  },
  dps:   { label:'DPS',   icon:'⚔️', color:'#FF3A3A', border:'rgba(255,58,58,0.4)'   },
  other: { label:'Autre', icon:'',   color:'#6A82A0', border:'rgba(106,130,160,0.4)' }
};

/* ── Utilitaires ─────────────────────────────────── */
function tok() {
  try { return JSON.parse(localStorage.getItem('abs_sess')).access_token; }
  catch(e) { return CAL_KEY; }
}
function g(id) { return document.getElementById(id); }

function fmtTime(d) {
  return new Date(d).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
}
function fmtDayMonth(d) {
  var dt = new Date(d);
  return dt.getDate() + ' ' + MONTHS_FR[dt.getMonth()];
}
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

function getRoleForSignup(s) {
  if (!s.profiles) return 'other';
  // wow_role / swtor_role : champs définis dans l'admin membres, valeurs 'tank','heal','dps'
  var roleField = _curGame === 'wow' ? s.profiles.wow_role : s.profiles.swtor_role;
  if (!roleField) return 'other';
  var r = roleField.toLowerCase();
  if (r === 'tank') return 'tank';
  if (r === 'heal' || r === 'healer') return 'heal';
  if (r === 'dps') return 'dps';
  return 'other';
}

/* ── API ─────────────────────────────────────────── */
async function calFetch(path) {
  try {
    var r = await fetch(CAL_SB + path, {
      headers: { 'apikey': CAL_KEY, 'Authorization': 'Bearer ' + tok() }
    });
    return r.ok ? await r.json() : [];
  } catch(e) { return []; }
}

async function calPost(path, body, method) {
  try {
    var r = await fetch(CAL_SB + path, {
      method: method || 'POST',
      headers: {
        'apikey': CAL_KEY, 'Authorization': 'Bearer ' + tok(),
        'Content-Type': 'application/json', 'Prefer': 'return=minimal'
      },
      body: JSON.stringify(body)
    });
    if (!r.ok && r.status !== 201 && r.status !== 204) {
      var txt = await r.text();
      console.error('calPost error', r.status, path, txt);
    }
    return r.ok || r.status === 201 || r.status === 204;
  } catch(e) { console.error('calPost exception', e); return false; }
}

/* ── Chargement données ──────────────────────────── */
async function loadEvents() {
  var from = new Date(_monthDate.getFullYear(), _monthDate.getMonth() - 1, 1).toISOString();
  var to   = new Date(_monthDate.getFullYear(), _monthDate.getMonth() + 2, 1).toISOString();
  var data = await calFetch('/rest/v1/events?select=*&event_date=gte.' + from + '&event_date=lte.' + to + '&order=event_date.asc&limit=200');
  _events  = Array.isArray(data) ? data : [];
}

async function loadSignups() {
  // On récupère username + les champs de rôle/classe pour le classement
  var data   = await calFetch('/rest/v1/event_signups?select=id,event_id,user_id,status,profiles(username,wow_role,swtor_role)&order=created_at.asc');
  _signups   = {};
  _mySignups = {};
  if (!Array.isArray(data)) return;
  data.forEach(function(s) {
    if (!_signups[s.event_id]) _signups[s.event_id] = [];
    _signups[s.event_id].push(s);
    if (s.user_id === _uid) _mySignups[s.event_id] = s.id;
  });
}

/* ── Inscription ─────────────────────────────────── */
async function signup(eventId, newStatus) {
  // newStatus est passé directement : 'present', 'absent', 'maybe'
  if (!newStatus) newStatus = 'present';
  var existing = _mySignups[eventId];
  var ok;
  if (existing) {
    ok = await calPost('/rest/v1/event_signups?id=eq.' + existing, { status: newStatus }, 'PATCH');
  } else {
    ok = await calPost('/rest/v1/event_signups', { event_id: eventId, user_id: _uid, status: newStatus });
  }
  if (ok) {
    await loadSignups();
    render();
    var popup = g('ev-popup');
    if (popup && popup.classList.contains('open')) {
      var eid = popup.getAttribute('data-eid');
      if (String(eid) === String(eventId)) showPopup(eid);
    }
  }
}

/* ── Navigation ──────────────────────────────────── */
function switchGame(game, btn) {
  _curGame = game;
  document.querySelectorAll('.game-tab').forEach(function(t) { t.classList.remove('active'); });
  btn.classList.add('active');
  // Thème couleur sur le wrapper
  var cal = document.getElementById('cal-content');
  if (cal) { cal.classList.remove('game-wow','game-swtor'); cal.classList.add('game-' + game); }
  render();
}

function switchView(view) {
  _curView = view;
  g('vt-month').classList.toggle('active', view === 'month');
  g('vt-list').classList.toggle('active',  view === 'list');
  g('view-month').style.display = view === 'month' ? 'block' : 'none';
  g('view-list').style.display  = view === 'list'  ? 'block' : 'none';
  render();
}

function changeMonth(delta) {
  _monthDate = new Date(_monthDate.getFullYear(), _monthDate.getMonth() + delta, 1);
  loadEvents().then(render);
}

function goToday() {
  var n = new Date();
  _monthDate = new Date(n.getFullYear(), n.getMonth(), 1);
  loadEvents().then(render);
}

/* ── Bloc inscrits par rôle ──────────────────────── */
function buildRoleBlocks(sups) {
  var present = sups.filter(function(s) { return s.status === 'present'; });
  var absent  = sups.filter(function(s) { return s.status === 'absent';  });
  var maybe   = sups.filter(function(s) { return s.status === 'maybe';   });

  if (!present.length && !absent.length && !maybe.length) return '';

  // Classer les présents par rôle
  var byRole = { tank:[], heal:[], dps:[], other:[] };
  present.forEach(function(s) {
    var r = getRoleForSignup(s);
    byRole[r].push((s.profiles && s.profiles.username) || '?');
  });

  // Génère les lignes de chips avec max 7 par ligne
  function chipsRows(names, cfg) {
    var rows = [];
    for (var i = 0; i < names.length; i += 7) {
      var chunk = names.slice(i, i + 7);
      rows.push('<div style="display:flex;gap:0.4rem;margin-bottom:0.3rem;">' +
        chunk.map(function(name) {
          return '<span style="font-family:var(--font);font-size:0.68rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:0.2rem 0.65rem;border:1px solid ' + cfg.border + ';color:' + cfg.color + ';">' + name + '</span>';
        }).join('') +
      '</div>');
    }
    return rows.join('');
  }

  // Toujours Tank → Heal → DPS → Autre, dans l'ordre fixe
  var rolesHtml = ['tank','heal','dps','other'].map(function(r) {
    if (!byRole[r].length) return '';
    var cfg = ROLE_CONFIG[r];
    return '<div style="margin-bottom:1rem;">' +
      '<div style="font-family:var(--font);font-size:0.62rem;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:' + cfg.color + ';margin-bottom:0.5rem;padding-bottom:0.3rem;border-bottom:1px solid ' + cfg.border + ';">' +
        cfg.icon + ' ' + cfg.label + ' (' + byRole[r].length + ')' +
      '</div>' +
      chipsRows(byRole[r], cfg) +
    '</div>';
  }).join('');

  var absentHtml = absent.length
    ? '<div style="margin-bottom:1rem;">' +
        '<div style="font-family:var(--font);font-size:0.62rem;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:#6A82A0;margin-bottom:0.5rem;padding-bottom:0.3rem;border-bottom:1px solid rgba(106,130,160,0.3);">Absents (' + absent.length + ')</div>' +
        chipsRows(absent.map(function(s) { return (s.profiles && s.profiles.username) || '?'; }), { color:'#6A82A0', border:'rgba(106,130,160,0.3)' }) +
      '</div>'
    : '';

  var maybeHtml = maybe.length
    ? '<div style="margin-bottom:1rem;">' +
        '<div style="font-family:var(--font);font-size:0.62rem;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;color:#F0C040;margin-bottom:0.5rem;padding-bottom:0.3rem;border-bottom:1px solid rgba(240,192,64,0.3);">Peut-être (' + maybe.length + ')</div>' +
        chipsRows(maybe.map(function(s) { return (s.profiles && s.profiles.username) || '?'; }), { color:'#F0C040', border:'rgba(240,192,64,0.3)' }) +
      '</div>'
    : '';

  return '<div style="margin-top:1.25rem;border-top:1px solid var(--border);padding-top:1.25rem;">' + rolesHtml + maybeHtml + absentHtml + '</div>';
}

/* ── Vue mensuelle ───────────────────────────────── */
function renderMonth() {
  var grid  = g('month-grid');
  var label = g('month-label');
  var today = new Date();
  var year  = _monthDate.getFullYear();
  var month = _monthDate.getMonth();

  label.textContent = MONTHS_FR[month] + ' ' + year;

  // Premier jour du mois et du calendrier (lundi précédent)
  var firstDay  = new Date(year, month, 1);
  var startDay  = new Date(firstDay);
  var dow = firstDay.getDay();
  var diff = (dow === 0) ? -6 : 1 - dow;
  startDay.setDate(startDay.getDate() + diff);

  // Nombre de semaines à afficher (5 ou 6)
  var lastDay  = new Date(year, month + 1, 0);
  var endDow   = lastDay.getDay();
  var endDay   = new Date(lastDay);
  endDay.setDate(endDay.getDate() + (endDow === 0 ? 0 : 7 - endDow));

  var totalDays = Math.round((endDay - startDay) / 86400000) + 1;
  var weeks = Math.ceil(totalDays / 7);

  // Filtrer les events du mois courant (+ bords)
  var monthEvents = _events.filter(function(e) { return e.game === _curGame; });

  grid.innerHTML = '';

  // En-têtes jours
  var headers = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  headers.forEach(function(h) {
    var cell = document.createElement('div');
    cell.className = 'month-day-header';
    cell.textContent = h;
    grid.appendChild(cell);
  });

  // Cellules jours
  for (var i = 0; i < weeks * 7; i++) {
    var day = new Date(startDay.getTime() + i * 86400000);
    var inMonth  = day.getMonth() === month;
    var isToday  = sameDay(day, today);
    var dayEvents= monthEvents.filter(function(e) { return sameDay(new Date(e.event_date), day); });

    var cell = document.createElement('div');
    cell.className = 'month-day' +
      (isToday   ? ' today'     : '') +
      (!inMonth  ? ' other-month' : '');

    var numEl = document.createElement('div');
    numEl.className = 'month-day-num';
    numEl.textContent = day.getDate();
    cell.appendChild(numEl);

    dayEvents.forEach(function(e) {
      var sups    = _signups[e.id] || [];
      var present = sups.filter(function(s) { return s.status === 'present'; }).length;
      var mySup   = sups.find(function(s) { return s.user_id === _uid; });
      var myStatus= mySup ? mySup.status : 'none';

      var pill = document.createElement('div');
      var pillStatus = myStatus === 'present' ? ' signed' : myStatus === 'absent' ? ' signed-absent' : myStatus === 'maybe' ? ' signed-maybe' : '';
      pill.className = 'ev-pill ' + e.game + pillStatus;
      pill.innerHTML =
        '<span class="ev-pill-time">' + fmtTime(e.event_date) + '</span>' +
        '<span class="ev-pill-title">' + e.title + '</span>' +
        (present ? '<span class="ev-pill-count">' + present + '</span>' : '');
      pill.addEventListener('click', function() { showPopup(e.id); });
      cell.appendChild(pill);
    });

    grid.appendChild(cell);
  }
}

/* ── Vue liste ───────────────────────────────────── */
function renderList() {
  var container = g('list-content');
  container.innerHTML = '';

  var data = _events.filter(function(e) { return e.game === _curGame; });
  if (!data.length) {
    container.innerHTML = '<div class="cal-empty">Aucun évènement pour ce jeu.</div>';
    return;
  }

  var byMonth = {}, order = [];
  data.forEach(function(e) {
    var dt  = new Date(e.event_date);
    var key = dt.getFullYear() + '-' + String(dt.getMonth()).padStart(2,'0');
    var lbl = MONTHS_FR[dt.getMonth()] + ' ' + dt.getFullYear();
    if (!byMonth[key]) { byMonth[key] = { label:lbl, events:[] }; order.push(key); }
    byMonth[key].events.push(e);
  });

  order.sort().forEach(function(key) {
    var grp = byMonth[key];
    var mh  = document.createElement('div');
    mh.className   = 'month-header';
    mh.textContent = grp.label;
    container.appendChild(mh);
    grp.events.forEach(function(e) { container.appendChild(mkListCard(e)); });
  });
}

function mkListCard(e) {
  var dt      = new Date(e.event_date);
  var past    = dt < new Date();
  var sups    = _signups[e.id] || [];
  var present = sups.filter(function(s) { return s.status === 'present'; });
  var mySup   = sups.find(function(s) { return s.user_id === _uid; });
  var myStatus= mySup ? mySup.status : 'none';
  var maxInfo = e.max_players ? (present.length + '/' + e.max_players) : (present.length + ' inscrits');

  var card = document.createElement('div');
  var signedClass = myStatus === 'present' ? ' signed-present' : myStatus === 'absent' ? ' signed-absent' : myStatus === 'maybe' ? ' signed-maybe' : '';
  card.className = 'event-card' + (e.game === 'swtor' ? ' swtor' : '') + (past ? ' past' : '') + signedClass;

  var hdr = document.createElement('div');
  hdr.className = 'event-header';
  hdr.innerHTML =
    '<div style="text-align:center;">' +
      '<div class="event-day">'   + dt.getDate() + '</div>' +
      '<div class="event-month">' + DAYS_FR[dt.getDay()] + ' ' + MONTHS_FR[dt.getMonth()] + '</div>' +
      '<div class="event-time-lbl">' + fmtTime(e.event_date) + '</div>' +
    '</div>' +
    '<div>' +
      '<div class="event-title">' + e.title + '</div>' +
      '<div class="event-meta">' +
        (e.game === 'wow' ? '<span class="event-tag tag-wow">WoW</span>' : '<span class="event-tag tag-swtor">SWTOR</span>') +
        '<span class="event-tag tag-type">' + (TYPE_LBL[e.type] || 'Évènement') + '</span>' +
        (e.duration_min ? '<span style="font-size:0.7rem;color:var(--text-muted);">' + e.duration_min + 'min</span>' : '') +
      '</div>' +
    '</div>' +
    '<div class="event-actions">' +
      '<span class="signup-count">' + maxInfo + '</span>' +
    '</div>';
  hdr.addEventListener('click', function() { detail.classList.toggle('open'); });

  if (!past) {
    var bDiv = document.createElement('div');
    bDiv.style.cssText = 'display:flex;gap:0.4rem;flex-wrap:wrap;';
    var eid = e.id;
    [
      { s:'present', l:'✅ Présent',   c:'present' },
      { s:'absent',  l:'❌ Absent',    c:'absent'  },
      { s:'maybe',   l:'❓ Peut-être', c:'maybe'   }
    ].forEach(function(opt) {
      var b = document.createElement('button');
      b.className = 'btn-signup ' + opt.c + (myStatus === opt.s ? ' active-status' : '');
      b.textContent = opt.l;
      if (myStatus === opt.s) b.style.fontWeight = '900';
      b.addEventListener('click', function(ev) { ev.stopPropagation(); signup(eid, opt.s); });
      bDiv.appendChild(b);
    });
    hdr.querySelector('.event-actions').appendChild(bDiv);
  }
  card.appendChild(hdr);

  var detail = document.createElement('div');
  detail.className = 'event-detail';
  detail.innerHTML =
    (e.description ? '<div class="detail-desc">' + e.description + '</div>' : '') +
    buildRoleBlocks(sups);
  card.appendChild(detail);
  return card;
}

/* ── Popup depuis vue mensuelle ──────────────────── */
function showPopup(eventId) {
  var e = _events.find(function(x) { return x.id === eventId; });
  if (!e) return;
  var popup   = g('ev-popup');
  var content = g('ev-popup-content');
  popup.setAttribute('data-eid', eventId);

  var dt      = new Date(e.event_date);
  var past    = dt < new Date();
  var sups    = _signups[e.id] || [];
  var present = sups.filter(function(s) { return s.status === 'present'; });
  var mySup   = sups.find(function(s) { return s.user_id === _uid; });
  var myStatus= mySup ? mySup.status : 'none';
  var maxInfo = e.max_players ? (present.length + '/' + e.max_players) : (present.length + ' inscrits');

  var btnHtml = '';
  if (!past) {
    var btnCls = 'btn-signup ' + myStatus;
    var btnLbl = myStatus === 'present' ? 'Présent' : myStatus === 'absent' ? 'Absent' : "S'inscrire";
    btnHtml = (function() {
      var myStatus = mySup ? mySup.status : 'none';
      return '<div style="display:flex;gap:0.5rem;margin-top:1rem;flex-wrap:wrap;">' +
        '<button class="btn-signup ' + (myStatus==='present'?'present':'') + '" onclick="signup(\''+e.id+'\',\'present\')">✅ Présent</button>' +
        '<button class="btn-signup ' + (myStatus==='absent'?'absent':'') + '" onclick="signup(\''+e.id+'\',\'absent\')">❌ Absent</button>' +
        '<button class="btn-signup ' + (myStatus==='maybe'?'maybe active':'') + '" onclick="signup(\''+e.id+'\',\'maybe\')">❓ Peut-être</button>' +
        '</div>';
    })();
  }

  content.innerHTML =
    '<div style="font-family:var(--font);font-size:0.6rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--text-muted);margin-bottom:0.5rem;">' +
      DAYS_FR[dt.getDay()] + ' ' + dt.getDate() + ' ' + MONTHS_FR[dt.getMonth()] + ' ' + dt.getFullYear() + ' — ' + fmtTime(e.event_date) +
    '</div>' +
    '<div style="font-family:var(--font);font-size:1.1rem;font-weight:900;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-primary);margin-bottom:0.75rem;">' + e.title + '</div>' +
    '<div style="display:flex;gap:0.5rem;align-items:center;margin-bottom:0.75rem;">' +
      (e.game === 'wow' ? '<span class="event-tag tag-wow">WoW</span>' : '<span class="event-tag tag-swtor">SWTOR</span>') +
      '<span class="event-tag tag-type">' + (TYPE_LBL[e.type] || 'Évènement') + '</span>' +
      '<span style="font-size:0.65rem;color:var(--text-muted);">' + maxInfo + '</span>' +
    '</div>' +
    (e.description ? '<div style="font-size:0.85rem;color:var(--text-muted);line-height:1.6;margin-bottom:0.5rem;">' + e.description + '</div>' : '') +
    btnHtml +
    buildRoleBlocks(sups);

  var btn = g('popup-signup-btn');
  if (btn) {
    btn.addEventListener('click', function() { signup(e.id, myStatus); });
  }
  popup.classList.add('open');
}

document.addEventListener('click', function(ev) {
  var popup = g('ev-popup');
  if (popup && popup.classList.contains('open') && ev.target === popup) {
    popup.classList.remove('open');
  }
});

/* ── Render principal ────────────────────────────── */
function render() {
  if (_curView === 'month') renderMonth();
  else renderList();
}

/* ── Init ────────────────────────────────────────── */
async function calInit(uid, defaultGame) {
  _uid = uid;
  // Appliquer le jeu par défaut si précisé (ex: membre SWTOR uniquement)
  if (defaultGame && defaultGame !== _curGame) {
    _curGame = defaultGame;
    var btn = document.querySelector('.game-tab.' + defaultGame);
    if (btn) {
      document.querySelectorAll('.game-tab').forEach(function(t) { t.classList.remove('active'); });
      btn.classList.add('active');
    }
  }
  var n = new Date();
  _monthDate = new Date(n.getFullYear(), n.getMonth(), 1);
  g('cal-nologin').style.display = 'none';
  var cal = g('cal-content');
  cal.style.display = 'block';
  cal.classList.remove('game-wow','game-swtor'); cal.classList.add('game-' + _curGame);
  await loadEvents();
  await loadSignups();
  render();

  // Polling toutes les 10s pour sync Discord → site
  setInterval(function() {
    loadSignups().then(function() {
      render();
      var popup = g('ev-popup');
      if (popup && popup.classList.contains('open')) {
        var eid = popup.getAttribute('data-eid');
        if (eid) showPopup(eid);
      }
    });
  }, 10000);
}
