/* surprise-addon.js
 * Adds an animated surprise AFTER the YES response in "Our Forever Chapter".
 * - Nothing is shown before YES is clicked.
 * - Existing YES handler runs first (yesResponse appears), then the surprise after CONFIG.proposal.yesSurprise.delayMs.
 * - HUG button and everything else are untouched.
 * Load AFTER config.js and your main script:
 *   <script src="config.js"></script>
 *   <script src="app.js"></script>
 *   <script src="surprise-addon.js"></script>
 */
(function () {
  // ---- If your IDs/classes differ, edit these three lines only ----
  var YES_SELECTOR = '#yesBtn, #yes-btn, #proposalYes, [data-action="yes"], .yes-btn';
  var YES_RESPONSE_SELECTOR = '#yesResponse, #yes-response, #proposalResponse, .yes-response';
  var HUG_SELECTOR = '#hugBtn, #hug-btn, [data-action="hug"], .hug-btn';
  // ------------------------------------------------------------------

  var cfg = (window.CONFIG && CONFIG.proposal && CONFIG.proposal.yesSurprise) || null;
  if (!cfg || cfg.enabled === false) return;

  var shown = false, card = null, audio = null;

  var css = '' +
  '.ys-card{position:relative;margin:22px auto 8px;max-width:560px;padding:26px 22px 22px;border-radius:20px;' +
  'background:radial-gradient(circle at 50% 0%,rgba(255,215,130,.18),rgba(120,10,25,.92) 70%);' +
  'border:1px solid rgba(255,200,120,.45);box-shadow:0 0 40px rgba(229,9,20,.45),inset 0 0 30px rgba(255,200,120,.08);' +
  'color:#fff;text-align:center;overflow:hidden;opacity:0;transform:translateY(24px) scale(.96);' +
  'animation:ysIn .9s cubic-bezier(.2,.8,.2,1) forwards}' +
  '.ys-card.ys-fixed{position:fixed;left:50%;bottom:18px;margin:0;width:min(92vw,560px);z-index:9999;' +
  'transform:translate(-50%,24px) scale(.96);animation-name:ysInFixed;max-height:80vh;overflow:auto}' +
  '.ys-title{font-size:1.35rem;font-weight:700;margin:0 0 14px;background:linear-gradient(90deg,#ffd98a,#ff6b81,#ffd98a);' +
  'background-size:200% auto;-webkit-background-clip:text;background-clip:text;color:transparent;animation:ysShine 3s linear infinite}' +
  '.ys-line{margin:10px 0;line-height:1.55;opacity:0;transform:translateY(10px);animation:ysLine .8s ease forwards}' +
  '.ys-sign{margin-top:16px;font-style:italic;color:#ffd98a;opacity:0;animation:ysLine .8s ease forwards}' +
  '.ys-heart{position:absolute;bottom:-20px;font-size:18px;opacity:0;pointer-events:none;animation:ysFloat 4.5s ease-in infinite}' +
  '.ys-close{position:absolute;top:8px;right:12px;background:none;border:0;color:#fff;font-size:20px;cursor:pointer;opacity:.7}' +
  '@keyframes ysIn{to{opacity:1;transform:translateY(0) scale(1)}}' +
  '@keyframes ysInFixed{to{opacity:1;transform:translate(-50%,0) scale(1)}}' +
  '@keyframes ysLine{to{opacity:1;transform:translateY(0)}}' +
  '@keyframes ysShine{to{background-position:200% center}}' +
  '@keyframes ysFloat{0%{opacity:0;transform:translateY(0) scale(.6)}15%{opacity:.9}100%{opacity:0;transform:translateY(-260px) scale(1.2)}}' +
  '@media (prefers-reduced-motion:reduce){.ys-card,.ys-line,.ys-sign{animation-duration:.01s!important}.ys-heart,.ys-title{animation:none!important}}';
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  function build() {
    var c = document.createElement('div');
    c.className = 'ys-card';
    c.setAttribute('role', 'status');
    c.setAttribute('aria-live', 'polite');

    var close = document.createElement('button');
    close.className = 'ys-close';
    close.setAttribute('aria-label', 'Close surprise');
    close.textContent = '×';
    close.onclick = function () { c.remove(); };
    c.appendChild(close);

    var t = document.createElement('h3');
    t.className = 'ys-title';
    t.textContent = cfg.title || 'One more surprise... 🎁';
    c.appendChild(t);

    var step = 0.9;
    (cfg.lines || []).forEach(function (txt, i) {
      var p = document.createElement('p');
      p.className = 'ys-line';
      p.style.animationDelay = (0.6 + i * step) + 's';
      p.textContent = txt;           // textContent keeps emojis/Hinglish safe
      c.appendChild(p);
    });

    if (cfg.signature) {
      var s = document.createElement('p');
      s.className = 'ys-sign';
      s.style.animationDelay = (0.6 + (cfg.lines || []).length * step + 0.4) + 's';
      s.textContent = cfg.signature;
      c.appendChild(s);
    }

    for (var i = 0; i < 12; i++) {
      var h = document.createElement('span');
      h.className = 'ys-heart';
      h.textContent = ['❤️', '💖', '✨', '💗'][i % 4];
      h.style.left = (4 + Math.random() * 90) + '%';
      h.style.animationDelay = (Math.random() * 4) + 's';
      c.appendChild(h);
    }
    return c;
  }

  function playSong() {
    if (!cfg.song) return;
    try {
      document.querySelectorAll('audio').forEach(function (a) { a.pause(); }); // avoid overlap
      audio = new Audio(cfg.song);
      audio.loop = true;
      audio.volume = 0.7;
      audio.play().catch(function () {});
    } catch (e) {}
  }

  function showSurprise() {
    if (shown) return;
    shown = true;
    card = build();
    var resp = document.querySelector(YES_RESPONSE_SELECTOR);
    if (resp && resp.parentNode) {
      resp.parentNode.insertBefore(card, resp.nextSibling);   // right under the YES message
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      card.classList.add('ys-fixed');                          // fallback: floating card
      document.body.appendChild(card);
    }
    playSong();
  }

  // Delegated listener: works even if the proposal UI is rendered later.
  document.addEventListener('click', function (e) {
    if (shown) return;
    var yes = e.target.closest && e.target.closest(YES_SELECTOR);
    if (!yes) return;
    if (HUG_SELECTOR && yes.matches(HUG_SELECTOR)) return;
    // setTimeout lets the existing YES handler show yesResponse FIRST.
    setTimeout(showSurprise, Math.max(0, cfg.delayMs == null ? 3500 : cfg.delayMs));
  });

  // Optional: call this if your site lets her replay the proposal.
  window.resetYesSurprise = function () {
    shown = false;
    if (card) card.remove();
    if (audio) { audio.pause(); audio = null; }
  };
})();
