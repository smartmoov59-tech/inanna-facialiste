/* =========================================================
   INANNA · Facialiste — animations & interactions
   GSAP + ScrollTrigger + Lenis (smooth scroll). Aucune dépendance serveur :
   le site est 100 % statique (réservation = Planity, tel:, sms:, mailto:).
   ========================================================= */
(function () {
  'use strict';
  window.__inanna = true;

  var root = document.documentElement;
  var reduced = root.classList.contains('reduced');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var BOOK = 'https://www.planity.com/inanna-facialiste-soin-visage-kobido-intrabuccal-radiofrequence-04000-digne-les-bains';
  var PHONE = '+33638051558';
  var MAIL = 'contact@skinbyinanna.com';

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') { root.classList.add('no-intro'); return; }
  gsap.registerPlugin(ScrollTrigger);
  gsap.config({ nullTargetWarn: false });

  /* ---------------------------------------------------------
     Utilitaires : découpe de texte (mots / lettres)
     --------------------------------------------------------- */
  function splitWords(el) {
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (tok) {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
            var i = document.createElement('span'); i.className = 'wi'; i.textContent = tok;
            w.appendChild(i); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') { walk(n); }
      });
    })(el);
    return $$('.wi', el);
  }

  function tilt(el, max, glare) {
    if (!fine || reduced) return;
    gsap.set(el, { transformPerspective: 900 });
    var rx = gsap.quickTo(el, 'rotationX', { duration: .6, ease: 'power3' });
    var ry = gsap.quickTo(el, 'rotationY', { duration: .6, ease: 'power3' });
    var g = glare ? $('.glare', el) : null;
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      ry((px - .5) * max * 2); rx(-(py - .5) * max * 2);
      if (g) gsap.to(g, { x: (px - .5) * r.width * .9, y: (py - .5) * r.height * .9, opacity: 1, duration: .4, overwrite: 'auto' });
    });
    el.addEventListener('pointerleave', function () { rx(0); ry(0); if (g) gsap.to(g, { opacity: 0, duration: .6 }); });
  }

  /* ---------------------------------------------------------
     Smooth scroll (Lenis)
     --------------------------------------------------------- */
  var lenis = null;
  if (!reduced && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, wheelMultiplier: .95, touchMultiplier: 1.4 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  function stopScroll() { if (lenis) lenis.stop(); else document.body.style.overflow = 'hidden'; }
  function startScroll() { if (lenis) lenis.start(); else document.body.style.overflow = ''; }

  function goTo(hash) {
    var el = hash === '#top' ? null : $(hash);
    if (lenis) {
      lenis.scrollTo(el || 0, { duration: 1.7, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    } else if (el) { el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); }
    else { window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); }
  }

  /* ---------------------------------------------------------
     Menu mobile plein écran
     --------------------------------------------------------- */
  var burger = $('#burger'), menu = $('#menu'), nav = $('#nav'), menuOpen = false;
  function openMenu() {
    menuOpen = true;
    burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Fermer le menu');
    menu.setAttribute('aria-hidden', 'false'); menu.classList.add('is-open'); stopScroll();
    if (reduced) return;
    var x = window.innerWidth - 42, y = 42, rmax = Math.hypot(window.innerWidth, window.innerHeight) + 60;
    gsap.fromTo(menu, { clipPath: 'circle(0px at ' + x + 'px ' + y + 'px)' }, { clipPath: 'circle(' + rmax + 'px at ' + x + 'px ' + y + 'px)', duration: 1, ease: 'expo.inOut', overwrite: true });
    gsap.fromTo($$('.menu nav a'), { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, stagger: .07, ease: 'expo.out', delay: .35 });
    gsap.fromTo('.menu__foot', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: .9, delay: .75, ease: 'power3.out' });
  }
  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false;
    burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Ouvrir le menu');
    menu.setAttribute('aria-hidden', 'true'); startScroll();
    if (reduced) { menu.classList.remove('is-open'); return; }
    var x = window.innerWidth - 42, y = 42;
    gsap.to(menu, { clipPath: 'circle(0px at ' + x + 'px ' + y + 'px)', duration: .8, ease: 'expo.inOut', overwrite: true, onComplete: function () { menu.classList.remove('is-open'); } });
  }
  burger.addEventListener('click', function () { menuOpen ? closeMenu() : openMenu(); });

  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var h = a.getAttribute('href');
      if (h.length > 1 && (h === '#top' || $(h))) {
        e.preventDefault();
        if (menuOpen) { closeMenu(); setTimeout(function () { goTo(h); }, 450); } else goTo(h);
      }
    });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMenu(); closeLb(); } });

  /* ---------------------------------------------------------
     Horaires & statut « ouvert »
     --------------------------------------------------------- */
  (function hours() {
    var H = { 0: null, 1: ['13:00', '17:30'], 2: ['10:30', '18:00'], 3: ['10:30', '18:00'], 4: ['10:30', '18:00'], 5: ['10:30', '18:00'], 6: ['10:00', '13:00'] };
    var NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    var toMin = function (s) { var p = s.split(':'); return +p[0] * 60 + +p[1]; };
    var d, m;
    try {
      var parts = {};
      new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
        .formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
      d = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[parts.weekday];
      m = (parseInt(parts.hour, 10) % 24) * 60 + parseInt(parts.minute, 10);
    } catch (err) { var now = new Date(); d = now.getDay(); m = now.getHours() * 60 + now.getMinutes(); }
    var li = $('#hours li[data-d="' + d + '"]'); if (li) li.classList.add('is-today');
    var open = H[d] && m >= toMin(H[d][0]) && m < toMin(H[d][1]);
    var label, short;
    if (open) { label = 'Ouvert maintenant · jusqu’à ' + H[d][1].replace(':', 'h'); short = 'Ouvert'; }
    else {
      var nextD = d, nextTxt = '';
      if (H[d] && m < toMin(H[d][0])) nextTxt = 'aujourd’hui à ' + H[d][0].replace(':', 'h');
      else {
        for (var i = 1; i <= 7; i++) { nextD = (d + i) % 7; if (H[nextD]) { nextTxt = (i === 1 ? 'demain' : NAMES[nextD]) + ' à ' + H[nextD][0].replace(':', 'h'); break; } }
      }
      label = 'Fermé · rouvre ' + nextTxt; short = 'Fermé';
    }
    var chip = $('#openChip'), badge = $('#openBadge');
    if (chip) chip.textContent = label;
    if (badge) { badge.textContent = short; badge.classList.toggle('is-closed', !open); }
  })();

  /* ---------------------------------------------------------
     Curseur personnalisé (souris uniquement)
     --------------------------------------------------------- */
  if (fine && !reduced) {
    var cur = $('.cursor'), label = $('.cursor__label');
    var mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my;
    window.addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; cur.style.setProperty('--dx', mx + 'px'); cur.style.setProperty('--dy', my + 'px'); }, { passive: true });
    gsap.ticker.add(function () {
      rx += (mx - rx) * .18; ry += (my - ry) * .18;
      cur.style.setProperty('--rx', rx.toFixed(1) + 'px'); cur.style.setProperty('--ry', ry.toFixed(1) + 'px');
    });
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest ? e.target.closest('[data-cursor]') : null;
      var a = e.target.closest ? e.target.closest('a, button, [role="tab"], input, select, label') : null;
      cur.classList.toggle('is-link', !!t);
      cur.classList.toggle('is-small', !!a && !t);
      if (t) label.textContent = t.getAttribute('data-cursor');
    });
  }

  /* ---------------------------------------------------------
     Boutons magnétiques
     --------------------------------------------------------- */
  if (fine && !reduced) {
    $$('.magnetic').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: .7, ease: 'elastic.out(1, .55)' });
      var yTo = gsap.quickTo(el, 'y', { duration: .7, ease: 'elastic.out(1, .55)' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * .32); yTo((e.clientY - (r.top + r.height / 2)) * .4);
      });
      el.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });
  }

  /* ---------------------------------------------------------
     Vidéos : chargement différé (citation, appel à l'action)
     --------------------------------------------------------- */
  $$('video[preload="none"]').forEach(function (v) {
    var s = $('source[data-src]', v);
    if (!s || reduced) return;
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        s.src = s.getAttribute('data-src'); v.load(); var p = v.play(); if (p && p.catch) p.catch(function () {});
        io.disconnect();
      }
    }, { rootMargin: '900px 0px' });
    io.observe(v);
  });

  /* ---------------------------------------------------------
     Défilement : barre de progression, menu qui se cache, barre mobile
     --------------------------------------------------------- */
  if (!reduced) {
    gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: .2 } });
  } else {
    window.addEventListener('scroll', function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      $('.progress span').style.transform = 'scaleX(' + (h > 0 ? window.scrollY / h : 0) + ')';
    }, { passive: true });
  }

  var navHidden = false;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: function (self) {
      if (menuOpen || reduced) return;
      var y = self.scroll();
      if (y > 140 && self.direction === 1 && !navHidden) { navHidden = true; gsap.to(nav, { yPercent: -140, duration: .7, ease: 'power3.out', overwrite: true }); }
      else if ((self.direction === -1 || y <= 140) && navHidden) { navHidden = false; gsap.to(nav, { yPercent: 0, duration: .7, ease: 'power3.out', overwrite: true }); }
    }
  });
  var fab = $('#fab');
  ScrollTrigger.create({ start: function () { return window.innerHeight * .7; }, end: 'max', onToggle: function (self) { fab.classList.toggle('is-on', self.isActive); } });

  /* ---------------------------------------------------------
     Titres : apparition mot par mot (masque qui monte)
     --------------------------------------------------------- */
  if (!reduced) {
    $$('[data-split]').forEach(function (el) {
      var words = splitWords(el);
      gsap.set(words, { yPercent: 112 });
      gsap.to(words, { yPercent: 0, duration: 1.25, stagger: .055, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });

    /* Fondus sobres sur le reste du contenu */
    var fades = '.carte__lead, .gallery__head > p:last-child, .quiz__intro > p:last-child, .faq__head > p:last-child, .hscroll__lead, .stats .eyebrow, .stats__grid li, .stats__products > div, .carte__cta, .panel__title, .packs__note, .gift__text, .gift__ui, .ticket, .acc, .cta__note, .cta .eyebrow, .find__addr, .find__cols, .reviews__links, .car__ctrl, .carte .eyebrow, .quiz .eyebrow, .gallery .eyebrow, .reviews .eyebrow, .packs .eyebrow, .faq .eyebrow, .find .eyebrow, .quiz__box';
    gsap.set(fades, { autoAlpha: 0, y: 44 });
    ScrollTrigger.batch(fades, {
      start: 'top 90%', once: true,
      onEnter: function (els) { gsap.to(els, { autoAlpha: 1, y: 0, duration: 1.2, stagger: .1, ease: 'power3.out', overwrite: true }); }
    });
  }

  /* ---------------------------------------------------------
     Marquees : vitesse et sens réagissent au défilement
     --------------------------------------------------------- */
  var marquees = $$('.marquee').map(function (m) {
    var track = $('.marquee__track', m), base = track.innerHTML;
    var o = { m: m, track: track, base: base, unit: 0, x: 0, dir: parseFloat(m.getAttribute('data-dir')) || -1, speed: parseFloat(m.getAttribute('data-speed')) || 1, cur: 0 };
    return o;
  });
  function measureMarquees() {
    marquees.forEach(function (o) {
      o.track.innerHTML = o.base; o.unit = o.track.scrollWidth + parseFloat(getComputedStyle(o.track).columnGap || 0);
      var n = 1; while (o.track.scrollWidth < window.innerWidth * 2 + o.unit && n < 12) { o.track.insertAdjacentHTML('beforeend', o.base); n++; }
    });
  }
  measureMarquees();
  if (!reduced) {
    gsap.ticker.add(function () {
      var v = lenis ? Math.min(Math.abs(lenis.velocity), 70) : 0;
      var sd = lenis && lenis.direction < 0 ? -1 : 1;
      marquees.forEach(function (o) {
        o.cur += (sd - o.cur) * .06;
        o.x += o.dir * o.cur * (.7 + v * .32) * o.speed;
        if (o.unit) { if (o.x <= -o.unit) o.x += o.unit; if (o.x > 0) o.x -= o.unit; }
        o.track.style.transform = 'translate3d(' + o.x.toFixed(2) + 'px,0,0)';
      });
    });
  }

  /* ---------------------------------------------------------
     Histoire : section épinglée, storytelling étape par étape
     --------------------------------------------------------- */
  if (!reduced) {
    var steps = $$('.step'), imgs = $$('.story__img');
    gsap.set(steps.slice(1), { autoAlpha: 0, y: 48 });
    gsap.set(imgs.slice(1), { autoAlpha: 0, scale: 1.25 });
    gsap.set(imgs[0], { scale: 1.08 });
    var stl = gsap.timeline({ scrollTrigger: { trigger: '.story', start: 'top top', end: '+=340%', pin: '.story__pin', scrub: .7, anticipatePin: 1 } });
    steps.forEach(function (step, i) {
      var t = i * 2;
      if (i > 0) {
        stl.to(steps[i - 1], { autoAlpha: 0, y: -48, duration: .5, ease: 'power2.in' }, t - .55)
           .to(imgs[i - 1], { autoAlpha: 0, scale: 1.1, duration: .9, ease: 'power2.inOut' }, t - .45)
           .fromTo(step, { autoAlpha: 0, y: 48 }, { autoAlpha: 1, y: 0, duration: .7, ease: 'power3.out' }, t)
           .fromTo(imgs[i], { autoAlpha: 0, scale: 1.25 }, { autoAlpha: 1, scale: 1, duration: 1.1, ease: 'power2.out' }, t - .45);
      } else {
        stl.to(imgs[0], { scale: 1, duration: 1.2, ease: 'power2.out' }, 0);
      }
    });
    stl.to({}, { duration: 1.1 });
    var total = stl.duration();
    stl.to('.story__progress i', { scaleX: 1, duration: total, ease: 'none' }, 0)
       .to('.story__glow', { xPercent: -26, yPercent: 30, duration: total, ease: 'none' }, 0);
  }

  /* ---------------------------------------------------------
     Citation : les mots s'allument, vidéo en parallax
     --------------------------------------------------------- */
  (function () {
    var q = $('#quoteText'); if (!q) return;
    var words = q.textContent.trim().split(/\s+/);
    q.innerHTML = '<span class="sr">' + words.join(' ') + '</span>' +
      words.map(function (w) { return '<span class="qw" aria-hidden="true">' + w + '</span>'; }).join(' ');
    if (reduced) return;
    gsap.to($$('.qw', q), { opacity: 1, ease: 'none', stagger: .12, scrollTrigger: { trigger: '.quote', start: 'top 62%', end: 'bottom 78%', scrub: true } });
    gsap.fromTo('.quote__video', { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: '.quote', start: 'top bottom', end: 'bottom top', scrub: true } });
  })();

  /* ---------------------------------------------------------
     Soins signature : défilement horizontal piloté par le scroll
     --------------------------------------------------------- */
  var cards = $$('.card:not(.card--end)');
  cards.forEach(function (c) { tilt(c, 9, true); });
  if (!reduced) {
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      var section = $('.hscroll'), pin = $('.hscroll__pin'), track = $('.hscroll__track'), bar = $('.hscroll__bar i');
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      var tween = gsap.to(track, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: function () { return '+=' + dist(); }, pin: pin, scrub: .8, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: function (s) { gsap.set(bar, { scaleX: s.progress }); } }
      });
      cards.forEach(function (card) {
        gsap.fromTo($('.card__photo img', card), { xPercent: -7 }, { xPercent: 7, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      });
    });
  }

  /* ---------------------------------------------------------
     Chiffres clés : compteurs + étoile qui tourne
     --------------------------------------------------------- */
  (function () {
    var fmt = function (v, dec) { return dec ? v.toFixed(dec).replace('.', ',') : String(Math.round(v)); };
    var els = $$('[data-count]');
    function run() {
      els.forEach(function (el) {
        var target = parseFloat(el.getAttribute('data-count')), dec = parseInt(el.getAttribute('data-decimals') || '0', 10), o = { v: 0 };
        gsap.to(o, { v: target, duration: 2.4, ease: 'power3.out', onUpdate: function () { el.textContent = fmt(o.v, dec); }, onComplete: function () { el.textContent = fmt(target, dec); } });
      });
    }
    if (reduced) { els.forEach(function (el) { el.textContent = fmt(parseFloat(el.getAttribute('data-count')), parseInt(el.getAttribute('data-decimals') || '0', 10)); }); return; }
    ScrollTrigger.create({ trigger: '.stats__grid', start: 'top 82%', once: true, onEnter: run });
    gsap.fromTo('.stats__star', { rotation: -30 }, { rotation: 150, ease: 'none', transformOrigin: '50% 50%', scrollTrigger: { trigger: '.stats', start: 'top bottom', end: 'bottom top', scrub: true } });
  })();

  /* ---------------------------------------------------------
     La carte : onglets
     --------------------------------------------------------- */
  (function () {
    var tabs = $$('.tab'), panels = $$('.panel');
    if (!tabs.length) return;
    function show(i, focus) {
      tabs.forEach(function (t, j) { t.setAttribute('aria-selected', j === i ? 'true' : 'false'); t.tabIndex = j === i ? 0 : -1; });
      panels.forEach(function (p, j) { p.hidden = j !== i; });
      if (focus) tabs[i].focus();
      var rows = $$('.row', panels[i]), title = $('.panel__title', panels[i]), intro = $('.panel__intro', panels[i]);
      if (!reduced) {
        gsap.fromTo([title, intro].filter(Boolean), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: .8, stagger: .08, ease: 'power3.out', overwrite: true });
        gsap.fromTo(rows, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: .8, stagger: .07, ease: 'power3.out', delay: .1, overwrite: true });
      }
      ScrollTrigger.refresh();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(i); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = tabs.length;
        if (k === 'ArrowDown' || k === 'ArrowRight') { e.preventDefault(); show((i + 1) % n, true); }
        else if (k === 'ArrowUp' || k === 'ArrowLeft') { e.preventDefault(); show((i - 1 + n) % n, true); }
      });
    });
    panels.forEach(function (p, j) { if (j !== 0) p.hidden = true; });
    tabs.forEach(function (t, j) { t.tabIndex = j === 0 ? 0 : -1; });
  })();

  /* ---------------------------------------------------------
     Conseiller : « Quel soin pour vous ? »
     --------------------------------------------------------- */
  (function () {
    var box = $('#quiz'); if (!box) return;
    var R = {
      detente: {
        express: { n: 'L’Éclat', m: '30 min · 50 €', t: 'Un massage ciblé, en version relaxante, pour relâcher les tensions et apaiser les traits en un temps court.' },
        hour: { n: 'Le Kobido', m: '1h00 · 90 €', t: 'L’art ancestral japonais : un massage enveloppant qui stimule muscles et tissus du visage, de la surface à la profondeur.' },
        long: { n: 'L’Ultime', m: '2h00 · 200 €', t: 'Le grand rituel : expertise, gestuelle, actifs, lâcher-prise et sensorialité. Ne prévoyez rien juste après.' }
      },
      eclat: {
        express: { n: 'Le Peel', m: '30 min · 50 € · offre du mois', t: 'Peeling KRX et infusion d’actifs : fraîcheur et éclat, sans brusquer la peau.' },
        hour: { n: 'L’Essentiel', m: '1h00 · 100 €', t: 'Le soin du visage sur mesure : un temps d’échange, puis un soin construit pour votre peau du jour.' },
        long: { n: 'Le Profond', m: '1h30 · 150 €', t: 'Plus de temps, un travail plus en profondeur et de la technologie pour un teint visiblement plus lumineux.' }
      },
      peau: {
        express: { n: 'BioRePeel', m: '45 min · 80 €', t: 'Un peeling doux sans desquamation, avec masque et massage du cuir chevelu : l’éclat sans éviction sociale. Certains soins dermo-esthétiques demandent un premier rendez-vous.' },
        hour: { n: 'L’Effet Micro-needling', m: '1h00 · 110 € · cure à 99 € la séance', t: 'Des micro-perforations pour faire pénétrer les actifs et stimuler le collagène : grain de peau affiné, pores resserrés.' },
        long: { n: 'Protocole « Peau Nette »', m: '6 soins sur 5 à 7 mois · 440 €', t: 'Un accompagnement correctif complet pour rééquilibrer la peau, améliorer sa texture et prévenir les récidives d’acné.' }
      },
      corps: {
        express: { n: 'Le Drainant Jambes', m: '30 min · 50 €', t: 'Un drainage tonique pour alléger les jambes lourdes. Cure possible de 4 séances à 45 € la séance.' },
        hour: { n: 'L’Enveloppant', m: '1h00 · 100 €', t: 'Un massage du dos pour délier les tensions en profondeur, suivi d’un massage du visage.' },
        long: { n: 'Le Drainant · méthode Renata França', m: '130 €', t: 'Circulation, gonflements, corps serré et fatigué : des manœuvres toniques et répétitives, de préférence en cure.' }
      }
    };
    var goal = null, steps = $$('.quiz__step', box);
    function go(n) {
      steps.forEach(function (s) { s.classList.toggle('is-active', +s.getAttribute('data-step') === n); });
      var cur = steps[n - 1];
      if (!reduced) gsap.fromTo(cur.children, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: .8, stagger: .07, ease: 'power3.out', overwrite: true });
    }
    $$('[data-goal]', box).forEach(function (b) { b.addEventListener('click', function () { goal = b.getAttribute('data-goal'); go(2); }); });
    $$('[data-time]', box).forEach(function (b) {
      b.addEventListener('click', function () {
        var r = R[goal][b.getAttribute('data-time')];
        $('#quizName').textContent = r.n; $('#quizMeta').textContent = r.m; $('#quizTxt').textContent = r.t; go(3);
      });
    });
    $('[data-back]', box).addEventListener('click', function () { go(1); });
    $('[data-restart]', box).addEventListener('click', function () { goal = null; go(1); });
  })();

  /* ---------------------------------------------------------
     Galerie : révélations variées, parallax interne, visionneuse
     --------------------------------------------------------- */
  (function () {
    var figs = $$('.g');
    if (!reduced) {
      figs.forEach(function (fig) {
        var wrap = $('.g__img', fig), img = $('img', fig);
        var from, to = 'inset(0% 0% 0% 0%)';
        if (fig.classList.contains('reveal-circle')) { from = 'circle(0% at 50% 50%)'; to = 'circle(80% at 50% 50%)'; }
        else if (fig.classList.contains('reveal-curtain')) { from = 'inset(0% 100% 0% 0%)'; }
        else { from = 'inset(100% 0% 0% 0%)'; }
        gsap.fromTo(wrap, { clipPath: from }, { clipPath: to, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: fig, start: 'top 84%', once: true } });
        gsap.fromTo(img, { scale: 1.35 }, { scale: 1, duration: 2.2, ease: 'expo.out', scrollTrigger: { trigger: fig, start: 'top 84%', once: true } });
        gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      var mq = gsap.matchMedia();
      mq.add('(min-width: 900px)', function () {
        [['.g--2', -80], ['.g--4', 60], ['.g--7', -70], ['.g--6', 50]].forEach(function (p) {
          gsap.fromTo(p[0], { y: -p[1] * .4 }, { y: p[1] * .4, ease: 'none', scrollTrigger: { trigger: p[0], start: 'top bottom', end: 'bottom top', scrub: true } });
        });
      });
      $$('.g__btn').forEach(function (b) { tilt(b, 4, false); });
    }
    var lb = $('#lb'), lbImg = $('.lb__img', lb), lastFocus = null;
    window.openLb = function (src, alt) {
      lastFocus = document.activeElement; lbImg.src = src; lbImg.alt = alt || '';
      lb.hidden = false; requestAnimationFrame(function () { lb.classList.add('is-on'); }); stopScroll(); $('.lb__close', lb).focus();
    };
    window.closeLb = function () {
      if (lb.hidden) return;
      lb.classList.remove('is-on'); startScroll();
      setTimeout(function () { lb.hidden = true; lbImg.removeAttribute('src'); }, 350);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };
    $$('[data-lightbox]').forEach(function (b) {
      b.addEventListener('click', function () { var im = $('img', b); window.openLb(b.getAttribute('data-lightbox'), im ? im.alt : ''); });
    });
    lb.addEventListener('click', function (e) { if (e.target !== lbImg) window.closeLb(); });
  })();
  function closeLb() { if (window.closeLb) window.closeLb(); }

  /* ---------------------------------------------------------
     Avis : carrousel (glisser, flèches, lecture auto)
     --------------------------------------------------------- */
  (function () {
    var viewport = $('.car__viewport'), track = $('#carTrack'), line = $('#carLine');
    if (!viewport || !track) return;
    var items = $$('.rev', track), idx = 0, step = 0, maxIdx = 0, perView = 1, timer = null, inView = false, drag = null;
    function measure() {
      var gap = parseFloat(getComputedStyle(track).columnGap) || 22;
      step = items[0].offsetWidth + gap;
      var cs = getComputedStyle(viewport), avail = viewport.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      perView = Math.max(1, Math.floor((avail + gap) / step));
      maxIdx = Math.max(0, items.length - perView);
    }
    function go(i, instant) {
      idx = Math.max(0, Math.min(maxIdx, i));
      gsap.to(track, { x: -idx * step, duration: instant || reduced ? 0 : 1.1, ease: 'expo.out', overwrite: true });
      gsap.to(line, { scaleX: Math.min(1, (idx + perView) / items.length), duration: reduced ? 0 : .8, ease: 'power3.out' });
    }
    function play() { stop(); if (reduced) return; timer = setInterval(function () { if (!inView || drag) return; go(idx >= maxIdx ? 0 : idx + 1); }, 5200); }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    measure(); go(0, true);
    $('#carPrev').addEventListener('click', function () { go(idx - 1); play(); });
    $('#carNext').addEventListener('click', function () { go(idx >= maxIdx ? 0 : idx + 1); play(); });
    viewport.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      drag = { x: e.clientX, tx: gsap.getProperty(track, 'x'), moved: 0 }; stop();
    });
    window.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x; drag.moved = Math.abs(dx);
      var x = drag.tx + dx, min = -maxIdx * step;
      if (x > 0) x *= .35; if (x < min) x = min + (x - min) * .35;
      gsap.set(track, { x: x });
    });
    function end() {
      if (!drag) return;
      var x = gsap.getProperty(track, 'x'); drag = null;
      go(Math.round(-x / step)); play();
    }
    window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
    viewport.addEventListener('mouseenter', stop); viewport.addEventListener('mouseleave', play);
    new IntersectionObserver(function (en) { inView = en[0].isIntersecting; }, { threshold: .25 }).observe(viewport);
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { measure(); go(idx, true); }, 200); });
    play();
    var rating = $('.rating');
    if (rating) { if (reduced) rating.classList.add('in'); else ScrollTrigger.create({ trigger: rating, start: 'top 85%', once: true, onEnter: function () { rating.classList.add('in'); } }); }
  })();

  /* ---------------------------------------------------------
     Carte cadeau : aperçu en direct + SMS / e-mail préremplis
     --------------------------------------------------------- */
  (function () {
    var to = $('#gfTo'), from = $('#gfFrom'), what = $('#gfWhat'), mail = $('#gfMail'), format = $('#gfFormat');
    if (!to) return;
    function msg() {
      return ['Bonjour,', '', 'Je souhaite offrir une carte cadeau Inanna.', 'Soin ou montant offert : ' + what.value,
        'De la part de : ' + (from.value.trim() || '(à compléter)'), 'Pour : ' + (to.value.trim() || '(à compléter)'),
        'E-mail pour recevoir la carte : ' + (mail.value.trim() || '(à compléter)'), 'Format : ' + format.value, '', 'Merci !'].join('\n');
    }
    function sync() {
      $('#gcTo').textContent = to.value.trim() || 'vous';
      $('#gcFrom').textContent = from.value.trim() || 'quelqu’un qui vous aime';
      $('#gcWhat').textContent = what.value.replace(/\s*\(à préciser dans le message\)/, '');
      $('#gfSms').setAttribute('href', 'sms:' + PHONE + '?body=' + encodeURIComponent(msg()));
      $('#gfMailBtn').setAttribute('href', 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Carte cadeau Inanna') + '&body=' + encodeURIComponent(msg()));
    }
    [to, from, what, mail, format].forEach(function (el) { el.addEventListener('input', sync); el.addEventListener('change', sync); });
    $('#giftForm').addEventListener('submit', function (e) { e.preventDefault(); });
    sync(); tilt($('#giftcard'), 8, true);
  })();

  /* ---------------------------------------------------------
     FAQ : accordéon
     --------------------------------------------------------- */
  (function () {
    var btns = $$('.acc__btn');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var open = b.getAttribute('aria-expanded') === 'true';
        btns.forEach(function (o) { o.setAttribute('aria-expanded', 'false'); });
        b.setAttribute('aria-expanded', open ? 'false' : 'true');
        setTimeout(function () { ScrollTrigger.refresh(); }, 800);
      });
    });
  })();

  /* ---------------------------------------------------------
     Appel à l'action, pied de page
     --------------------------------------------------------- */
  if (!reduced) {
    gsap.fromTo('.cta__video', { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('.foot__giant .ch', { yPercent: 115, duration: 1.6, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: '.foot__giant', start: 'top 94%', once: true } });
  }

  /* ---------------------------------------------------------
     Introduction : préchargeur → fenêtre en arche → hero plein écran
     --------------------------------------------------------- */
  var heroChars = $$('.hero__title .ch'), heroIn = $$('[data-hero-in]');

  function heroScroll() {
    if (reduced) return;
    var tl = gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    tl.to('.hero__video', { yPercent: 10, scale: 1.12, ease: 'none' }, 0)
      .to('.hero__title', { yPercent: -26, ease: 'none' }, 0)
      .to('.hero__arch', { yPercent: -8, scale: 1.05, ease: 'none' }, 0)
      .to('.hero__leaves--l', { yPercent: -34, xPercent: -8, ease: 'none' }, 0)
      .to('.hero__leaves--r', { yPercent: -44, xPercent: 8, ease: 'none' }, 0)
      .to('.hero__content > :not(.hero__title)', { yPercent: -18, autoAlpha: .0, ease: 'none' }, 0)
      .to('.hero__meta', { autoAlpha: 0, ease: 'none' }, 0);
    if (fine) {
      var layers = [['.hero__arch', 14], ['.hero__leaves--l', -34], ['.hero__leaves--r', 40]].map(function (l) {
        return { x: gsap.quickTo(l[0], 'x', { duration: 1.2, ease: 'power3' }), y: gsap.quickTo(l[0], 'y', { duration: 1.2, ease: 'power3' }), k: l[1] };
      });
      $('.hero').addEventListener('pointermove', function (e) {
        var nx = e.clientX / window.innerWidth - .5, ny = e.clientY / window.innerHeight - .5;
        layers.forEach(function (l) { l.x(nx * l.k); l.y(ny * l.k * .6); });
      });
    }
  }

  function intro() {
    var loader = $('#loader');
    if (reduced || !loader || root.classList.contains('no-intro')) { if (loader) loader.remove(); return Promise.resolve(); }
    return new Promise(function (resolve) {
      stopScroll(); window.scrollTo(0, 0);
      gsap.set(heroChars, { yPercent: 118 });
      gsap.set(heroIn, { autoAlpha: 0, y: 34 });
      gsap.set(nav, { yPercent: -150 });
      gsap.set('.hero__video', { scale: 1.3 });
      gsap.set('.hero__arch', { autoAlpha: 0, scale: .9, transformOrigin: '50% 100%' });
      gsap.set('.hero__star', { autoAlpha: 0 });
      gsap.set('.hero__leaves', { yPercent: 40 });

      var count = $('#loaderCount'), st = { n: 0 };
      var ready = new Promise(function (res) {
        var done = false, go = function () { if (!done) { done = true; res(); } };
        if (document.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
        setTimeout(go, 4500);
      });
      var vid = $('#heroVideo');
      var vready = new Promise(function (res) {
        if (!vid || vid.readyState >= 3) return res();
        vid.addEventListener('canplay', function () { res(); }, { once: true });
        setTimeout(res, 3200);
      });
      var tl = gsap.timeline();
      tl.fromTo('.loader__arch path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut' }, 0)
        .fromTo('.loader__star', { scale: 0, rotation: -120, autoAlpha: 0 }, { scale: 1, rotation: 0, autoAlpha: 1, duration: 1.3, ease: 'expo.out' }, .25)
        .fromTo('.loader__name .ch', { yPercent: 118 }, { yPercent: 0, duration: 1, stagger: .07, ease: 'expo.out' }, .45)
        .to(st, { n: 100, duration: 1.7, ease: 'power2.inOut', onUpdate: function () { count.textContent = String(Math.round(st.n)).padStart(3, '0'); } }, 0);
      var tlDone = new Promise(function (r) { tl.eventCallback('onComplete', r); });

      Promise.all([ready, vready, tlDone]).then(function () {
        var out = gsap.timeline({ defaults: { ease: 'expo.inOut' }, onComplete: function () { loader.remove(); startScroll(); resolve(); } });
        out.to('.loader__inner', { yPercent: -25, autoAlpha: 0, duration: .7, ease: 'power3.in' })
           .to(loader, { yPercent: -135, duration: 1.3 }, '-=.15')
           .to('#heroMedia', { clipPath: 'inset(0% 0% 0% 0% round 0px 0px 0px 0px)', duration: 1.7 }, '-=1')
           .to('.hero__video', { scale: 1, duration: 2.4, ease: 'power3.out' }, '<')
           .to('.hero__arch', { autoAlpha: 1, scale: 1, duration: 1.5, ease: 'expo.out' }, '-=1.4')
           .to('.hero__leaves', { yPercent: 0, duration: 1.8, ease: 'expo.out' }, '-=1.3')
           .to('.hero__star', { autoAlpha: 1, duration: 1.2, stagger: .15, ease: 'power2.out' }, '-=1.2')
           .to(heroChars, { yPercent: 0, duration: 1.5, stagger: .08, ease: 'expo.out' }, '-=1.4')
           .to(heroIn, { autoAlpha: 1, y: 0, duration: 1.1, stagger: .12, ease: 'power3.out' }, '-=1')
           .to(nav, { yPercent: 0, duration: 1.1, ease: 'power3.out' }, '-=.9');
      });
    });
  }

  // Sécurité : toujours rendre la main à l'utilisateur
  var introP;
  try { introP = intro(); } catch (err) { console.error(err); introP = Promise.resolve(); }
  introP.then(function () {
    gsap.set(nav, { yPercent: 0 }); startScroll();
    heroScroll(); ScrollTrigger.refresh();
  });

  window.addEventListener('load', function () { measureMarquees(); ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measureMarquees(); ScrollTrigger.refresh(); });
  var rz; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { measureMarquees(); ScrollTrigger.refresh(); }, 250); });
})();
