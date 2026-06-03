/* ═══════════════════════════════════════════════════════════
   ABSOLUTION — Blocks CMS v3
   Approche data-eid : assigne les mêmes IDs que l'éditeur
   puis applique les blocs sauvegardés.

   Format des block_key :
     [data-eid="eN"]    → élément texte (approche v6)
     __vis__<sel>       → visibilité de section
     __img__<sel>       → src d'une image
     __theme__<var>     → variable CSS globale
     <sel>              → ancien format (compatibilité)
═══════════════════════════════════════════════════════════ */
(function() {
  var SB  = window.SB_URL;
  var KEY = window.SB_KEY;
  var H   = { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY };

  // ── Détecter la page ──────────────────────────────────────
  var page = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
  if (!page) page = 'index';

  // ── Charger et appliquer les blocs ───────────────────────
  fetch(SB + '/rest/v1/page_blocks?select=block_key,content,visible&page_id=in.(' + page + ',_theme)', { headers: H })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!Array.isArray(data) || !data.length) return;

      // Séparer les blocs par priorité :
      // - Priorité 1 (basse) : anciens sélecteurs CSS
      // - Priorité 2 (haute) : [data-eid="..."] — appliqués EN DERNIER
      var legacyBlocks = [];
      var eidBlocks    = [];

      data.forEach(function(b) {
        if (!b.block_key) return;

        // Thème et visibilité → appliquer immédiatement
        if (b.block_key.startsWith('__theme__') && b.content) {
          document.documentElement.style.setProperty(b.block_key.slice(9), b.content);

        } else if (b.block_key.startsWith('__vis__')) {
          if (b.visible === false) {
            try { var el = document.querySelector(b.block_key.slice(7)); if (el) el.style.display = 'none'; } catch(e) {}
          }

        } else if (b.block_key.startsWith('__img__')) {
          if (b.content) {
            try { var el = document.querySelector(b.block_key.slice(7)); if (el) el.src = b.content; } catch(e) {}
          }

        // Contenu texte → trier par priorité
        } else if (b.content) {
          if (b.block_key.indexOf('[data-eid=') !== -1) {
            eidBlocks.push(b);    // Haute priorité
          } else {
            legacyBlocks.push(b); // Basse priorité (anciens blocs)
          }
        }
      });

      // Appliquer les anciens blocs en premier (priorité basse)
      legacyBlocks.forEach(function(b) {
        try {
          var el = document.querySelector(b.block_key);
          if (el && !el.hasAttribute('data-eid')) { // Ne pas toucher aux éléments qui ont data-eid
            el.innerHTML = b.content;
          }
        } catch(e) {}
      });

      // Appliquer les blocs data-eid EN DERNIER (priorité haute — écrasent tout)
      eidBlocks.forEach(function(b) {
        try {
          var el = document.querySelector(b.block_key);
          if (el) {
            el.innerHTML = b.content;
            if (el.hasAttribute('data-counter')) {
              el.removeAttribute('data-counter');
              el.removeAttribute('data-suffix');
            }
          }
        } catch(e) {}
      });
    })
    .catch(function() {
      // Silencieux — la page s'affiche normalement sans les blocs
    });
})();
