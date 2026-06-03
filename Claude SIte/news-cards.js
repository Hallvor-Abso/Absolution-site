/* ═══════════════════════════════════════════════════
   ABSOLUTION — News Cards v3
   Génération des cartes articles
═══════════════════════════════════════════════════ */
const NC = {
  SB:  window.SB_URL,
  KEY: window.SB_KEY,
  COLORS: { wow:'#48B8F0', swtor:'#FF3A3A', guild:'#6A82A0' },
  LABELS: { wow:'⚡ WoW',  swtor:'🔥 SWTOR', guild:'🏰 Guilde' },

  async get(path) {
    try {
      const r = await fetch(this.SB + path, { headers: { 'apikey': this.KEY, 'Authorization': 'Bearer ' + this.KEY } });
      return r.ok ? await r.json() : [];
    } catch { return []; }
  },

  fmt(d) { return new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' }); },

  tag(game) {
    const c = this.COLORS[game] || '#6A82A0';
    const l = this.LABELS[game] || game;
    return '<span class="card-tag ' + game + '">' + l + '</span>';
  },

  card(a, big) {
    const c  = this.COLORS[a.game] || '#6A82A0';
    const bl = a.game === 'swtor' ? 'var(--color-secondary)' : 'var(--color-primary)';
    const sz = big ? '1.6rem' : '1rem';
    const pd = big ? '2rem'   : '1.5rem';
    return '<a href="news-article.html?id=' + a.id + '" class="card card-' + (a.game||'guild') + '" style="padding:' + pd + ';">' +
      this.tag(a.game) +
      (big ? '<span class="featured-badge">À la une</span>' : '') +
      '<span class="card-date">' + this.fmt(a.published_at) + '</span>' +
      '<div class="card-title" style="font-size:' + sz + ';">' + a.title + '</div>' +
      (a.excerpt ? '<div class="card-excerpt">' + a.excerpt + '</div>' : '') +
      '<span class="card-read ' + (a.game||'guild') + '">Lire l\'article →</span>' +
      '</a>';
  }
};
