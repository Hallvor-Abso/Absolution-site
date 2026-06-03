/* ══════════════════════════════════════════════════════
   ABSOLUTION — config.js
   Source unique pour l'URL et la clé Supabase anonyme.
   Charger ce fichier EN PREMIER, avant tout autre script.
   La clé anon est publique par design ; le RLS Supabase
   protège les données sensibles côté base de données.
══════════════════════════════════════════════════════ */
window.SB_URL = 'https://untuhgcumkyjihmkmrtn.supabase.co';
window.SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudHVoZ2N1bWt5amlobWttcnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MjQzNDYsImV4cCI6MjA5NTEwMDM0Nn0.1PilGWvDoYnyuYx4ZnBb43Cg88c9_cCtbMHnr8-WX-4';
window.SB_H   = { 'apikey': window.SB_KEY, 'Authorization': 'Bearer ' + window.SB_KEY };
