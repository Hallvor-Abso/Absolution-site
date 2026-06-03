/* ═══════════════════════════════════════════════════
   ABSOLUTION — Settings & Annonces v3
═══════════════════════════════════════════════════ */
(function() {
  var SB  = window.SB_URL;
  var KEY = window.SB_KEY;
  var H   = window.SB_H;

  // Init immédiat du padding — avant même que le fetch se termine
  (function() {
    var bodyEl = document.querySelector('.page-body');
    if (bodyEl) {
      var navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 60;
      bodyEl.style.paddingTop = navH + 'px';
    }
  })();

  // ── Jeux actifs ──────────────────────────────────
  function _applySettings(cfg) {
    var wowOn   = cfg['wow_enabled']   !== 'false';
    var swtorOn = cfg['swtor_enabled'] === 'true';
    document.querySelectorAll('[data-game]').forEach(function(el) {
      var g = el.getAttribute('data-game');
      if (g === 'wow'   && !wowOn)   el.style.display = 'none';
      if (g === 'swtor' && !swtorOn) el.style.display = 'none';
    });
    // Redirection si jeu désactivé (pages recrutement fusionnées)
    var path  = window.location.pathname;
    var qgame = new URLSearchParams(window.location.search).get('game');
    if (path.includes('recrutement')) {
      if (!wowOn   && qgame === 'wow')   window.location.href = 'index.html';
      if (!swtorOn && qgame === 'swtor') window.location.href = 'index.html';
    }
    return cfg;
  }

  window.SETTINGS_P = fetch(SB + '/rest/v1/settings?select=key,value', { headers: H })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var cfg = {};
      if (Array.isArray(data)) data.forEach(function(r) { cfg[r.key] = r.value; });
      return _applySettings(cfg);
    }).catch(function() { return {}; });

  // ── Annonces ─────────────────────────────────────
  fetch(SB + '/rest/v1/announcements?select=*&active=eq.true&order=sort_order.asc', { headers: H })
    .then(function(r) { return r.json(); })
    .then(function(anns) {
      if (!Array.isArray(anns) || !anns.length) return;

      var THEMES = {
        info:    { bg:'#0a1f35',  accent:'#48B8F0', text:'#48B8F0',  glow:'rgba(72,184,240,0.3)' },
        warning: { bg:'#1f1800',  accent:'#F0C040', text:'#F0C040',  glow:'rgba(240,192,64,0.3)' },
        success: { bg:'#001f0f',  accent:'#4AE08A', text:'#4AE08A',  glow:'rgba(74,224,138,0.3)' },
        event:   { bg:'#15062a',  accent:'#A855F7', text:'#A855F7',  glow:'rgba(168,85,247,0.3)' },
        alert:   { bg:'#1f0505',  accent:'#FF3A3A', text:'#FF3A3A',  glow:'rgba(255,58,58,0.4)'  }
      };
      var ICONS = { info:'ℹ️', warning:'⚠️', success:'🏆', event:'🎉', alert:'🚨' };

      // Wrapper global
      var wrap = document.createElement('div');
      wrap.id = 'ann-bar';
      wrap.style.cssText = [
        'position:fixed',
        'top:60px','left:0','right:0',
        'z-index:999',
        'transform:translateY(-100%)',
        'transition:transform 0.55s cubic-bezier(0.34,1.15,0.64,1)'
      ].join(';');

      var a = anns[0];
      var t = THEMES[a.type] || THEMES.info;

      // Slide unique (ou première annonce)
      var link = a.link_url
        ? '<a href="' + a.link_url + '" target="_blank" style="' + [
            'display:inline-flex','align-items:center','gap:0.35rem',
            'color:' + t.bg,
            'background:' + t.accent,
            'font-family:var(--font)','font-size:0.7rem','font-weight:700',
            'letter-spacing:0.18em','text-transform:uppercase',
            'padding:0.4rem 1rem','margin-left:1.5rem',
            'text-decoration:none','flex-shrink:0',
            'clip-path:polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)'
          ].join(';') + '">' + (a.link_label || 'En savoir plus') + ' →</a>'
        : '';

      var counter = anns.length > 1
        ? '<span style="position:absolute;right:1.5rem;top:50%;transform:translateY(-50%);font-family:var(--font);font-size:0.62rem;color:rgba(255,255,255,0.25);letter-spacing:0.15em;" id="ann-counter">1/' + Math.min(anns.length,3) + '</span>'
        : '';

      wrap.innerHTML = '<div id="ann-slide" style="' + [
        'background:' + t.bg,
        'border-bottom:3px solid ' + t.accent,
        'box-shadow:0 4px 30px ' + t.glow,
        'padding:1.1rem 2.5rem',
        'display:flex','align-items:center','gap:1rem',
        'position:relative'
      ].join(';') + '">' +
        '<span style="font-size:1.5rem;flex-shrink:0;">' + (ICONS[a.type] || '') + '</span>' +
        '<span style="' + [
          'font-family:var(--font)','font-size:1rem','font-weight:700',
          'letter-spacing:0.04em','color:#fff','flex:1','line-height:1.4'
        ].join(';') + '">' + a.message + link + '</span>' +
        counter +
        '</div>';

      var nav = document.querySelector('nav');
      if (!nav || !nav.parentNode) return;
      nav.parentNode.insertBefore(wrap, nav.nextSibling);

      var BAR_H = wrap.firstChild ? (wrap.firstChild.scrollHeight || 62) : 62;

      // Décaler le contenu
      var bodyEl = document.querySelector('.page-body');
      if (bodyEl) {
        var navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 60;
        bodyEl.style.transition = 'padding-top 0.55s ease';
        bodyEl.style.paddingTop = (navH + BAR_H) + 'px';
      }

      // Animation entrée
      setTimeout(function() { wrap.style.transform = 'translateY(0)'; }, 100);

      // Rotation si plusieurs annonces
      if (anns.length > 1) {
        var cur = 0;
        setInterval(function() {
          cur = (cur + 1) % Math.min(anns.length, 3);
          var a2  = anns[cur];
          var t2  = THEMES[a2.type] || THEMES.info;
          var slide = document.getElementById('ann-slide');
          var ctr   = document.getElementById('ann-counter');
          if (!slide) return;

          // Fondu sortie
          slide.style.transition = 'opacity 0.3s ease';
          slide.style.opacity = '0';

          setTimeout(function() {
            var link2 = a2.link_url
              ? '<a href="' + a2.link_url + '" target="_blank" style="display:inline-flex;align-items:center;gap:0.35rem;color:' + t2.bg + ';background:' + t2.accent + ';font-family:var(--font);font-size:0.7rem;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;padding:0.4rem 1rem;margin-left:1.5rem;text-decoration:none;flex-shrink:0;clip-path:polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%);">' + (a2.link_label || 'En savoir plus') + ' →</a>'
              : '';
            slide.style.background     = t2.bg;
            slide.style.borderBottom   = '3px solid ' + t2.accent;
            slide.style.boxShadow      = '0 4px 30px ' + t2.glow;
            var icon = slide.querySelector('span:first-child');
            var msg  = slide.querySelector('span:nth-child(2)');
            if (icon) icon.textContent = ICONS[a2.type] || '';
            if (msg)  msg.innerHTML    = a2.message + link2;
            if (ctr)  ctr.textContent  = (cur+1) + '/' + Math.min(anns.length,3);
            // Fondu entrée
            slide.style.opacity = '1';
          }, 300);
        }, 6000);
      }
    }).catch(function() {});
})();
