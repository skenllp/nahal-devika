/* Nahal & Devika – cinematic scroll invitation. Scene order is fixed:
   palace video → door portal → lotus → couple → close-up → lotus arch portal → peacock arch → groom/bride → story photo → reception → final */
const D = weddingData, $ = s => document.querySelector(s);
const maps = (q, u) => u || "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
const first = s => s.split(",")[0].trim(), rest = s => s.split(",").slice(1).join(",").trim();
const N = 48, fUrl = i => `assets/frames/f${String(i).padStart(2, "0")}.webp`;
const ART = { lotus: "assets/art/lotus.webp", peacock: "assets/art/peacock.webp" };
const Ly = (id, a, mask = "", cls = "") => `<div class="ly ${cls}" id="${id}"${mask ? ` style="-webkit-mask-image:${mask};mask-image:${mask}"` : ""}><img data-s="${ART[a]}" alt="" draggable="false" decoding="async"></div>`;
const ph = (id, k, pos) => `<img id="${id}" data-s="${D.photos[k]}" alt="${D.groom} and ${D.bride}" draggable="false" decoding="async" style="object-position:${pos}">`;
const rnd = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join("");
const petals = rnd(7, i => `<span class="pet" style="left:${8 + i * 13}%;animation-delay:-${i * 2.6}s;animation-duration:${16 + i * 2}s"></span>`);
const flies = rnd(12, i => `<span class="fly" style="left:${8 + i * 7.5}%;top:${55 + (i * 13) % 40}%;animation-delay:-${i * .6}s"></span>`);
/* arch-shaped clip helper: same structure start→end so GSAP can tween it */
const CP = "round 50% 50% 0 0/28% 28% 0 0";
const clip = (t, r, b, l, rad = "50% 50% 3% 3%/60% 60% 0 0") => `inset(${t}% ${r}% ${b}% ${l}% round ${rad})`;
const CE = clip(0, 0, 0, 0, "0% 0% 0% 0%/0% 0% 0% 0%");

/* ---------- components (markup) ---------- */
const PeacockWorld = () => `<div id="peacock">
 ${Ly("kBg", "peacock")}<div class="ly fx"><div class="mist"></div></div>
 <div class="ly" id="story" style="visibility:hidden;opacity:0">${ph("stImg", "story", "50% 45%")}
  <div class="fx" id="sun" style="opacity:.15;background:radial-gradient(ellipse at 85% 6%,rgba(255,200,110,.9),transparent 60%);mix-blend-mode:screen"></div>
  <div class="fx" style="background:radial-gradient(ellipse at 50% 50%,transparent 60%,rgba(22,39,28,.45))"></div></div>
 ${Ly("kVin", "peacock", "radial-gradient(ellipse 12% 30% at 6% 45%,#000 55%,transparent 100%),radial-gradient(ellipse 12% 30% at 95% 45%,#000 55%,transparent 100%)", "vin")}
 ${Ly("kLamp", "peacock", "radial-gradient(ellipse 9% 9% at 50% 21%,#000 55%,transparent 100%)", "lamp")}
 <div class="ly fx glow" id="kGlow"><div></div></div>
 <div class="fx" id="kEve" style="opacity:0;background:linear-gradient(rgba(125,64,44,.75),rgba(22,39,28,.85));mix-blend-mode:multiply"></div>
 <div class="fx" id="kParts" style="opacity:0">${flies}</div></div>`;

const LotusWorld = () => `<div id="lotus">
 ${Ly("lBg", "lotus")}
 <div class="ly" id="lCouple"><div id="couple" style="position:absolute;left:29%;top:19.5%;width:42%;height:54%;overflow:hidden;border-radius:50% 50% 0 0/28% 28% 0 0;-webkit-mask-image:linear-gradient(#000 82%,transparent);mask-image:linear-gradient(#000 82%,transparent)">${ph("cpImg", "lotus", "46% 40%")}</div></div>
 <div class="ly" id="closeup" style="visibility:hidden;opacity:0">${ph("cuImg", "closeup", "56% 50%")}<div class="fx" style="background:radial-gradient(ellipse at 50% 45%,transparent 55%,rgba(22,39,28,.6))"></div></div>
 <div id="pk2">${PeacockWorld()}</div>
 ${Ly("lFol", "lotus", "radial-gradient(ellipse 26% 18% at 6% 8%,#000 50%,transparent 100%),radial-gradient(ellipse 26% 20% at 96% 10%,#000 50%,transparent 100%)", "sw")}
 <div class="ly fx" id="lWater"><div class="shimmer"></div></div>
 ${Ly("lFront", "lotus", "linear-gradient(to bottom,transparent 72%,#000 88%)", "sw")}
 <div class="ly fx" id="lPet">${petals}</div>
 <div class="fx" id="lWarm" style="opacity:0;background:linear-gradient(rgba(201,154,83,.4),rgba(199,93,118,.25));mix-blend-mode:soft-light"></div></div>`;

const OpeningWorld = () => `<div class="w" id="palace"><canvas id="vid" width="540" height="960"></canvas>
 <div class="fx" id="vig" style="opacity:0;background:radial-gradient(ellipse at 48.4% 58.8%,transparent 10%,rgba(10,16,12,.85) 70%)"></div>
 <div id="portal"><div id="glowIn"></div>${LotusWorld()}</div></div>`;

const Closing = () => `<div id="final"><div class="ly" id="fPhoto">${ph("fImg", "final", "50% 30%")}</div>
 <div class="w" style="pointer-events:none;z-index:6">${Ly("fFg", "lotus", "linear-gradient(to bottom,transparent 84%,#000 95%)")}</div>
 <div class="shade" style="background:linear-gradient(transparent 50%,rgba(22,39,28,.88))"></div></div>`;

const copy = `
<div class="tx hi on" id="tIntro"><h1 class="nm">${D.groom}<i>♥</i>${D.bride}</h1><p class="dt">${D.dateShort}</p></div>
<div class="tx" id="tJourney"><p class="it">Together with their families<br>invite you to celebrate their wedding</p></div>
<div class="tx" id="tCer"><p class="lb">Wedding Ceremony</p><p class="md">${D.weddingDay}</p><p class="lg">${D.weddingDate}</p></div>
<div class="tx" id="tMuh"><p class="lb">Muhurtham</p><p class="md">${D.muhurtham}</p></div>
<div class="tx" id="tVen"><p class="md">${D.weddingVenue}</p><p class="sm gap">${D.weddingAddress}</p><a class="btn" href="${maps(D.weddingVenue + ", " + D.weddingAddress, D.weddingMap)}" target="_blank" rel="noopener">View location</a></div>
<div class="tx lo" id="tNames"><p class="nm">${D.groom}</p><p class="it">&amp;</p><p class="nm">${D.bride}</p></div>
<div class="tx lo" id="tTog"><p class="it" style="font-size:clamp(1.4rem,7vw,2.1rem)">Together, always.</p></div>
<div class="tx dk" id="tGroom"><p class="lb">Groom</p><p class="lg">${D.groom}</p><p class="sm gap">Son of</p><p class="md" style="font-size:clamp(1.3rem,6vw,1.9rem)">${D.groomParents}</p><p class="sm gap">${first(D.groomAddress)}<br>${rest(D.groomAddress)}</p></div>
<div class="tx dk" id="tBride"><p class="lb">Bride</p><p class="lg">${D.bride}</p><p class="sm gap">Daughter of</p><p class="md" style="font-size:clamp(1.3rem,6vw,1.9rem)">${D.brideParents}</p><p class="sm gap">${first(D.brideAddress)}<br>${rest(D.brideAddress)}</p></div>
<div class="tx" id="tRec"><p class="lb">Reception Ceremony</p><p class="md">${D.receptionDate}</p><p class="lg" style="font-size:clamp(2rem,10vw,3.4rem)">${D.receptionTime}</p><p class="md gap" style="font-size:clamp(1.4rem,6.5vw,2.1rem)">${D.receptionVenue}</p><p class="sm">${first(D.receptionAddress)}<br>${rest(D.receptionAddress)}</p><a class="btn" href="${maps(D.receptionVenue + ", " + D.receptionAddress, D.receptionMap)}" target="_blank" rel="noopener">View location</a></div>
<div class="tx lo" id="tFinal"><p class="it">With love,</p><p class="nm">${D.groom} &amp; ${D.bride}</p><p class="sm gap">We look forward to celebrating with you.</p><p class="dt">${D.dateShort}</p></div>`;

$("#root").innerHTML = OpeningWorld() + Closing() +
  `<div class="shade" id="scrimT" style="background:linear-gradient(rgba(22,39,28,.6),transparent 38%)"></div>
   <div class="shade" id="scrimL" style="opacity:0;background:linear-gradient(rgba(22,39,28,.1),rgba(22,39,28,.55) 45%,rgba(22,39,28,.7))"></div>` + copy + `<div id="hint">SCROLL</div>`;

/* ---------- reduced motion: calm static story ---------- */
if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.body.classList.add("rm");
  [[fUrl(0), ["tIntro"]], [ART.lotus, ["tCer", "tMuh", "tVen"]], [D.photos.lotus, ["tNames"]], [ART.peacock, ["tGroom", "tBride", "tRec"]], [D.photos.final, ["tFinal"]]].forEach(([u, ids]) => {
    const s = document.createElement("section"); s.className = "rmS"; s.style.backgroundImage = `linear-gradient(rgba(22,39,28,.35),rgba(22,39,28,.35)),url(${u})`;
    ids.forEach(id => { const c = document.getElementById(id).cloneNode(true); c.removeAttribute("id"); c.classList.add("on"); s.appendChild(c) }); $("#static").appendChild(s);
  });
} else {
  /* ---------- progressive frame sequence: coarse keyframes stay, a sliding window is decoded around the playhead ---------- */
  const cv = $("#vid"), cx = cv.getContext("2d"), st = { v: 0 }, cache = [], pend = [];
  const draw = () => {
    const t = st.v * (N - 1), i = Math.floor(t), f = t - i;
    const near = k => { for (let d = 0; d < N; d++) { if (cache[k - d]) return cache[k - d]; if (cache[k + d]) return cache[k + d] } };
    const a = near(i); if (!a) return; cx.globalAlpha = 1; cx.drawImage(a, 0, 0, 540, 960);
    const b = cache[Math.min(N - 1, i + 1)]; if (f > .03 && b && b !== a) { cx.globalAlpha = f; cx.drawImage(b, 0, 0, 540, 960); cx.globalAlpha = 1 }
  };
  const load = i => { if (i < 0 || i >= N || cache[i] || pend[i]) return; pend[i] = 1; const im = new Image(); im.decoding = "async"; im.onload = () => { cache[i] = im; pend[i] = 0; draw(); if (i === 0) boot() }; im.onerror = () => pend[i] = 0; im.src = fUrl(i) };
  const want = c => { for (let d = -5; d <= 8; d++) load(c + d); cache.forEach((im, i) => { if (im && i % 4 && Math.abs(i - c) > 12) cache[i] = null }) };
  const hy = ids => ids.forEach(id => { const e = document.getElementById(id); if (e && !e.src) e.src = e.dataset.s });
  const boot = () => {           // after the first frame: coarse frames → artwork → photos, one step at a time
    for (let i = 4; i < N; i += 4) load(i); load(N - 1);
    setTimeout(() => document.querySelectorAll('img[data-s^="assets/art"]').forEach(e => e.src = e.dataset.s), 700);
    setTimeout(() => hy(["cpImg", "cuImg"]), 2200); setTimeout(() => hy(["stImg", "fImg"]), 4200);
  };
  load(0);

  gsap.registerPlugin(ScrollTrigger);
  try { const lenis = new Lenis({ lerp: .1 }); lenis.on("scroll", ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0) } catch (e) { }
  const ARCH = "50% 32%";
  gsap.set("#lBg,#lCouple,#lFol,#lFront,#lWater,#lPet", { transformOrigin: ARCH });
  gsap.set("#vid", { transformOrigin: "48.4% 58.8%" });
  const T = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: "#spacer", start: "top top", end: "bottom bottom", scrub: 1 } });
  const show = (s, a, b) => { T.fromTo(s, { autoAlpha: 0, scale: 1.08 }, { autoAlpha: 1, scale: 1, duration: 2, ease: "power2.out" }, a); if (b) T.to(s, { autoAlpha: 0, scale: .96, duration: 1.6 }, b) };

  /* OpeningWorld + PalaceJourney (0–17): scroll scrubs the camera-flight frames */
  T.to(st, { v: 1, duration: 17, onUpdate() { draw(); want(Math.round(st.v * (N - 1))) } }, 0);
  T.to("#tIntro", { autoAlpha: 0, scale: 1.06, duration: 3 }, .5).to("#hint", { autoAlpha: 0, duration: 1 }, .2).to("#scrimT", { opacity: 0, duration: 3 }, .5);
  show("#tJourney", 4, 10);

  /* DoorPortal (11–20): the glowing doorway itself becomes a window; the camera keeps pushing until the window fills the screen.
     portal scales by s, lotus inside counter-scales so lotus ends at exactly 1:1 */
  const Q = { v: 0 };
  const portalApply = () => { const v = Q.v, s = 1 + 6 * v * v; gsap.set("#portal", { scale: s }); gsap.set("#lotus", { scale: (1.15 - .15 * v) / s }); gsap.set("#vid", { scale: 1 + .25 * v * v }) };
  T.to("#vig", { opacity: 1, duration: 2.5 }, 11).to("#portal", { opacity: 1, duration: 1 }, 12.5)
    .to("#lotus", { opacity: 1, duration: 2.5 }, 14).to("#glowIn", { opacity: 0, duration: 4 }, 14.5)
    .to(Q, { v: 1, duration: 6.5, onUpdate: portalApply }, 13.5)
    .set("#portal", { scale: 1, overflow: "visible", borderRadius: 0 }, 20).set("#lotus", { scale: 1 }, 20).set("#vid", { autoAlpha: 0 }, 20);

  /* LotusWorld (13–36) */
  T.fromTo("#lBg", { scale: 1.5, yPercent: -22 }, { scale: 1, yPercent: 0, duration: 23, ease: "power1.out" }, 13)
    .fromTo("#lFront", { scale: 1.8, yPercent: -30 }, { scale: 1, yPercent: 0, duration: 23, ease: "power1.out" }, 13)
    .fromTo("#lFol", { scale: 1.9, yPercent: -15 }, { scale: 1, yPercent: 0, duration: 23, ease: "power1.out" }, 13)
    .fromTo("#lWater", { scale: 1.5, yPercent: -22 }, { scale: 1, yPercent: 0, duration: 23, ease: "power1.out" }, 13)
    .to("#scrimL", { opacity: 1, duration: 2 }, 19);
  show("#tCer", 20, 25); show("#tMuh", 26, 30.5); show("#tVen", 31, 36.5);

  /* CoupleReveal (37–46): photo rises into the heritage arch, lotus foliage stays in front */
  T.fromTo("#couple", { autoAlpha: 0, scale: .94, yPercent: 4, clipPath: `inset(100% 0 0 0 ${CP})` }, { autoAlpha: 1, scale: 1, yPercent: 0, clipPath: `inset(0% 0 0 0 ${CP})`, duration: 5, ease: "power2.out" }, 37)
    .to("#couple", { yPercent: -3, duration: 9 }, 42);
  show("#tNames", 39, 46.5);

  /* Cinematic close-up (46–64): the arch opens out to a near full-screen photograph */
  T.fromTo("#closeup", { autoAlpha: 0, clipPath: clip(19, 27.5, 56, 28.5) }, { autoAlpha: 1, clipPath: CE, duration: 4, ease: "power2.inOut" }, 46.5)
    .fromTo("#cuImg", { scale: 1.02, yPercent: 2 }, { scale: 1.16, yPercent: -2, duration: 17 }, 46.5)
    .to("#lFol", { scale: 1.12, duration: 12 }, 46).to("#scrimL", { opacity: 0, duration: 3 }, 47)
    .to("#couple", { autoAlpha: 0, duration: 1 }, 50);
  show("#tTog", 53, 58.5);
  T.to("#closeup", { autoAlpha: 0, duration: 6 }, 58);

  /* LotusPortal (58–71): the arch grows around the camera; the peacock arch is seen through it, then fills the screen */
  const S = { v: 0 };
  const archApply = () => { const v = S.v, s = 1 + 6 * v * v;
    gsap.set("#lBg,#lCouple,#lWater,#lPet,#pk2", { scale: s }); gsap.set("#lFol", { scale: 1.12 + 9 * v * v }); gsap.set("#lFront", { scale: 1 + 13 * v * v });
    gsap.set("#peacock", { scale: (1.3 - .3 * v) / s }) };
  T.to("#pk2", { autoAlpha: 1, duration: 3 }, 58.5).to("#lWarm", { opacity: 1, duration: 10 }, 58)
    .to(S, { v: 1, duration: 11.5, onUpdate: archApply }, 59)
    .set(["#lBg", "#lFol", "#lFront", "#lWater", "#lPet", "#lCouple", "#lWarm", "#closeup"], { autoAlpha: 0 }, 70.6)
    .set("#pk2", { scale: 1, overflow: "visible", borderRadius: 0 }, 70.6).set("#peacock", { scale: 1 }, 70.6);

  /* PeacockWorld: Groom, Bride (71–86) */
  show("#tGroom", 71, 77.5); show("#tBride", 78.5, 85.5);

  /* Second photo moment (86–97): arch-shaped reveal, slow zoom-out, warm light, vines in front */
  T.fromTo("#story", { autoAlpha: 0, clipPath: clip(30, 20, 30, 20, "50% 50% 0 0/25% 25% 0 0") }, { autoAlpha: 1, clipPath: CE, duration: 4, ease: "power2.inOut" }, 86)
    .fromTo("#stImg", { scale: 1.16, yPercent: 2.5 }, { scale: 1, yPercent: -2, duration: 12 }, 86)
    .fromTo("#sun", { opacity: .15 }, { opacity: .6, duration: 8 }, 86)
    .to("#story", { autoAlpha: 0, duration: 2.5 }, 94.5);

  /* Reception (96–107): day melts into warm evening */
  T.to("#kEve", { opacity: .7, duration: 5 }, 95).to("#kGlow", { scale: 1.25, duration: 6 }, 95).to("#kParts", { opacity: 1, duration: 5 }, 97);
  show("#tRec", 98.5, 106);

  /* ClosingPortrait (106–120) */
  T.fromTo("#final", { autoAlpha: 0, clipPath: clip(30, 20, 30, 20, "50% 50% 0 0/25% 25% 0 0") }, { autoAlpha: 1, clipPath: CE, duration: 4, ease: "power2.inOut" }, 106.5)
    .fromTo("#fPhoto", { scale: 1 }, { scale: 1.12, duration: 13.5 }, 106.5).fromTo("#fFg", { scale: 1.35 }, { scale: 1, duration: 9, ease: "power1.out" }, 106.5)
    .to("#kParts", { opacity: 0, duration: 2 }, 107);
  show("#tFinal", 111);
  T.to({}, { duration: 0 }, 120);
}
