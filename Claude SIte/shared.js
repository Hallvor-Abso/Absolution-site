/* ═══════════════════════════════════════════════════
   ABSOLUTION — shared.js
   Injecte la nav, le menu mobile, la modal auth et le
   footer dans chaque page publique via des placeholders.
   Gère aussi : canvas, hamburger, lien actif.
═══════════════════════════════════════════════════ */
(function () {

  var DISCORD_ICON = '<svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M13.545 1.01A13.2 13.2 0 0 0 10.26 0a.05.05 0 0 0-.05.025c-.141.25-.297.576-.406.833a12.2 12.2 0 0 0-3.608 0 8.5 8.5 0 0 0-.412-.833.05.05 0 0 0-.05-.025 13.2 13.2 0 0 0-3.285 1.01.045.045 0 0 0-.021.018C.356 4.423-.213 7.736.066 11.008a.05.05 0 0 0 .019.034 13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .054-.018c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.027-.069 8.8 8.8 0 0 1-1.248-.595.05.05 0 0 1-.005-.082c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007c.08.066.164.132.248.195a.05.05 0 0 1-.004.082 8.2 8.2 0 0 1-1.249.594.05.05 0 0 0-.027.07c.24.465.514.909.817 1.328a.05.05 0 0 0 .054.019 13.25 13.25 0 0 0 4.001-2.02.05.05 0 0 0 .019-.033c.334-3.451-.559-6.747-2.366-9.528a.04.04 0 0 0-.02-.019zM5.347 9.046c-.777 0-1.418-.714-1.418-1.591 0-.877.628-1.591 1.418-1.591.796 0 1.43.72 1.418 1.591 0 .877-.628 1.591-1.418 1.591zm5.241 0c-.777 0-1.418-.714-1.418-1.591 0-.877.628-1.591 1.418-1.591.796 0 1.43.72 1.418 1.591 0 .877-.622 1.591-1.418 1.591z"/></svg>';

  var NAV_HTML =
    '<nav>' +
      '<a href="index.html" class="nav-logo">ABS<span>O</span>LUTION</a>' +
      '<button class="hamburger" id="hamburger"><span></span><span></span><span></span></button>' +
      '<ul class="nav-links">' +
        '<li><a href="index.html" id="nl-accueil">Accueil</a></li>' +
        '<li><a href="news.html" id="nl-news">Actualités</a></li>' +
        '<li class="nav-dropdown">' +
          '<a href="#" id="nl-recrutement">Recrutement ▾</a>' +
          '<div class="nav-dropdown-menu">' +
            '<a href="recrutement.html?game=wow" data-game="wow"><span style="color:#3B82F6;font-size:0.5rem;">◆</span> World of Warcraft</a>' +
            '<a href="recrutement.html?game=swtor" data-game="swtor"><span style="color:#EF4444;font-size:0.5rem;">◆</span> SWTOR</a>' +
          '</div>' +
        '</li>' +
        '<li class="nav-dropdown">' +
          '<a href="jeux.html" id="nl-jeux">Nos jeux ▾</a>' +
          '<div class="nav-dropdown-menu">' +
            '<a href="jeux.html#wow" data-game="wow"><span style="color:#3B82F6;font-size:0.5rem;">◆</span> World of Warcraft</a>' +
            '<a href="jeux.html#swtor" data-game="swtor"><span style="color:#EF4444;font-size:0.5rem;">◆</span> SWTOR</a>' +
          '</div>' +
        '</li>' +
        '<li><a href="roster.html" id="nl-roster">Roster</a></li>' +
        '<li><a href="calendrier.html" id="nl-calendrier">Calendrier</a></li>' +
      '</ul>' +
      '<div id="nav-auth-zone"></div>' +
      '<a href="https://discord.gg/ANEeFgfP8x" target="_blank" class="nav-discord-btn">' + DISCORD_ICON + ' Discord</a>' +
    '</nav>';

  var MOBILE_HTML =
    '<div class="mobile-overlay" id="mobile-overlay">' +
      '<a href="index.html">Accueil</a>' +
      '<a href="news.html">Actualités</a>' +
      '<a href="recrutement.html?game=wow" data-game="wow">Recrutement WoW</a>' +
      '<a href="recrutement.html?game=swtor" data-game="swtor">Recrutement SWTOR</a>' +
      '<a href="jeux.html">Nos jeux</a>' +
      '<a href="roster.html">Roster</a>' +
      '<a href="calendrier.html">Calendrier</a>' +
      '<a href="https://discord.gg/ANEeFgfP8x" target="_blank">Discord</a>' +
    '</div>';

  var AUTH_MODAL_HTML =
    '<div class="auth-modal" id="auth-modal">' +
      '<div class="auth-modal-box">' +
        '<button class="auth-close" onclick="closeAuth()">✕</button>' +
        '<div class="auth-modal-title">Espace membre</div>' +
        '<div class="auth-tabs">' +
          '<button class="auth-tab active" id="tab-login" onclick="switchTab(\'login\')">Connexion</button>' +
          '<button class="auth-tab" id="tab-register" onclick="switchTab(\'register\')">Inscription</button>' +
        '</div>' +
        '<div class="auth-form active" id="form-login">' +
          '<div><label class="auth-label">Email</label><input type="email" id="login-email" placeholder="email@exemple.com"></div>' +
          '<div><label class="auth-label">Mot de passe</label><input type="password" id="login-password" placeholder="••••••••"></div>' +
          '<div class="auth-error"></div>' +
          '<button class="btn btn-primary" id="btn-login" onclick="doLogin()">Se connecter</button>' +
        '</div>' +
        '<div class="auth-form" id="form-register">' +
          '<div><label class="auth-label">Pseudo in-game *</label><input type="text" id="reg-username" placeholder="VotreNom"></div>' +
          '<div><label class="auth-label">Pseudo Discord *</label><input type="text" id="reg-discord" placeholder="pseudo ou pseudo#0000"></div>' +
          '<div><label class="auth-label">Email *</label><input type="email" id="reg-email" placeholder="email@exemple.com"></div>' +
          '<div><label class="auth-label">Mot de passe *</label><input type="password" id="reg-password" placeholder="••••••••"></div>' +
          '<div><label class="auth-label">Confirmer *</label><input type="password" id="reg-password2" placeholder="••••••••"></div>' +
          '<div class="auth-error"></div>' +
          '<button class="btn btn-primary" id="btn-register" onclick="doRegister()">S\'inscrire</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  var FOOTER_HTML =
    '<footer><div class="footer-inner">' +
      '<div class="footer-logo">Absolution</div>' +
      '<nav class="footer-links">' +
        '<a href="index.html">Accueil</a>' +
        '<a href="news.html">Actualités</a>' +
        '<a href="recrutement.html?game=wow">Recrutement WoW</a>' +
        '<a href="recrutement.html?game=swtor">Recrutement SWTOR</a>' +
        '<a href="jeux.html">Nos jeux</a>' +
        '<a href="roster.html">Roster</a>' +
        '<a href="calendrier.html">Calendrier</a>' +
        '<a href="https://discord.gg/ANEeFgfP8x" target="_blank">Discord</a>' +
      '</nav>' +
      '<p class="footer-copy">© 2026 Absolution — Guilde MMORPG · Au-delà des factions, au-delà des mondes.</p>' +
    '</div></footer>';

  /* ── Injection synchrone des placeholders ── */
  function inject(id, html) {
    var el = document.getElementById(id);
    if (!el) return;
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    el.parentNode.replaceChild(tmp.firstChild, el);
  }

  inject('nav-root', NAV_HTML);
  inject('mobile-overlay-root', MOBILE_HTML);
  inject('auth-modal-root', AUTH_MODAL_HTML);
  inject('footer-root', FOOTER_HTML);

  /* ── Hamburger ── */
  var hamburger = document.getElementById('hamburger');
  if (hamburger) {
    hamburger.addEventListener('click', function () {
      var overlay = document.getElementById('mobile-overlay');
      if (overlay) overlay.classList.toggle('open');
    });
  }

  /* ── Lien actif dans la nav ── */
  var page = (window.location.pathname.split('/').pop() || 'index').replace('.html', '');
  var NAV_MAP = {
    'index':             'nl-accueil',
    '':                  'nl-accueil',
    'news':              'nl-news',
    'news-article':      'nl-news',
    'recrutement':       'nl-recrutement',
    'jeux':              'nl-jeux'
  };
  var activeId = NAV_MAP[page];
  if (activeId) {
    var activeEl = document.getElementById(activeId);
    if (activeEl) activeEl.classList.add('active');
  }

  /* ── Canvas constellation (toutes les pages) ── */
  (function () {
    var c = document.getElementById('bg-canvas');
    if (!c) return;
    /* Sur la homepage le hero-canvas prend en charge les particules :
       on masque bg-canvas pour éviter deux boucles RAF simultanées. */
    if (document.getElementById('hero-canvas')) {
      c.style.display = 'none';
      return;
    }
    var ctx = c.getContext('2d'), pts = [], time = 0;
    function resize() {
      c.width = window.innerWidth; c.height = window.innerHeight; pts = [];
      var n = Math.max(30, Math.min(70, Math.floor(c.width * c.height / 18000)));
      for (var i = 0; i < n; i++) {
        pts.push({ x: Math.random() * c.width, y: Math.random() * c.height, vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .18, r: Math.random() * .8 + .2, b: Math.random() * .3 + .08, t: Math.random() * Math.PI * 2 });
      }
    }
    resize();
    var D = 120;
    function draw() {
      ctx.clearRect(0, 0, c.width, c.height); time += .005;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i]; p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > c.width) p.vx *= -1;
        if (p.y < 0 || p.y > c.height) p.vy *= -1;
        p.b = .08 + .15 * Math.sin(time + p.t);
      }
      for (var i = 0; i < pts.length; i++) {
        for (var j = i + 1; j < pts.length; j++) {
          var a = pts[i], b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < D) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.strokeStyle = 'rgba(59,130,246,' + ((1 - d / D) * .08) + ')'; ctx.lineWidth = .4; ctx.stroke(); }
        }
      }
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i]; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(148,163,184,' + p.b + ')'; ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    draw();
    window.addEventListener('resize', resize);
  })();

})();
