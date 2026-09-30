/* ============================================================
   Nahal & Devika · cinematic flow controller
   Opening video (autoplay) → hero → scroll journey

   The cover is the video's own first frame. It stays up silently
   until the video is really playing, so there is never a blank
   beat. If the browser blocks autoplay, the cover shows a
   "Tap to Open" button and the tap starts the same video.
   ============================================================ */
(function () {
  'use strict';

  var body = document.body;
  var landing = document.getElementById('landing');
  var openBtn = document.getElementById('openBtn');
  var revealBox = document.getElementById('reveal');
  var video = document.getElementById('revealVideo');
  var skipBtn = document.getElementById('skipBtn');
  var heroImg = document.getElementById('heroImg');

  var COVER_FADE_MS = 420;
  var READY_TIMEOUT_MS = 10000;
  var PLAY_SAFETY_MS = 14000;

  /* ---------------------------------------------------------
     0 · Ambient audio  ·  disc control + play after cover open
     --------------------------------------------------------- */
  var bgAudio = document.getElementById('bgAudio');
  var audioBtn = document.getElementById('audioBtn');
  var audioStarted = false;

  function setAudioUi(playing) {
    if (!audioBtn) return;
    audioBtn.classList.toggle('is-playing', playing);
    audioBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    audioBtn.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
  }

  function showAudioControl() {
    if (!audioBtn) return;
    audioBtn.hidden = false;
    requestAnimationFrame(function () {
      audioBtn.classList.add('is-visible');
    });
  }

  function startAmbientAudio() {
    if (!bgAudio || audioStarted) return;
    audioStarted = true;
    showAudioControl();

    bgAudio.volume = 0.72;
    var play = bgAudio.play();
    if (play && play.then) {
      play.then(function () {
        setAudioUi(true);
      }).catch(function () {
        /* Blocked — control stays visible so the guest can tap it */
        audioStarted = false;
        setAudioUi(false);
      });
    } else if (!bgAudio.paused) {
      setAudioUi(true);
    }
  }

  /* Music starts on the first interaction the browser accepts as a gesture
     (tap / click / key). Listeners stay armed until playback really begins,
     and never override a guest who paused the music. */
  var userPaused = false;
  var gestureEvents = ['pointerup', 'touchend', 'click', 'keydown'];
  function onFirstGesture() {
    if (userPaused || !bgAudio) return;
    audioStarted = true;
    showAudioControl();
    bgAudio.volume = 0.72;
    var p = bgAudio.play();
    if (p && p.then) {
      p.then(disarmGesture).catch(function () { audioStarted = false; });
    } else {
      disarmGesture();
    }
  }
  function disarmGesture() {
    gestureEvents.forEach(function (ev) { document.removeEventListener(ev, onFirstGesture, true); });
  }
  if (bgAudio) {
    gestureEvents.forEach(function (ev) { document.addEventListener(ev, onFirstGesture, true); });
  }

  function toggleAmbientAudio() {
    if (!bgAudio) return;
    if (bgAudio.paused) {
      userPaused = false;
      var play = bgAudio.play();
      if (play && play.then) {
        play.then(function () { setAudioUi(true); }).catch(function () { setAudioUi(false); });
      } else {
        setAudioUi(!bgAudio.paused);
      }
    } else {
      userPaused = true;
      bgAudio.pause();
      setAudioUi(false);
    }
  }

  if (audioBtn) audioBtn.addEventListener('click', toggleAmbientAudio);
  if (bgAudio) {
    bgAudio.addEventListener('play', function () { setAudioUi(true); });
    bgAudio.addEventListener('pause', function () { setAudioUi(false); });
    bgAudio.addEventListener('ended', function () { setAudioUi(false); });
  }

  /* ---------------------------------------------------------
     1 · Image fallback chain + graceful placeholders
     --------------------------------------------------------- */
  function markMissing(img) {
    img.classList.add('failed');
    var host = img.parentElement;
    if (!host) return;

    if (img.classList.contains('cover-img') || img.classList.contains('section-bg') || img.classList.contains('bleed') || img.id === 'heroImg') {
      if (host.classList.contains('landing-media') || host.classList.contains('scene-frame') || host.classList.contains('scene') || host.id === 'reveal') {
        host.classList.add('fallback-on');
      }
    } else if (host.classList.contains('portrait') || host.classList.contains('tile') || host.classList.contains('photo-card__paper')) {
      var emptyHost = host.classList.contains('photo-card__paper') ? host.closest('.photo-card') || host : host;
      emptyHost.classList.add('is-empty');
      emptyHost.setAttribute('data-label', img.getAttribute('data-placeholder') || 'Photo');
      if (host.classList.contains('photo-card__paper')) {
        host.setAttribute('data-label', img.getAttribute('data-placeholder') || 'Photo');
      }
    }
  }

  function wireImage(img) {
    var queue = (img.getAttribute('data-fallbacks') || '')
      .split(',').map(function (s) { return s.trim(); }).filter(Boolean);

    img.addEventListener('error', function () {
      if (queue.length) { img.src = queue.shift(); return; }
      markMissing(img);
    });

    if (img.complete && img.naturalWidth === 0) {
      if (queue.length) img.src = queue.shift();
      else markMissing(img);
    }
  }

  Array.prototype.forEach.call(
    document.querySelectorAll('img[data-fallbacks], img[data-placeholder]'),
    wireImage
  );

  /* ---------------------------------------------------------
     2 · Scroll lock
     --------------------------------------------------------- */
  function blockTouch(e) { if (body.classList.contains('is-locked')) e.preventDefault(); }
  document.addEventListener('touchmove', blockTouch, { passive: false });

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  function jumpToTop() {
    var root = document.documentElement;
    var prev = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    root.style.scrollBehavior = prev;
  }

  function unlockScroll() {
    body.classList.remove('is-locked');
    jumpToTop();
  }

  /* ---------------------------------------------------------
     3 · Video preload  ·  starts the moment the page opens
     --------------------------------------------------------- */
  var videoReady = false;
  var opening = false;
  var finished = false;
  var safety = 0;
  var readyWait = 0;

  function markVideoReady() {
    videoReady = true;
  }

  function isVideoReady() {
    /* HAVE_FUTURE_DATA (3) / HAVE_ENOUGH_DATA (4) — enough to start without a stall */
    return video && !video.error && video.readyState >= 3;
  }

  function beginVideoPreload() {
    if (!video) return;

    video.muted = true;
    video.setAttribute('muted', '');
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.preload = 'auto';

    /* Force the network request even when the element is hidden */
    try { video.load(); } catch (e) {}

    var onReady = function () {
      markVideoReady();
      video.removeEventListener('canplay', onReady);
      video.removeEventListener('canplaythrough', onReady);
      video.removeEventListener('loadeddata', onReady);
    };

    video.addEventListener('canplay', onReady);
    video.addEventListener('canplaythrough', onReady);
    video.addEventListener('loadeddata', onReady);

    if (isVideoReady()) markVideoReady();
  }

  beginVideoPreload();

  /* ---------------------------------------------------------
     4 · Hero gate  ·  never show until bg is loaded + decoded
     --------------------------------------------------------- */
  var heroEl = document.getElementById('hero');
  var heroReadyPromise = null;
  var heroIsReady = false;
  var TEXT_REVEAL_MS = 520; /* after .loaded fade starts */

  var HERO_CANDIDATES = (
    (heroImg && heroImg.getAttribute('data-candidates')) ||
    'assets/hero/hero.webp'
  ).split(',').map(function (s) { return s.trim(); }).filter(Boolean);

  function loadAndDecodeUrl(url) {
    return new Promise(function (resolve, reject) {
      var probe = new Image();
      probe.decoding = 'async';

      function succeed() {
        if (probe.decode) {
          probe.decode().then(function () { resolve(url); }).catch(function () { resolve(url); });
        } else {
          resolve(url);
        }
      }

      probe.onload = succeed;
      probe.onerror = function () { reject(new Error('fail ' + url)); };
      probe.src = url;

      /* Cached image may already be complete */
      if (probe.complete && probe.naturalWidth > 0) succeed();
    });
  }

  function firstAvailable(urls, index) {
    index = index || 0;
    if (index >= urls.length) {
      return Promise.reject(new Error('no hero asset'));
    }
    return loadAndDecodeUrl(urls[index]).catch(function () {
      return firstAvailable(urls, index + 1);
    });
  }

  function warmFonts() {
    if (!(document.fonts && document.fonts.load)) return Promise.resolve();
    return Promise.all([
      document.fonts.load('300 48px "Cormorant Garamond"'),
      document.fonts.load('400 18px Marcellus')
    ]).catch(function () {});
  }

  function applyHeroUrl(url) {
    if (!heroImg || !url) return Promise.resolve();
    heroImg.src = url;
    if (heroImg.decode) {
      return heroImg.decode().catch(function () {});
    }
    return Promise.resolve();
  }

  function ensureHeroReady() {
    if (heroIsReady) return Promise.resolve(true);
    if (heroReadyPromise) return heroReadyPromise;

    heroReadyPromise = firstAvailable(HERO_CANDIDATES)
      .then(function (url) {
        return applyHeroUrl(url).then(function () { return url; });
      })
      .then(function () {
        return warmFonts();
      })
      .then(function () {
        heroIsReady = true;
        if (heroEl) {
          /* Paint one frame while still under the video / hidden */
          void heroEl.offsetWidth;
        }
        return true;
      })
      .catch(function () {
        /* Absolute fallback — paint the PNG rather than stall forever */
        if (heroImg) heroImg.src = 'assets/hero/hero.webp';
        heroIsReady = true;
        return false;
      });

    return heroReadyPromise;
  }

  /* Start hero preload once the intro has enough video data (video wins the pipe) */
  function scheduleHeroWarm() {
    if (heroReadyPromise) return;
    if (isVideoReady() || !video) {
      ensureHeroReady();
      return;
    }
    var once = function () {
      video.removeEventListener('canplay', once);
      ensureHeroReady();
    };
    video.addEventListener('canplay', once);
    setTimeout(function () { ensureHeroReady(); }, 5000);
  }

  if (document.readyState === 'complete') scheduleHeroWarm();
  else window.addEventListener('load', scheduleHeroWarm);

  /* ---------------------------------------------------------
     5 · Landing → video → hero
     --------------------------------------------------------- */
  function revealHeroAndSite() {
    if (heroEl) {
      heroEl.classList.add('loaded');
      heroEl.setAttribute('aria-busy', 'false');
    }

    body.classList.add('is-revealed');
    unlockScroll();
    showAudioControl();
    initReveals();
    initGalleryWall();
    initPeacock();
    activateLazySections();

    /* Background fade first; typography follows */
    setTimeout(function () {
      if (heroEl) heroEl.classList.add('text-ready');
    }, TEXT_REVEAL_MS);

    revealBox.classList.remove('is-armed', 'is-on');
    revealBox.classList.add('is-out', 'is-live');

    setTimeout(function () {
      revealBox.classList.add('is-gone');
      revealBox.setAttribute('aria-hidden', 'true');
      try {
        video.pause();
        video.removeAttribute('src');
        while (video.firstChild) video.removeChild(video.firstChild);
        video.load();
      } catch (e) {}
    }, 900);
  }

  function finishReveal() {
    if (finished) return;
    finished = true;
    clearTimeout(safety);
    clearTimeout(readyWait);

    /* Freeze the last frame so the visitor never sees black while Hero decodes */
    try {
      video.pause();
      if (video.duration && isFinite(video.duration)) {
        video.currentTime = Math.max(0, video.duration - 0.05);
      }
    } catch (e) {}

    ensureHeroReady().then(function () {
      revealHeroAndSite();
    });
  }

  function startPlaybackUnderCover() {
    if (finished) return;

    /* Decode Hero in parallel while the visitor watches the video */
    ensureHeroReady();

    /* Arm the video layer UNDER the cover (z-index 60 < 70).
       It paints and plays while the cover still hides it. */
    revealBox.classList.add('is-armed');
    revealBox.removeAttribute('aria-hidden');

    try { video.currentTime = 0; } catch (e) {}

    var coverLifted = false;
    function liftCover() {
      if (coverLifted || finished) return;
      coverLifted = true;

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          landing.classList.remove('is-opening');
          landing.classList.add('is-out');

          setTimeout(function () {
            landing.classList.add('is-gone');
            revealBox.classList.add('is-on', 'is-live');
            revealBox.classList.remove('is-armed');
          }, COVER_FADE_MS);
        });
      });
    }

    function onPlaying() {
      video.removeEventListener('playing', onPlaying);
      liftCover();
      ensureHeroReady();
    }
    video.addEventListener('playing', onPlaying);

    var attempt = video.play();
    if (attempt && attempt.then) {
      attempt.then(function () {
        if (!video.paused) liftCover();
      }).catch(function () {
        video.muted = true;
        video.setAttribute('muted', '');
        var retry = video.play();
        if (retry && retry.then) {
          retry.then(function () {
            if (!video.paused) liftCover();
          }).catch(function () {
            video.removeEventListener('playing', onPlaying);
            finishReveal();
          });
        } else {
          video.removeEventListener('playing', onPlaying);
          finishReveal();
        }
      });
    } else if (!video.paused) {
      liftCover();
    }

    /* Tap path: never leave the cover up for long. Autoplay path: wait for
       the real "playing" event so the video is never shown while frozen. */
    setTimeout(function () {
      if (!coverLifted && !finished) liftCover();
    }, 900);

    setTimeout(function () { if (!finished && skipBtn) skipBtn.hidden = false; }, 5000);

    safety = setTimeout(function () {
      if (!finished && (video.readyState < 2 || video.paused)) finishReveal();
    }, PLAY_SAFETY_MS);
  }

  function whenVideoReady(done) {
    if (isVideoReady() || videoReady) {
      done();
      return;
    }

    var settled = false;
    function settle() {
      if (settled) return;
      settled = true;
      video.removeEventListener('canplay', settle);
      video.removeEventListener('canplaythrough', settle);
      video.removeEventListener('loadeddata', settle);
      clearTimeout(readyWait);
      done();
    }

    video.addEventListener('canplay', settle);
    video.addEventListener('canplaythrough', settle);
    video.addEventListener('loadeddata', settle);

    /* Keep nudging the buffer while the cover stays up */
    try { video.load(); } catch (e) {}

    readyWait = setTimeout(settle, READY_TIMEOUT_MS);
  }

  function openInvitation() {
    if (opening || finished) return;

    opening = true;
    if (openBtn) openBtn.disabled = true;
    landing.classList.add('is-opening');

    /* Kick off music in the same user gesture so unmuted play is allowed */
    startAmbientAudio();

    if (!video) { finishReveal(); return; }
    whenVideoReady(startPlaybackUnderCover);
  }


  if (openBtn) openBtn.addEventListener('click', openInvitation);
  if (landing) {
    /* Whole cover is tappable — button is the primary affordance */
    landing.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a, button')) return;
      openInvitation();
    });
  }
  if (skipBtn) skipBtn.addEventListener('click', finishReveal);

  if (video) {
    video.addEventListener('ended', finishReveal);
    video.addEventListener('error', function () {
      if (opening && !finished) finishReveal();
    });
    video.addEventListener('timeupdate', function () {
      if (video.duration && video.duration - video.currentTime < 0.12) finishReveal();
    });
    /* Re-warm hero mid-playback in case the early pass was aborted */
    video.addEventListener('playing', function () { ensureHeroReady(); }, { once: true });
  }

  /* ---------------------------------------------------------
     6 · Scroll reveals  ·  start only after the site is visible
     --------------------------------------------------------- */
  var revealsStarted = false;
  function initReveals() {
    if (revealsStarted) return;
    revealsStarted = true;

    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(els, function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(els, function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------
     7 · Lazy sections  ·  hydrate gallery / portrait srcs late
     --------------------------------------------------------- */
  function activateLazySections() {
    /* Native lazy already covers gallery + portraits. This only
       upgrades any data-src deferrals if present. */
    Array.prototype.forEach.call(
      document.querySelectorAll('#gallery img[data-src], #couple img[data-src]'),
      function (img) {
        if (!img.getAttribute('src')) {
          img.src = img.getAttribute('data-src');
          img.removeAttribute('data-src');
        }
      }
    );
  }

  /* ---------------------------------------------------------
     7b · Gallery photo wall  ·  enter / float / parallax / touch
     --------------------------------------------------------- */
  function initGalleryWall() {
    var wall = document.getElementById('photoWall');
    if (!wall) return;

    var cards = wall.querySelectorAll('.photo-card');
    if (!cards.length) return;

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function revealCard(card) {
      if (card.classList.contains('is-in')) return;
      card.classList.add('is-in');
    }

    if (reduceMotion || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(cards, revealCard);
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          revealCard(en.target);
          io.unobserve(en.target);
        });
      }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
      Array.prototype.forEach.call(cards, function (card) { io.observe(card); });
    }

    /* Touch bounce + soft glow */
    Array.prototype.forEach.call(cards, function (card) {
      var clearTouch = function () {
        card.classList.remove('is-touched');
      };
      card.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse') return;
        card.classList.add('is-touched');
        window.setTimeout(clearTouch, 560);
      }, { passive: true });
    });

    if (reduceMotion) return;

    /* Subtle scroll parallax — different speeds per card */
    var ticking = false;
    var speeds = [];
    Array.prototype.forEach.call(cards, function (card, i) {
      var raw = parseFloat(card.getAttribute('data-speed'));
      speeds[i] = isNaN(raw) ? ((i % 2 === 0) ? 0.05 : -0.04) : raw;
    });

    function updateParallax() {
      ticking = false;
      var vh = window.innerHeight || 1;
      var mid = vh * 0.5;
      for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        if (!card.classList.contains('is-in')) continue;
        var rect = card.getBoundingClientRect();
        /* Skip far-offscreen work */
        if (rect.bottom < -80 || rect.top > vh + 80) continue;
        var offset = (rect.top + rect.height * 0.5 - mid) * speeds[i];
        /* Clamp to keep motion almost invisible */
        if (offset > 18) offset = 18;
        if (offset < -18) offset = -18;
        card.style.setProperty('--parallax-y', offset.toFixed(2) + 'px');
      }
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateParallax);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------------
     7c · Peacock walk  ·  cinematic, strictly scroll-scrubbed
     The section is one pinned stage. Scroll progress p (0 → 1) drives:

       0.00–0.20  peacock enters from the left
       0.20–0.55  peacock walks, "Two families, one celebration" shown
       0.55–0.70  intro text fades, background softens, peacock slows
       0.70–0.82  golden feather detaches and floats to the centre
       0.82–0.92  feather sweeps across; "Nahal & Devika" is written
       0.92–1.00  date + blessing appear, peacock/feather fade, hand-off

     Nothing is timed except the 260ms stagger between the two intro
     lines. Only transform / opacity (and SVG stroke offsets while the
     names are being written) are touched, and every write is skipped
     when the value has not changed.
     --------------------------------------------------------- */
  var peacockStarted = false;
  function initPeacock() {
    if (peacockStarted) return;
    var band = document.getElementById('peacockWalk');
    var bird = document.getElementById('peacock');
    var stage = document.getElementById('peacockStage');
    if (!band || !bird || !stage) return;
    peacockStarted = true;

    /* Reduced motion: leave the calm static composition (no js-pw class). */
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    band.classList.add('js-pw');

    function $(id) { return document.getElementById(id); }
    var bg = $('pwBg'), glow = $('pwGlow'), far = $('pwFar'), dusts = $('pwDusts'),
        intro = $('pwIntro'), reveal = $('pwReveal'), eyebrow = $('pwEyebrow'),
        names = $('pwNames'), dateEl = $('pwDate'), bless = $('pwBlessing'),
        shadow = $('pwShadow'), feather = $('pwFeather'), fade = $('pwFade'),
        hedge = stage.querySelector('.pw-hedge');

    /* ---- helpers ---- */
    function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
    function seg(p, a, b) { return clamp01((p - a) / (b - a)); }
    function smooth(t) { return t * t * (3 - 2 * t); }
    function easeIO(t) { return 0.5 - 0.5 * Math.cos(Math.PI * t); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    var cache = {};
    function setStyle(el, key, prop, val) {           /* write only when changed */
      if (cache[key] === val) return;
      cache[key] = val;
      el.style[prop] = val;
    }
    function setT(el, key, x, y, extra) {
      setStyle(el, key, 'transform', 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)' + (extra || ''));
    }
    function setO(el, key, o) { setStyle(el, key, 'opacity', o < 0.004 ? '0' : o.toFixed(3)); }

    /* ---- glyph geometry (fractions of the SVG viewBox width) ---- */
    var glyphs = [];
    var vbParts = names.getAttribute('viewBox').split(/\s+/).map(Number);
    Array.prototype.forEach.call(names.querySelectorAll('.pw-glyph'), function (g) {
      var bb = g.getBBox();
      glyphs.push({
        fill: g.querySelector('.pw-g-fill'),
        stroke: g.querySelector('.pw-g-stroke'),
        s: (bb.x - vbParts[0]) / vbParts[2],
        w: bb.width / vbParts[2]
      });
    });

    /* ---- measurements (only on load / resize) ---- */
    var vw = 0, sh = 0, birdW = 0, birdH = 0, birdB = 0, fw = 0, fh = 0, mobile = false;
    var nm = { l: 0, t: 0, w: 0, h: 0 };
    var revealY = 0;
    function measure() {
      vw = window.innerWidth; sh = stage.offsetHeight;
      mobile = vw <= 600;
      birdW = bird.offsetWidth || 120;
      birdH = bird.offsetHeight || birdW * 1.02;
      birdB = parseFloat(window.getComputedStyle(bird).bottom) || 30;
      fw = feather.offsetWidth || 26; fh = feather.offsetHeight || fw * 4;
      var sr = stage.getBoundingClientRect(), nr = names.getBoundingClientRect();
      nm.l = nr.left - sr.left; nm.t = nr.top - sr.top - revealY; nm.w = nr.width; nm.h = nr.height;
    }

    /* peacock head position as a fraction of screen width, by progress.
       Slopes decrease after 0.55 → the bird visibly slows. */
    var KF_D = [[0, 0], [0.20, 0.22], [0.55, 0.62], [0.70, 0.78], [0.92, 0.90], [1, 0.93]];
    var KF_M = [[0, 0], [0.20, 0.24], [0.55, 0.60], [0.70, 0.76], [0.92, 0.86], [1, 0.88]];
    function front(p) {
      var k = mobile ? KF_M : KF_D;
      for (var i = 1; i < k.length; i++) {
        if (p <= k[i][0]) return lerp(k[i - 1][1], k[i][1], (p - k[i - 1][0]) / (k[i][0] - k[i - 1][0]));
      }
      return k[k.length - 1][1];
    }
    function bez(t, a, b, c, d) {
      var u = 1 - t;
      return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
    }

    var glyphState = -1;
    var introOn = false;

    function render() {
      ticking = false;
      var r = band.getBoundingClientRect();
      var run = band.offsetHeight - sh;
      var p = run > 0 ? clamp01(-r.top / run) : 0;

      /* --- intro lines: triggered as the stage arrives, staggered in CSS --- */
      if (!introOn && r.top < sh * 0.4) { introOn = true; intro.classList.add('is-on'); }
      else if (introOn && r.top > sh * 0.55) { introOn = false; intro.classList.remove('is-on'); }

      /* --- background: parallax, dimming, warm glow --- */
      var soften = smooth(seg(p, 0.55, 0.70));
      setT(bg, 'bg', 0, (0.5 - p) * sh * 0.09);
      setO(bg, 'bgo', 1 - 0.3 * soften);
      setT(far, 'far', -(p - 0.5) * vw * 0.08, 0);
      setO(glow, 'glow', smooth(seg(p, 0.76, 0.92)));
      setT(dusts, 'dust', 0, -p * sh * 0.05);
      setO(dusts, 'dusto', 0.55 + 0.45 * seg(p, 0.5, 0.9));

      /* --- intro text fade --- */
      setO(intro, 'intro', 1 - soften);
      setT(intro, 'introT', 0, -soften * 14);

      /* --- peacock --- */
      var f = front(p);
      var bx = f * vw - birdW * 0.9;
      var gain = 1 - 0.85 * seg(p, 0.70, 0.92);
      var phase = f * (mobile ? 8 : 10) * Math.PI;
      var lift = Math.abs(Math.sin(phase)) * (mobile ? 3 : 4.5) * gain;
      var sway = Math.sin(phase) * 0.8 * gain;
      var sc = 1 + Math.sin(Math.PI * seg(p, 0, 0.72)) * 0.025;
      var out = smooth(seg(p, 0.93, 1));
      setT(bird, 'bird', bx, -lift, ' rotate(' + sway.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')');
      setO(bird, 'birdo', 1 - out);
      setT(shadow, 'shd', bx + birdW * 0.1, 0, ' scaleX(' + (1 - lift * 0.02).toFixed(3) + ')');
      setO(shadow, 'shdo', (1 - out) * (1 - lift * 0.05));

      /* --- feather: detach → float to centre → sweep (writing) → drift off --- */
      var fo = smooth(seg(p, 0.68, 0.73)) * (1 - smooth(seg(p, 0.93, 0.99)));
      var writing = seg(p, 0.82, 0.92);
      var fx, fy, rot;
      var birdTop = sh - birdB - birdH;
      var penL = nm.l - nm.w * 0.03;
      var penY0 = nm.t + nm.h * 0.76;
      var wf = easeIO(writing) * 1.06;                 /* pen front, fraction of names width */
      if (p < 0.82) {
        var tt = seg(p, 0.68, 0.82), te = smooth(tt);
        var p0x = bx + birdW * 0.42, p0y = birdTop + birdH * 0.2;
        fx = bez(te, p0x, p0x - vw * 0.10, penL - vw * 0.05, penL) + Math.sin(tt * Math.PI * 3) * 8;
        fy = bez(te, p0y, p0y - sh * 0.30, penY0 - sh * 0.20, penY0) + Math.sin(tt * Math.PI * 2.3) * 10 * (1 - tt);
        rot = lerp(-25, 24, te) + Math.sin(tt * Math.PI * 4) * 9 * (1 - tt * 0.6);
      } else if (p <= 0.92) {
        fx = penL + wf * nm.w;
        fy = penY0 + Math.sin(writing * Math.PI * 7) * nm.h * 0.05;
        rot = 24 + Math.sin(writing * Math.PI * 6) * 3;
      } else {
        var d = seg(p, 0.92, 1);
        fx = penL + 1.06 * nm.w + d * vw * 0.08;
        fy = penY0 - smooth(d) * sh * 0.16;
        rot = 24 + d * 18;
      }
      setO(feather, 'feo', fo);
      setT(feather, 'fe', fx - fw / 2, fy - fh * 0.96, ' rotate(' + rot.toFixed(1) + 'deg)');

      /* --- handwriting: outline is drawn, then gold ink fills in behind the pen --- */
      var gs = p < 0.815 ? 0 : p > 0.935 ? 2 : 1;
      if (gs === 1) {
        for (var i = 0; i < glyphs.length; i++) {
          var g = glyphs[i];
          var sp = clamp01((wf - g.s + 0.008) / (g.w * 1.1 + 0.012));
          var fp = clamp01((wf - g.s - g.w * 0.3) / (g.w * 1.1 + 0.03));
          g.stroke.style.strokeDashoffset = (1 - sp).toFixed(3);
          g.fill.style.fillOpacity = fp.toFixed(3);
          g.stroke.style.strokeOpacity = (1 - 0.6 * fp).toFixed(2);
        }
      } else if (gs !== glyphState) {
        for (var j = 0; j < glyphs.length; j++) {
          glyphs[j].stroke.style.strokeDashoffset = gs === 2 ? '0' : '1';
          glyphs[j].stroke.style.strokeOpacity = gs === 2 ? '.4' : '1';
          glyphs[j].fill.style.fillOpacity = gs === 2 ? '1' : '0';
        }
      }
      glyphState = gs;

      /* --- supporting lines --- */
      var e = smooth(seg(p, 0.78, 0.86));
      setO(eyebrow, 'eb', e); setT(eyebrow, 'ebT', 0, (1 - e) * 10);
      var dt = smooth(seg(p, 0.915, 0.955));
      setO(dateEl, 'dt', dt); setT(dateEl, 'dtT', 0, (1 - dt) * 14);
      var bl = smooth(seg(p, 0.945, 0.985));
      setO(bless, 'bl', bl); setT(bless, 'blT', 0, (1 - bl) * 14);

      /* --- hand-off to the next section --- */
      revealY = -smooth(seg(p, 0.94, 1)) * sh * 0.03;
      setT(reveal, 'rev', 0, revealY);
      setO(fade, 'fade', out);
    }

    var ticking = false, visible = false;
    function onScroll() {
      if (!visible || ticking) return;
      ticking = true;
      window.requestAnimationFrame(render);
    }
    function onResize() {
      cache = {}; glyphState = -1;
      revealY = 0; reveal.style.transform = '';
      measure(); onScroll();
    }

    measure();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        stage.classList.toggle('is-live', visible);      /* dust animates only while on screen */
        if (visible) render();
      }, { rootMargin: '10% 0px 10% 0px' }).observe(band);
    } else {
      visible = true; stage.classList.add('is-live');
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('load', onResize);
    render();
  }

  /* ---------------------------------------------------------
     8 · Countdown  ·  target lives in js/data.js (IST)
     --------------------------------------------------------- */
  (function countdown() {
    var cfg = window.weddingData && window.weddingData.countdownTarget;
    var target = new Date(cfg || '2027-02-07T10:00:00+05:30').getTime();
    var d = document.getElementById('cdD'),
        h = document.getElementById('cdH'),
        m = document.getElementById('cdM'),
        s = document.getElementById('cdS');
    if (!d || isNaN(target)) return;

    var pad = function (n) { return n < 10 ? '0' + n : String(n); };

    function tick() {
      var left = target - Date.now();
      if (left <= 0) {
        d.textContent = h.textContent = m.textContent = s.textContent = '00';
        clearInterval(timer);
        return;
      }
      var sec = Math.floor(left / 1000);
      d.textContent = pad(Math.floor(sec / 86400));
      h.textContent = pad(Math.floor(sec / 3600) % 24);
      m.textContent = pad(Math.floor(sec / 60) % 60);
      s.textContent = pad(sec % 60);
    }
    tick();
    var timer = setInterval(tick, 1000);
  })();

  /* ---------------------------------------------------------
     9 · Particles + THANK YOU finale
     --------------------------------------------------------- */
  function bootParticles() {
    if (!window.KeralaParticles) return;
    window.KeralaParticles.init();

    var stage = document.getElementById('finaleStage');
    if (!stage || !('IntersectionObserver' in window)) return;

    var fo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && en.intersectionRatio >= 0.6) {
          window.KeralaParticles.finale(stage);
        } else if (!en.isIntersecting && en.boundingClientRect.top > 0) {
          window.KeralaParticles.reset();
        }
      });
    }, { threshold: [0, 0.6, 0.95] });

    fo.observe(stage);
  }

  if (document.readyState === 'complete') bootParticles();
  else window.addEventListener('load', bootParticles);


  /* ---------------------------------------------------------
     10 · Smooth anchor
     --------------------------------------------------------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute('href');
    if (!id || id === '#') return;
    var t = document.querySelector(id);
    if (!t) return;
    e.preventDefault();
    t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* ---------------------------------------------------------
     11 · Scroll progress bar
     --------------------------------------------------------- */
  (function () {
    var bar = document.getElementById('scroll-progress');
    if (!bar) return;

    function updateBar() {
      var el = document.documentElement;
      var body = document.body;
      var scrollTop = el.scrollTop || body.scrollTop;
      var scrollHeight = (el.scrollHeight || body.scrollHeight) - el.clientHeight;
      if (scrollHeight <= 0) { bar.style.width = '0%'; return; }
      var pct = Math.min(100, Math.round((scrollTop / scrollHeight) * 1000) / 10);
      bar.style.width = pct + '%';
    }

    /* Only show once the site is revealed and user starts scrolling */
    var barVisible = false;
    function onScroll() {
      if (!document.body.classList.contains('is-revealed')) return;
      if (!barVisible) {
        barVisible = true;
        bar.classList.add('is-visible');
      }
      updateBar();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
  })();

})();
