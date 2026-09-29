/* ============================================================
   Nahal & Devika — single source of truth for editable content.
   Elements in index.html use:
     data-bind="key"        → sets text
     data-bind-lines="key"  → sets text, one line per array item
     data-href="key"        → sets href (map links)
   Change values here; no need to touch the HTML.
   ============================================================ */
(function () {
  'use strict';

  var weddingData = {
    groom: 'Nahal',
    bride: 'Devika',

    weddingDate: '7 February 2027',
    weddingDay: 'Sunday',
    weddingDateLong: 'Sunday, 7 February 2027',
    weddingDateShort: 'Sun, 7 Feb 2027',
    dateNumeric: '07 \u2022 02 \u2022 2027',
    /* Countdown target — Muhurtham start, India Standard Time */
    countdownTarget: '2027-02-07T10:00:00+05:30',

    muhurtham: '10:00 AM \u2013 10:30 AM',
    weddingVenue: 'SNM Auditorium',
    weddingAddress: 'Naduvath, Wandoor',
    weddingAddressLines: ['Naduvath', 'Wandoor'],

    groomFather: 'Narayanan P. P.',
    groomMother: 'Hema Narayanan',
    groomParents: 'Narayanan P. P. & Hema Narayanan',
    groomAddress: 'Nirmalyam Poolakkalparambil, Kattukulam',
    groomAddressLines: ['Nirmalyam Poolakkalparambil', 'Kattukulam'],

    brideFather: 'Subramanian K.',
    brideMother: 'Priya P. S.',
    brideParents: 'Subramanian K. & Priya P. S.',
    brideAddress: 'Karumarappatta, Naduvath, Wandoor',
    brideAddressLines: ['Karumarappatta', 'Naduvath, Wandoor'],

    receptionDate: '7 February 2027',
    receptionTime: '4:00 PM',
    receptionVenue: 'Sowmya Kalyana Mandapam',
    receptionAddress: 'Pookkottukavu, Sreekrishnapuram South',
    receptionAddressLines: ['Pookkottukavu', 'Sreekrishnapuram South'],

    /* Paste exact Google Maps share links here when available.
       Empty → a Google Maps search link is generated automatically. */
    weddingMap: '',
    receptionMap: ''
  };

  function mapsSearch(query) {
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query);
  }
  weddingData.weddingMapUrl = weddingData.weddingMap ||
    mapsSearch(weddingData.weddingVenue + ', ' + weddingData.weddingAddress);
  weddingData.receptionMapUrl = weddingData.receptionMap ||
    mapsSearch(weddingData.receptionVenue + ', ' + weddingData.receptionAddress);

  window.weddingData = weddingData;

  function bind() {
    var i, el, key, val, n;
    var text = document.querySelectorAll('[data-bind]');
    for (i = 0; i < text.length; i++) {
      el = text[i]; val = weddingData[el.getAttribute('data-bind')];
      if (typeof val === 'string') el.textContent = val;
    }
    var lines = document.querySelectorAll('[data-bind-lines]');
    for (i = 0; i < lines.length; i++) {
      el = lines[i]; val = weddingData[el.getAttribute('data-bind-lines')];
      if (!val || !val.length) continue;
      el.textContent = '';
      for (n = 0; n < val.length; n++) {
        if (n) el.appendChild(document.createElement('br'));
        el.appendChild(document.createTextNode(val[n]));
      }
    }
    var links = document.querySelectorAll('[data-href]');
    for (i = 0; i < links.length; i++) {
      el = links[i]; val = weddingData[el.getAttribute('data-href')];
      if (val) el.setAttribute('href', val);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
