/* ── Transitions de page — arc électrique ── */
(function () {

  var DUR = 500;
  var arriving = !!sessionStorage.getItem('abs_nav');

  /* Couvre l'écran immédiatement si on arrive depuis une navigation
     (évite le flash blanc avant que le DOM soit prêt) */
  if (arriving) {
    sessionStorage.removeItem('abs_nav');
    var early = document.createElement('style');
    early.id = 'abs-tr-early';
    early.textContent = 'html::before{content:"";position:fixed;inset:0;z-index:9990;background:#080D1A;pointer-events:none;}';
    document.head.appendChild(early);
  }

  function init() {
    /* Supprime le masque précoce */
    var earlyEl = document.getElementById('abs-tr-early');
    if (earlyEl) earlyEl.parentNode.removeChild(earlyEl);

    /* CSS de l'animation */
    var s = document.createElement('style');
    s.textContent = '\
#abs-tr{\
  position:fixed;inset:0;z-index:9990;\
  background:#080D1A;\
  transform:scaleX(0);\
  transform-origin:left center;\
  will-change:transform;\
  pointer-events:none;\
}\
#abs-tr.in{\
  pointer-events:all;\
  animation:abs-in ' + DUR + 'ms cubic-bezier(0.77,0,0.175,1) forwards;\
}\
#abs-tr.out{\
  transform:scaleX(1);\
  transform-origin:right center;\
  animation:abs-out ' + DUR + 'ms cubic-bezier(0.77,0,0.175,1) 40ms forwards;\
}\
@keyframes abs-in{to{transform:scaleX(1);}}\
@keyframes abs-out{to{transform:scaleX(0);}}\
#abs-tr-line{\
  position:absolute;top:50%;left:0;right:0;\
  height:1px;margin-top:-0.5px;\
  background:linear-gradient(90deg,transparent 0%,#1B9FE8 20%,#AAEEFF 50%,#00D4F5 80%,transparent 100%);\
  box-shadow:0 0 10px rgba(0,212,245,0.9),0 0 3px rgba(255,255,255,0.5);\
  opacity:0;\
  transition:opacity 0.12s ease;\
}\
#abs-tr.in #abs-tr-line,\
#abs-tr.out #abs-tr-line{opacity:1;}';
    document.head.appendChild(s);

    /* Overlay */
    var tr = document.createElement('div');
    tr.id = 'abs-tr';
    tr.innerHTML = '<div id="abs-tr-line"></div>';

    if (arriving) {
      /* Déjà visible — on le fait disparaître */
      tr.style.cssText = 'transform:scaleX(1);transform-origin:right center;';
      document.body.appendChild(tr);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          tr.classList.add('out');
        });
      });
    } else {
      document.body.appendChild(tr);
    }

    /* Interception des clics sur liens internes */
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href) return;
      if (href.charAt(0) === '#') return;
      if (href.indexOf('://') !== -1) return;
      if (a.target === '_blank') return;
      if (href.indexOf('mailto:') === 0 || href.indexOf('javascript:') === 0) return;

      e.preventDefault();
      sessionStorage.setItem('abs_nav', '1');
      tr.classList.add('in');

      setTimeout(function () {
        window.location.href = href;
      }, DUR + 50);
    });
  }

  /* Lance init dès que le body est disponible */
  if (document.body) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }

})();
