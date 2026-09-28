/* Background music: starts on the first tap/click/key (browsers block autoplay), toggle button top-right. */
(function () {
  var a = document.getElementById("bgm"), b = document.getElementById("music");
  if (!a || !b) return;
  var TARGET = 0.5, want = true, fade = null, playing = false;
  function ramp(to, done) {
    clearInterval(fade);
    fade = setInterval(function () {
      var v = a.volume, d = to - v;
      if (Math.abs(d) < 0.03) { a.volume = to; clearInterval(fade); done && done(); }
      else a.volume = Math.max(0, Math.min(1, v + (d > 0 ? 0.03 : -0.03)));
    }, 60);
  }
  function ui(on) { b.classList.toggle("muted", !on); b.setAttribute("aria-pressed", on ? "true" : "false"); }
  function play() {
    a.volume = 0;
    var p = a.play();
    (p && p.then ? p : Promise.resolve()).then(function () { playing = true; ui(true); ramp(TARGET); }).catch(function () { ui(false); });
  }
  function pause() { ramp(0, function () { a.pause(); playing = false; }); ui(false); }
  var evs = ["pointerdown", "touchend", "keydown", "click"];
  function first(e) {
    if (e.target && b.contains(e.target)) return;
    evs.forEach(function (n) { document.removeEventListener(n, first, true); });
    if (want) play();
  }
  evs.forEach(function (n) { document.addEventListener(n, first, true); });
  b.addEventListener("click", function () {
    evs.forEach(function (n) { document.removeEventListener(n, first, true); });
    if (playing) { want = false; pause(); } else { want = true; play(); }
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && playing) a.pause(); else if (!document.hidden && playing) a.play().catch(function () {});
  });
})();
