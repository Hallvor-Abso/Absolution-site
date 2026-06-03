/* ── Intro splash — once per session ── */
(function () {
  if (sessionStorage.getItem('abs_intro_done')) return;
  sessionStorage.setItem('abs_intro_done', '1');

  var css = `
#abs-intro {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #080C15;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: all;
}

#abs-intro-line {
  width: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #4A9FFF, #00C8FF, #4A9FFF, transparent);
  animation: lineGrow 0.55s cubic-bezier(0.4,0,0.2,1) 0.1s forwards;
  margin-bottom: 2.2rem;
  opacity: 0;
}

@keyframes lineGrow {
  0%   { width: 0;     opacity: 0; }
  10%  { opacity: 1; }
  100% { width: 280px; opacity: 1; }
}

#abs-intro-word {
  font-family: 'Outfit', 'Helvetica Neue', sans-serif;
  font-size: clamp(1.6rem, 5vw, 2.6rem);
  font-weight: 900;
  letter-spacing: 0.55em;
  text-transform: uppercase;
  color: #F0F8FF;
  opacity: 0;
  transform: translateY(6px);
  animation: wordIn 0.55s cubic-bezier(0.22,1,0.36,1) 0.45s forwards;
  padding-right: 0.55em; /* compense le letter-spacing sur le dernier char */
}

@keyframes wordIn {
  0%   { opacity: 0; transform: translateY(6px) scale(0.97); letter-spacing: 0.8em; }
  100% { opacity: 1; transform: translateY(0)   scale(1);    letter-spacing: 0.55em; }
}

#abs-intro-sub {
  font-family: 'Outfit', 'Helvetica Neue', sans-serif;
  font-size: 0.52rem;
  font-weight: 600;
  letter-spacing: 0.55em;
  text-transform: uppercase;
  color: #4A9FFF;
  opacity: 0;
  margin-top: 1rem;
  padding-right: 0.55em;
  animation: subIn 0.45s ease 0.85s forwards;
}

@keyframes subIn {
  to { opacity: 0.7; }
}

#abs-intro.fade-out {
  animation: introOut 0.5s cubic-bezier(0.4,0,0.2,1) forwards;
}

@keyframes introOut {
  0%   { opacity: 1; }
  100% { opacity: 0; }
}
`;

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* Cache le contenu principal pendant l'intro */
  document.documentElement.style.setProperty('--intro-body-opacity', '0');
  var bodyStyle = document.createElement('style');
  bodyStyle.textContent = 'body > *:not(#abs-intro) { opacity: 0; transition: opacity 0.6s ease; }';
  document.head.appendChild(bodyStyle);

  var overlay = document.createElement('div');
  overlay.id = 'abs-intro';
  overlay.innerHTML =
    '<div id="abs-intro-line"></div>' +
    '<div id="abs-intro-word">Absolution</div>' +
    '<div id="abs-intro-sub">Guilde &middot; FR</div>';
  document.body.appendChild(overlay);

  /* Fade out intro + fade in site simultanément */
  setTimeout(function () {
    overlay.classList.add('fade-out');
    bodyStyle.textContent = 'body > *:not(#abs-intro) { opacity: 1; transition: opacity 0.6s ease; }';
  }, 3400);

  setTimeout(function () {
    overlay.remove();
    style.remove();
    bodyStyle.remove();
  }, 4100);
})();
