/* ==========================================================================
   AUREA — interazioni del sito
   Nessuna dipendenza esterna. I dati del locale arrivano da js/config.js
   ========================================================================== */
(function () {
  "use strict";

  var R = window.RESTAURANT;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Testi generati da JS (IT / EN) ---------- */
  var T = {
    it: {
      openNow: "Aperto ora · chiude alle ", closedOpens: "Chiuso ora · apre ", today: "oggi", tomorrow: "domani",
      at: " alle ", closed: "Chiuso", todayBadge: "Oggi", lunch: "Pranzo", dinner: "Cena",
      noSlots: "Nessun orario disponibile per questa data. Scegli un altro giorno.",
      guest: "ospite", guests: "ospiti", step: "Passo ", of: " di ",
      errName: "Inserisci nome e telefono per continuare.", errPrivacy: "Serve il consenso al trattamento dei dati.",
      sent: "Richiesta inviata!", sentText: "Ti confermeremo il tavolo a breve. Grazie per aver scelto {name}.",
      waIntro: "Buongiorno, vorrei prenotare un tavolo da {name}:",
      people: "Persone", date: "Data", time: "Ora", name: "Nome", phone: "Telefono", occasion: "Occasione", notes: "Note",
      mailSubject: "Richiesta prenotazione", large: "Più di ",
      days: ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"]
    },
    en: {
      openNow: "Open now · closes at ", closedOpens: "Closed now · opens ", today: "today", tomorrow: "tomorrow",
      at: " at ", closed: "Closed", todayBadge: "Today", lunch: "Lunch", dinner: "Dinner",
      noSlots: "No times available for this date. Please choose another day.",
      guest: "guest", guests: "guests", step: "Step ", of: " of ",
      errName: "Please enter your name and phone to continue.", errPrivacy: "Please accept the data processing consent.",
      sent: "Request sent!", sentText: "We'll confirm your table shortly. Thank you for choosing {name}.",
      waIntro: "Hello, I'd like to book a table at {name}:",
      people: "Guests", date: "Date", time: "Time", name: "Name", phone: "Phone", occasion: "Occasion", notes: "Notes",
      mailSubject: "Reservation request", large: "More than ",
      days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    }
  };
  var lang = "it";
  try { lang = localStorage.getItem("lang") || (navigator.language || "it").slice(0, 2); } catch (e) {}
  if (!T[lang]) lang = "it";
  var t = function (k) { var v = T[lang][k]; return typeof v === "string" ? v.replace("{name}", R.name) : v; };
  var locale = function () { return lang === "it" ? "it-IT" : "en-GB"; };

  /* ---------- Ora di Roma (indipendente dal fuso del visitatore) ---------- */
  function romeNow() {
    var parts = {};
    new Intl.DateTimeFormat("en-GB", {
      timeZone: R.timezone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false
    }).formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    var date = new Date(+parts.year, +parts.month - 1, +parts.day);
    return { date: date, dow: date.getDay(), min: (+parts.hour % 24) * 60 + (+parts.minute) };
  }
  var toMin = function (s) { var p = s.split(":"); var m = +p[0] * 60 + +p[1]; return m === 0 ? 1440 : m; };
  var openMin = function (s) { var p = s.split(":"); return +p[0] * 60 + +p[1]; };
  var fmtMin = function (m) { m = m % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
  var ymd = function (d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };

  /* ---------- Dati di contatto dal config ---------- */
  function fillContacts() {
    var tel = "tel:" + R.phone.replace(/\s+/g, "");
    var enc = encodeURIComponent(R.mapsQuery || R.address);
    $$(".js-phone").forEach(function (el) { el.textContent = R.phone; });
    $$(".js-phone-link").forEach(function (el) { el.href = tel; });
    $$(".js-email").forEach(function (el) { el.textContent = R.email; });
    $$(".js-email-link").forEach(function (el) { el.href = "mailto:" + R.email; });
    $$(".js-address").forEach(function (el) { el.textContent = R.address; });
    $$(".js-directions").forEach(function (el) { el.href = "https://www.google.com/maps/dir/?api=1&destination=" + enc; });
    $$(".js-instagram").forEach(function (el) { el.href = R.instagram; });
    $$(".js-facebook").forEach(function (el) { el.href = R.facebook; });
    $$(".js-tripadvisor").forEach(function (el) { el.href = R.tripadvisor; });
    var map = $(".js-map");
    if (map && map.src) map.src = "https://maps.google.com/maps?q=" + enc + "&z=16&output=embed";
    else if (map) {
      // la mappa si carica solo quando serve, per non rallentare la pagina
      var io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { map.src = "https://maps.google.com/maps?q=" + enc + "&z=16&output=embed"; io.disconnect(); }
      }, { rootMargin: "400px" });
      io.observe(map);
    }
    $$(".js-year").forEach(function (el) { el.textContent = new Date().getFullYear(); });
    $$(".js-name").forEach(function (el) { el.textContent = R.name; });
    $$(".js-vat").forEach(function (el) { el.textContent = R.vat || ""; });
    if (R.seoTitle) document.title = R.seoTitle;
    if (R.seoDescription) { var md = $('meta[name="description"]'); if (md) md.content = R.seoDescription; }
    var adm = $(".admin-entry");
    if (adm) adm.hidden = R.showAdminButton === false;
    updateSEO();
  }

  /* ---------- Dati per Google (sempre allineati a config e pannello admin) ---------- */
  var DAY_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function siteUrl() {
    var u = (R.siteUrl || "").trim() || (location.origin + location.pathname.replace(/[^/]*$/, ""));
    return /\/$/.test(u) ? u : u + "/";
  }
  var absUrl = function (src) { return /^(https?:)?\/\//.test(src) ? src : siteUrl() + String(src || "").replace(/^\.?\//, ""); };
  function parseAddress(a) {
    // "Via della Spiga 12, 20121 Milano MI" -> via, CAP, città, provincia
    var m = String(a || "").match(/^(.*?),\s*(\d{5})\s+(.+?)(?:\s+\(?([A-Z]{2})\)?)?$/);
    var out = { "@type": "PostalAddress", addressCountry: "IT" };
    if (m) { out.streetAddress = m[1]; out.postalCode = m[2]; out.addressLocality = m[3]; if (m[4]) out.addressRegion = m[4]; }
    else { out.streetAddress = a; if (R.city) out.addressLocality = R.city; }
    return out;
  }
  function setMeta(sel, attr, val) { var m = document.querySelector(sel); if (m && val) m.setAttribute(attr, val); }
  function updateSEO() {
    var url = siteUrl(), heroImg = $(".hero__slide");
    var img = heroImg ? absUrl((heroImg.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/) || [])[1]) : "";
    if (/^data:/.test(img)) img = absUrl("assets/img/hero-1.webp");
    var hours = [];
    Object.keys(R.hours || {}).forEach(function (d) {
      (R.hours[d] || []).forEach(function (r) {
        hours.push({ "@type": "OpeningHoursSpecification", dayOfWeek: DAY_EN[d], opens: r[0], closes: r[1] === "00:00" ? "23:59" : r[1] });
      });
    });
    var today = ymd(romeNow().date);
    var special = (R.booking.closedDates || []).filter(function (d) { return d >= today; }).map(function (d) {
      return { "@type": "OpeningHoursSpecification", validFrom: d, validThrough: d, opens: "00:00", closes: "00:00" };
    });
    var data = {
      "@context": "https://schema.org", "@type": "Restaurant",
      name: R.name, url: url, image: img, telephone: R.phone, email: R.email,
      address: parseAddress(R.address),
      servesCuisine: String(R.cuisine || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean),
      priceRange: R.priceRange || undefined,
      acceptsReservations: "True",
      hasMenu: url + "#menu",
      openingHoursSpecification: hours,
      sameAs: [R.instagram, R.facebook, R.tripadvisor].filter(function (x) { return x && !/^https?:\/\/(www\.)?[a-z]+\.(com|it)\/?$/.test(x); })
    };
    if (special.length) data.specialOpeningHoursSpecification = special;
    var ld = document.getElementById("ld-restaurant");
    if (ld) ld.textContent = JSON.stringify(data, null, 2);
    var canon = $('link[rel="canonical"]'); if (canon) canon.href = url;
    setMeta('meta[property="og:url"]', "content", url);
    setMeta('meta[property="og:image"]', "content", img);
    setMeta('meta[property="og:site_name"]', "content", R.name);
    setMeta('meta[property="og:title"]', "content", R.seoTitle || document.title);
    setMeta('meta[property="og:description"]', "content", R.seoDescription || ($('meta[name="description"]') || {}).content);
  }

  /* ---------- Aperto / chiuso ---------- */
  function renderStatus() {
    var el = $(".js-open-status"), dot = $(".status-dot");
    if (!el) return;
    var now = romeNow(), today = R.hours[now.dow] || [];
    for (var i = 0; i < today.length; i++) {
      if (now.min >= openMin(today[i][0]) && now.min < toMin(today[i][1])) {
        el.textContent = t("openNow") + today[i][1];
        dot.className = "status-dot is-open";
        return;
      }
    }
    dot.className = "status-dot is-closed";
    for (var d = 0; d < 8; d++) {
      var dow = (now.dow + d) % 7, ranges = R.hours[dow] || [];
      var check = new Date(now.date); check.setDate(check.getDate() + d);
      if (R.booking.closedDates.indexOf(ymd(check)) !== -1) continue;
      for (var j = 0; j < ranges.length; j++) {
        if (d > 0 || openMin(ranges[j][0]) > now.min) {
          var when = d === 0 ? t("today") : d === 1 ? t("tomorrow") : t("days")[dow].toLowerCase();
          if (lang === "en" && d > 1) when = "on " + t("days")[dow];
          el.textContent = t("closedOpens") + when + t("at") + ranges[j][0];
          return;
        }
      }
    }
    el.textContent = t("closed");
  }

  /* ---------- Tabella orari ---------- */
  function renderHours() {
    var tb = $(".hours__table tbody");
    if (!tb) return;
    var today = romeNow().dow;
    tb.innerHTML = "";
    [1, 2, 3, 4, 5, 6, 0].forEach(function (d) {
      var r = R.hours[d] || [];
      var tr = document.createElement("tr");
      if (d === today) { tr.className = "is-today"; }
      var td1 = document.createElement("td"), td2 = document.createElement("td");
      td1.textContent = t("days")[d];
      td1.setAttribute("data-today", t("todayBadge"));
      td2.textContent = r.length ? r.map(function (x) { return x[0] + " – " + x[1]; }).join("  ·  ") : t("closed");
      tr.appendChild(td1); tr.appendChild(td2); tb.appendChild(tr);
    });
  }

  /* ---------- Titolo hero parola per parola ---------- */
  function splitHero() {
    $$(".hero__title .split").forEach(function (line, li) {
      var target = line.querySelector("em") || line;
      if (target.querySelector(".word")) return;
      var words = target.textContent.trim().split(/\s+/);
      target.innerHTML = "";
      words.forEach(function (w, wi) {
        var s = document.createElement("span");
        s.className = "word";
        s.textContent = w;
        s.style.transitionDelay = (0.15 + li * 0.12 + wi * 0.05) + "s";
        target.appendChild(s);
        if (wi < words.length - 1) target.appendChild(document.createTextNode(" "));
      });
    });
  }

  /* ---------- Lingua ---------- */
  function applyLang(l) {
    lang = l;
    document.documentElement.lang = l;
    $$("[data-en]").forEach(function (el) {
      if (!el.hasAttribute("data-it")) el.setAttribute("data-it", el.innerHTML);
      el.innerHTML = l === "en" ? el.getAttribute("data-en") : el.getAttribute("data-it");
    });
    $$("[data-en-placeholder]").forEach(function (el) {
      if (!el.hasAttribute("data-it-placeholder")) el.setAttribute("data-it-placeholder", el.placeholder);
      el.placeholder = l === "en" ? el.getAttribute("data-en-placeholder") : el.getAttribute("data-it-placeholder");
    });
    $$(".lang__btn").forEach(function (b) { b.classList.toggle("is-active", b.dataset.lang === l); });
    try { localStorage.setItem("lang", l); } catch (e) {}
    splitHero();
    renderStatus();
    renderHours();
    if (booking) booking.refresh();
  }

  /* ---------- Header, navigazione, quickbar ---------- */
  function initHeader() {
    var header = $(".header"), last = 0, hero = $(".hero"), quick = $(".quickbar");
    var burger = $(".burger"), mnav = $(".mobile-nav");
    function onScroll() {
      var y = window.scrollY, heroH = hero.offsetHeight;
      header.classList.toggle("is-scrolled", y > 40);
      header.classList.toggle("is-hidden", y > heroH && y > last && !mnav.classList.contains("is-open"));
      last = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    function toggleMenu(open) {
      burger.setAttribute("aria-expanded", open);
      mnav.classList.toggle("is-open", open);
      mnav.setAttribute("aria-hidden", !open);
      document.body.classList.toggle("no-scroll", open);
    }
    burger.addEventListener("click", function () { toggleMenu(burger.getAttribute("aria-expanded") !== "true"); });
    $$("a", mnav).forEach(function (a) { a.addEventListener("click", function () { toggleMenu(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") toggleMenu(false); });

    // voce di menu attiva
    var links = $$(".nav a");
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) links.forEach(function (a) { a.classList.toggle("is-current", a.getAttribute("href") === "#" + en.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main section[id]").forEach(function (s) { spy.observe(s); });

    // quickbar mobile: visibile dopo l'hero, nascosta sul form di prenotazione
    var pastHero = false, onBooking = false;
    var update = function () { quick.classList.toggle("is-visible", pastHero && !onBooking); };
    new IntersectionObserver(function (e) { pastHero = !e[0].isIntersecting; update(); }).observe(hero);
    new IntersectionObserver(function (e) { onBooking = e[0].isIntersecting; update(); }, { threshold: 0.15 }).observe($("#prenota"));
  }

  /* ---------- Hero slideshow ---------- */
  function initHero() {
    var slides = $$(".hero__slide"), dots = $$(".hero__dots button"), i = 0, timer;
    function go(n) {
      slides[i].classList.remove("is-active"); dots[i].classList.remove("is-active");
      i = (n + slides.length) % slides.length;
      slides[i].classList.add("is-active");
      void dots[i].offsetWidth; // riavvia l'animazione della barra
      dots[i].classList.add("is-active");
    }
    function start() { clearInterval(timer); if (!reduceMotion) timer = setInterval(function () { go(i + 1); }, 6500); }
    dots.forEach(function (d, n) { d.addEventListener("click", function () { go(n); start(); }); });
    start();
  }

  /* ---------- Animazioni allo scroll ---------- */
  function initReveal() {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, sibs = $$(".reveal:not(.is-in)", el.parentNode);
        var delay = Math.max(0, sibs.indexOf(el)) * 90;
        setTimeout(function () { el.classList.add("is-in"); }, Math.min(delay, 450));
        io.unobserve(el);
        if (el.classList.contains("counters")) runCounters(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    $$(".reveal").forEach(function (el) { io.observe(el); });
  }

  function runCounters(root) {
    $$(".count", root).forEach(function (el) {
      var to = +el.dataset.to, suf = el.dataset.suffix || "", t0 = null, dur = 1800;
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(to * e) + (p === 1 ? suf : "");
        if (p < 1) requestAnimationFrame(step);
      }
      if (reduceMotion) el.textContent = to + suf; else requestAnimationFrame(step);
    });
  }

  /* ---------- Parallax leggero ---------- */
  function initParallax() {
    if (reduceMotion) return;
    var items = $$("[data-parallax]"), bgs = $$("[data-parallax-bg]"), ticking = false;
    function update() {
      var vh = window.innerHeight;
      items.forEach(function (el) {
        var r = el.getBoundingClientRect(), c = r.top + r.height / 2 - vh / 2;
        el.style.translate = "0 " + (c * +el.dataset.parallax).toFixed(1) + "px";
      });
      bgs.forEach(function (el) {
        var r = el.parentNode.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        el.style.transform = "translate3d(0," + ((r.top + r.height / 2 - vh / 2) * -0.18).toFixed(1) + "px,0)";
      });
      ticking = false;
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---------- Carosello piatti ---------- */
  function initDishes() {
    var track = $(".dishes");
    if (!track) return;
    $$(".slider-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        var card = $(".dish", track);
        track.scrollBy({ left: +b.dataset.dir * (card.offsetWidth + 28), behavior: "smooth" });
      });
    });
    // trascinamento col mouse
    var down = false, sx = 0, sl = 0, moved = false;
    track.addEventListener("mousedown", function (e) { down = true; moved = false; sx = e.pageX; sl = track.scrollLeft; });
    window.addEventListener("mouseup", function () { down = false; track.classList.remove("is-dragging"); });
    track.addEventListener("mousemove", function (e) {
      if (!down) return;
      var dx = e.pageX - sx;
      if (Math.abs(dx) > 5) { moved = true; track.classList.add("is-dragging"); }
      track.scrollLeft = sl - dx;
    });
    track.addEventListener("click", function (e) { if (moved) e.preventDefault(); }, true);
  }

  /* ---------- Menù: tab + filtro vegetariano ---------- */
  function initMenu() {
    var tabs = $$(".tab"), panels = $$(".menu__panel"), veg = $("#veg-filter");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (x) { x.classList.toggle("is-active", x === tab); x.setAttribute("aria-selected", x === tab); });
        panels.forEach(function (p) { p.classList.toggle("is-active", p.dataset.panel === tab.dataset.tab); });
      });
    });
    veg.addEventListener("change", applyVegFilter);
  }
  function applyVegFilter() {
    var veg = $("#veg-filter");
    $$(".menu-item").forEach(function (it) { it.classList.toggle("is-filtered", veg.checked && !it.classList.contains("veg")); });
  }

  /* ---------- Galleria + lightbox ---------- */
  function initGallery() {
    var items = $$(".g-item"), lb = $(".lightbox"), img = $(".lightbox__img"), cap = $(".lightbox__caption"), i = 0, lastFocus;
    function show(n) {
      i = (n + items.length) % items.length;
      var im = $("img", items[i]);
      img.src = items[i].getAttribute("href"); img.alt = im.alt; cap.textContent = im.alt;
    }
    function open(n) { lastFocus = document.activeElement; show(n); lb.hidden = false; document.body.classList.add("no-scroll"); $(".lightbox__close").focus(); }
    function close() { lb.hidden = true; document.body.classList.remove("no-scroll"); if (lastFocus) lastFocus.focus(); }
    items.forEach(function (a, n) { a.addEventListener("click", function (e) { e.preventDefault(); open(n); }); });
    $(".lightbox__close").addEventListener("click", close);
    $(".lightbox__nav--prev").addEventListener("click", function () { show(i - 1); });
    $(".lightbox__nav--next").addEventListener("click", function () { show(i + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(i - 1);
      if (e.key === "ArrowRight") show(i + 1);
    });
    var sx = 0;
    lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) { var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1)); });
  }

  /* ---------- Recensioni ---------- */
  var reviewsCtl = null;
  function initReviews() {
    var track = $(".reviews__track"), dotsWrap = $(".reviews__dots"), i = 0, timer, slides = [], dots = [];
    function go(n) {
      if (!slides.length) return;
      i = (n + slides.length) % slides.length;
      track.style.transform = "translateX(" + (-100 * i) + "%)";
      dots.forEach(function (d, k) { d.classList.toggle("is-active", k === i); });
    }
    function start() { clearInterval(timer); if (!reduceMotion) timer = setInterval(function () { go(i + 1); }, 7000); }
    function setup() {
      slides = $$(".review", track);
      dotsWrap.innerHTML = "";
      slides.forEach(function (_, n) {
        var b = document.createElement("button");
        b.type = "button"; b.setAttribute("aria-label", String(n + 1));
        b.addEventListener("click", function () { go(n); start(); });
        dotsWrap.appendChild(b);
      });
      dots = $$("button", dotsWrap);
      go(Math.min(i, Math.max(0, slides.length - 1))); start();
    }
    var sx = 0;
    track.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    track.addEventListener("touchend", function (e) { var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) { go(i + (dx < 0 ? 1 : -1)); start(); } });
    setup();
    reviewsCtl = { setup: setup, go: go };
  }

  /* ---------- Prenotazione ---------- */
  var booking = null;
  function initBooking() {
    var form = $(".bform"), B = R.booking;
    var state = { step: 1, guests: 0, date: null, time: "", view: null };
    var steps = $$(".bstep", form), bar = $(".bform__progress span"), back = $(".bform__back"), info = $(".bform__stepinfo");
    var today = romeNow();
    var minDate = today.date, maxDate = new Date(minDate); maxDate.setDate(maxDate.getDate() + B.daysAhead);
    state.view = new Date(minDate.getFullYear(), minDate.getMonth(), 1);

    function slotsFor(d) {
      var ranges = R.hours[d.getDay()] || [], out = [];
      if (B.closedDates.indexOf(ymd(d)) !== -1) return out;
      var isToday = ymd(d) === ymd(romeNow().date), nowMin = romeNow().min;
      ranges.forEach(function (r) {
        var end = toMin(r[1]) - B.lastSeatingBeforeClose;
        for (var m = openMin(r[0]); m <= end; m += B.slotMinutes) {
          if (isToday && m < nowMin + 30) continue;
          out.push(m);
        }
      });
      return out;
    }

    function go(n) {
      state.step = n;
      steps.forEach(function (s) { s.classList.toggle("is-active", +s.dataset.step === n); });
      bar.style.width = Math.min(n, 4) * 25 + "%";
      back.hidden = n === 1 || n === 5;
      info.textContent = n < 5 ? t("step") + n + t("of") + "4" : "";
      if (n === 2) renderCal();
      if (n === 3) renderSlots();
      if (n >= 4) renderSummary();
      if (n === 4) setTimeout(function () { $("#b-name").focus({ preventScroll: true }); }, 350);
    }

    function renderGuests() {
      var wrap = $(".guests", form);
      wrap.innerHTML = "";
      for (var g = 1; g <= B.maxGuests; g++) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "chip" + (state.guests === g ? " is-selected" : ""); b.textContent = g;
        b.setAttribute("aria-label", g + " " + (g === 1 ? t("guest") : t("guests")));
        (function (g) {
          b.addEventListener("click", function () { state.guests = g; renderGuests(); setTimeout(function () { go(2); }, 220); });
        })(g);
        wrap.appendChild(b);
      }
      var hint = $(".js-large-group", form);
      hint.hidden = false;
      hint.firstElementChild.textContent = (lang === "it" ? "Più di " + B.maxGuests + " persone? Chiamaci:" : "More than " + B.maxGuests + " guests? Call us:");
    }

    function renderCal() {
      var v = state.view, title = $(".cal__title", form), days = $(".cal__days", form), week = $(".cal__week", form);
      title.textContent = new Intl.DateTimeFormat(locale(), { month: "long", year: "numeric" }).format(v);
      week.innerHTML = "";
      for (var w = 1; w <= 7; w++) {
        var s = document.createElement("span");
        s.textContent = new Intl.DateTimeFormat(locale(), { weekday: "short" }).format(new Date(2024, 0, w)).replace(".", "");
        week.appendChild(s);
      }
      days.innerHTML = "";
      var first = (v.getDay() + 6) % 7, count = new Date(v.getFullYear(), v.getMonth() + 1, 0).getDate();
      for (var e = 0; e < first; e++) days.appendChild(document.createElement("span"));
      for (var d = 1; d <= count; d++) {
        var date = new Date(v.getFullYear(), v.getMonth(), d), b = document.createElement("button");
        b.type = "button"; b.textContent = d;
        b.setAttribute("aria-label", new Intl.DateTimeFormat(locale(), { weekday: "long", day: "numeric", month: "long" }).format(date));
        var off = date < minDate || date > maxDate || !slotsFor(date).length;
        b.disabled = off;
        if (ymd(date) === ymd(minDate)) b.classList.add("is-today");
        if (state.date && ymd(date) === ymd(state.date)) b.classList.add("is-selected");
        (function (date) {
          b.addEventListener("click", function () { state.date = date; state.time = ""; renderCal(); setTimeout(function () { go(3); }, 220); });
        })(date);
        days.appendChild(b);
      }
      $$(".cal__nav", form)[0].disabled = v.getFullYear() === minDate.getFullYear() && v.getMonth() === minDate.getMonth();
      $$(".cal__nav", form)[1].disabled = v.getFullYear() === maxDate.getFullYear() && v.getMonth() === maxDate.getMonth();
    }
    $$(".cal__nav", form).forEach(function (b) {
      b.addEventListener("click", function () { state.view = new Date(state.view.getFullYear(), state.view.getMonth() + +b.dataset.cal, 1); renderCal(); });
    });

    function renderSlots() {
      var wrap = $(".slots", form), list = slotsFor(state.date);
      wrap.innerHTML = "";
      if (!list.length) { wrap.innerHTML = '<p class="slots__empty">' + t("noSlots") + "</p>"; return; }
      var groups = [[t("lunch"), list.filter(function (m) { return m < 17 * 60; })], [t("dinner"), list.filter(function (m) { return m >= 17 * 60; })]];
      groups.forEach(function (g) {
        if (!g[1].length) return;
        var box = document.createElement("div"), h = document.createElement("h5"), grid = document.createElement("div");
        box.className = "slots-group"; h.textContent = g[0];
        g[1].forEach(function (m) {
          var b = document.createElement("button"), label = fmtMin(m);
          b.type = "button"; b.className = "chip" + (state.time === label ? " is-selected" : ""); b.textContent = label;
          b.addEventListener("click", function () { state.time = label; renderSlots(); setTimeout(function () { go(4); }, 220); });
          grid.appendChild(b);
        });
        box.appendChild(h); box.appendChild(grid); wrap.appendChild(box);
      });
    }

    function dateLabel() {
      return state.date ? new Intl.DateTimeFormat(locale(), { weekday: "long", day: "numeric", month: "long" }).format(state.date) : "";
    }
    function renderSummary() {
      $$(".bsummary", form).forEach(function (s) {
        s.innerHTML = "";
        [state.guests + " " + (state.guests === 1 ? t("guest") : t("guests")), dateLabel(), state.time].forEach(function (txt) {
          var sp = document.createElement("span"); sp.textContent = txt; s.appendChild(sp);
        });
      });
    }

    function message() {
      var f = form.elements, lines = [
        t("waIntro"), "",
        "• " + t("people") + ": " + state.guests,
        "• " + t("date") + ": " + dateLabel(),
        "• " + t("time") + ": " + state.time,
        "• " + t("name") + ": " + f.name.value.trim(),
        "• " + t("phone") + ": " + f.phone.value.trim()
      ];
      if (f.email.value.trim()) lines.push("• Email: " + f.email.value.trim());
      if (f.occasion.value) lines.push("• " + t("occasion") + ": " + f.occasion.value);
      if (f.notes.value.trim()) lines.push("• " + t("notes") + ": " + f.notes.value.trim());
      return lines.join("\n");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = form.elements, err = $(".bform__error", form);
      $$(".field", form).forEach(function (x) { x.classList.remove("is-invalid"); });
      var bad = false;
      if (!f.name.value.trim()) { f.name.parentNode.classList.add("is-invalid"); bad = true; }
      if (f.phone.value.replace(/\D/g, "").length < 6) { f.phone.parentNode.classList.add("is-invalid"); bad = true; }
      if (bad) { err.textContent = t("errName"); err.hidden = false; return; }
      if (!$("#b-privacy").checked) { err.textContent = t("errPrivacy"); err.hidden = false; return; }
      err.hidden = true;

      var msg = message();
      $(".js-wa", form).href = "https://wa.me/" + R.whatsapp + "?text=" + encodeURIComponent(msg);
      $(".js-mail", form).href = "mailto:" + R.email + "?subject=" + encodeURIComponent(t("mailSubject") + " — " + dateLabel() + " " + state.time) + "&body=" + encodeURIComponent(msg);

      var done = $(".bdone", form);
      if (B.formEndpoint) {
        fetch(B.formEndpoint, {
          method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({
            persone: state.guests, data: ymd(state.date), ora: state.time, nome: f.name.value, telefono: f.phone.value,
            email: f.email.value, occasione: f.occasion.value, note: f.notes.value, _subject: t("mailSubject")
          })
        }).then(function (r) {
          if (!r.ok) throw new Error();
          $("h3", done).textContent = t("sent");
          $(".bdone__text", done).textContent = t("sentText");
          $(".bdone__actions", done).hidden = true;
        }).catch(function () { /* in caso di errore restano WhatsApp / email */ });
      }
      go(5);
    });

    back.addEventListener("click", function () { if (state.step > 1) go(state.step - 1); });
    $(".bform__restart", form).addEventListener("click", function () {
      form.reset(); state.guests = 0; state.date = null; state.time = "";
      var done = $(".bdone", form);
      $(".bdone__actions", done).hidden = false;
      applyLang(lang);
      go(1);
    });

    // link che preselezionano l'occasione (eventi, degustazione)
    $$(".js-event-link, .js-book-tasting").forEach(function (a) {
      a.addEventListener("click", function () {
        var occ = a.dataset.occasion || "Menù degustazione";
        form.elements.occasion.value = occ;
      });
    });

    renderGuests();
    go(1);
    return {
      refresh: function () {
        renderGuests();
        if (state.step === 2) renderCal();
        if (state.step === 3) renderSlots();
        if (state.step >= 4) renderSummary();
        info.textContent = state.step < 5 ? t("step") + state.step + t("of") + "4" : "";
      }
    };
  }

  /* ---------- Newsletter ---------- */
  function initNewsletter() {
    var f = $(".newsletter"), ok = $(".newsletter__ok");
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = $("input", f);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) { f.classList.add("is-invalid"); return; }
      f.hidden = true; ok.hidden = false;
    });
    $("input", f).addEventListener("input", function () { f.classList.remove("is-invalid"); });
  }

  /* ---------- Cursore e bottoni magnetici (solo desktop) ---------- */
  function initCursor() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches || reduceMotion) return;
    var c = $(".cursor"), dot = $(".cursor__dot"), ring = $(".cursor__ring");
    var x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    document.addEventListener("mousemove", function (e) { x = e.clientX; y = e.clientY; c.classList.remove("is-hidden"); });
    document.addEventListener("mouseleave", function () { c.classList.add("is-hidden"); });
    (function loop() {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      dot.style.transform = "translate(" + x + "px," + y + "px) translate(-50%,-50%)";
      ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();
    document.addEventListener("mouseover", function (e) {
      c.classList.toggle("is-hover", !!e.target.closest("a, button, .g-item, .dish, input, select, textarea, label"));
    });
    $$(".magnetic").forEach(function (b) {
      b.addEventListener("mousemove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = "translate(" + (e.clientX - r.left - r.width / 2) * 0.25 + "px," + (e.clientY - r.top - r.height / 2) * 0.35 + "px)";
      });
      b.addEventListener("mouseleave", function () { b.style.transform = ""; });
    });
  }

  /* ==========================================================================
     CONTENUTI MODIFICABILI DALL'AMMINISTRAZIONE
     I testi e le immagini della pagina ricevono una chiave stabile (data-k);
     il file data/content.json (scritto dal pannello admin) sovrascrive
     testi, immagini, dati del locale, menù e recensioni.
     ========================================================================== */
  var esc = function (v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  };
  // elementi riempiti in automatico da config (si modificano dal pannello "Dati")
  var DYN = ".js-phone, .js-phone-link, .js-email, .js-email-link, .js-address, .js-name, .js-vat, .js-year, .js-map";
  var TEXT_SEL = "h1 .split, h2, h3, h4, legend, p, li, blockquote, figcaption, small, strong, a, button, span, label, option, td";
  var SKIP = ".lang, .hours, [data-list], .js-open-status, .lightbox, .preloader, .cursor, .admin-entry, .guests, .cal, .slots, " +
    ".bsummary, .bform__stepinfo, .bform__error, .js-large-group, .newsletter, .hero__dots, .slider-nav, .reviews__dots, .burger, " +
    ".story__badge, .count, .avatar, .stars, .tag, .line, .dots, script, " + DYN;
  var sectionOf = function (el) {
    var s = el.closest("section[id], header, footer, .marquee, .mobile-nav, .quickbar, .hero, .cellar");
    if (!s) return "page";
    return s.id || (s.className.split(" ")[0]);
  };

  function assignKeys() {
    var counters = {};
    var isText = function (el) {
      if (el.closest(SKIP)) return false;
      if (!el.textContent.trim()) return false;
      if (el.querySelector("a, button, input, select, textarea, svg, img, .count, .tag, .stars, .avatar, " + DYN)) return false;
      return true;
    };
    var cands = $$(TEXT_SEL + ", [data-en]").filter(isText);
    // solo le "foglie": niente elementi che contengono altri testi modificabili
    cands = cands.filter(function (el) { return !cands.some(function (o) { return o !== el && el.contains(o); }); });
    cands.forEach(function (el) {
      var sec = sectionOf(el);
      counters[sec] = (counters[sec] || 0) + 1;
      el.setAttribute("data-k", "t:" + sec + ":" + counters[sec]);
    });
    var ic = {};
    $$("main img, [style*='background-image']").forEach(function (el) {
      if (el.closest(".lightbox, [data-list]")) return;
      var sec = sectionOf(el);
      ic[sec] = (ic[sec] || 0) + 1;
      el.setAttribute("data-img", "i:" + sec + ":" + ic[sec]);
    });
  }

  function readMenuFromDOM() {
    var menu = {};
    $$(".menu__panel").forEach(function (p) {
      menu[p.dataset.panel] = $$(".menu-item", p).map(function (it) {
        var h = $("h4", it).cloneNode(true);
        $$(".tag", h).forEach(function (x) { x.remove(); });
        var d = $("p", it);
        return {
          name: h.textContent.trim(), price: $(".price", it).textContent.trim(),
          desc_it: d ? (d.getAttribute("data-it") || d.innerHTML) : "", desc_en: d ? (d.getAttribute("data-en") || "") : "",
          veg: it.classList.contains("veg"), chef: !!$(".tag--chef", it)
        };
      });
    });
    return menu;
  }
  function renderMenu(menu) {
    $$(".menu__panel").forEach(function (p) {
      var items = menu[p.dataset.panel] || [];
      p.innerHTML = items.map(function (m) {
        var tags = (m.veg ? ' <span class="tag tag--veg" title="Vegetariano">V</span>' : "") + (m.chef ? ' <span class="tag tag--chef" title="Consigliato dallo chef">★</span>' : "");
        var en = m.desc_en || m.desc_it;
        return '<div class="menu-item' + (m.veg ? " veg" : "") + '"><div class="menu-item__row"><h4>' + esc(m.name) + tags +
          '</h4><span class="dots"></span><span class="price">' + esc(m.price) + "</span></div>" +
          (m.desc_it ? '<p data-it="' + esc(m.desc_it) + '" data-en="' + esc(en) + '">' + esc(lang === "en" ? en : m.desc_it) + "</p>" : "") + "</div>";
      }).join("") || '<p class="menu__empty">—</p>';
    });
    applyVegFilter();
  }

  function readReviewsFromDOM() {
    return $$(".review").map(function (r) {
      var q = $("blockquote", r), sm = $("figcaption small", r);
      return {
        name: $("figcaption strong", r).textContent.trim(), stars: ($(".stars", r).textContent.match(/★/g) || []).length || 5,
        text_it: q.getAttribute("data-it") || q.innerHTML, text_en: q.getAttribute("data-en") || "",
        sub_it: sm ? (sm.getAttribute("data-it") || sm.innerHTML) : "", sub_en: sm ? (sm.getAttribute("data-en") || "") : ""
      };
    });
  }
  function renderReviews(list) {
    var initials = function (n) { return n.split(/\s+/).map(function (w) { return w.charAt(0); }).join("").slice(0, 2).toUpperCase(); };
    $(".reviews__track").innerHTML = list.map(function (r) {
      var ten = r.text_en || r.text_it, sen = r.sub_en || r.sub_it, st = Math.max(1, Math.min(5, +r.stars || 5));
      return '<figure class="review"><div class="stars">' + "★★★★★".slice(0, st) + '</div>' +
        '<blockquote data-it="' + esc(r.text_it) + '" data-en="' + esc(ten) + '">' + esc(lang === "en" ? ten : r.text_it) + "</blockquote>" +
        '<figcaption><span class="avatar">' + esc(initials(r.name || "?")) + "</span><span><strong>" + esc(r.name) + "</strong>" +
        '<small data-it="' + esc(r.sub_it) + '" data-en="' + esc(sen) + '">' + esc(lang === "en" ? sen : r.sub_it) + "</small></span></figcaption></figure>";
    }).join("");
    if (reviewsCtl) reviewsCtl.setup();
  }

  // Applica un testo salvato: {it, en}. Il corsivo dorato si ottiene con <em>.
  function applyText(el, v) {
    if (!v) return;
    var it = v.it != null ? v.it : (el.getAttribute("data-it") || el.innerHTML);
    var en = v.en || el.getAttribute("data-en") || it;
    if (el.hasAttribute("data-en") || v.en) {
      el.setAttribute("data-it", it);
      el.setAttribute("data-en", en);
      el.innerHTML = lang === "en" ? en : it;
    } else {
      el.innerHTML = it;
    }
    if (el.classList.contains("split") || el.closest(".split")) splitHero();
  }
  function applyImage(el, src) {
    if (!src) return;
    if (el.tagName === "IMG") {
      el.src = src; el.removeAttribute("srcset");
      var a = el.closest("a.g-item"); if (a) a.href = src;
    } else {
      el.style.backgroundImage = "url('" + src.replace(/'/g, "%27") + "')";
    }
  }
  function syncMarquee() {
    var tr = $(".marquee__track");
    $$(".is-clone", tr).forEach(function (x) { x.remove(); });
    Array.prototype.slice.call(tr.children).forEach(function (c) {
      var k = c.cloneNode(true);
      k.classList.add("is-clone"); k.removeAttribute("data-k"); k.setAttribute("aria-hidden", "true");
      tr.appendChild(k);
    });
  }

  function mergeConfig(c) {
    if (!c) return;
    Object.keys(c).forEach(function (k) {
      if (k === "booking") Object.assign(R.booking, c.booking);
      else R[k] = c[k];
    });
  }

  var content = {};
  function applyContent(c) {
    content = c || {};
    mergeConfig(content.config);
    var texts = content.texts || {}, imgs = content.images || {};
    Object.keys(texts).forEach(function (k) { var el = $('[data-k="' + k + '"]'); if (el) applyText(el, texts[k]); });
    Object.keys(imgs).forEach(function (k) { var el = $('[data-img="' + k + '"]'); if (el) applyImage(el, imgs[k]); });
    if (content.menu) renderMenu(content.menu);
    if (content.reviews) renderReviews(content.reviews);
  }

  // Ridisegna tutto dopo una modifica dal pannello admin
  function rerender(c) {
    content = c || content;
    // riparte dai dati originali di config.js, poi applica quelli salvati
    var base = JSON.parse(JSON.stringify(DEFAULTS.config));
    Object.keys(R).forEach(function (k) { if (k !== "booking" && !(k in base)) delete R[k]; });
    Object.keys(base).forEach(function (k) { if (k === "booking") Object.assign(R.booking, base.booking); else R[k] = base[k]; });
    mergeConfig(content.config);
    fillContacts();
    renderMenu(content.menu || DEFAULTS.menu);
    renderReviews(content.reviews || DEFAULTS.reviews);
    applyLang(lang);
    syncMarquee();
    updateSEO();
  }

  var DEFAULTS = { config: JSON.parse(JSON.stringify(R)) };
  var isAdminSession = function () { try { return sessionStorage.getItem("aurea-admin") === "1"; } catch (e) { return false; } };

  var adminLoading = false;
  function loadAdmin(cb, attempt) {
    if (window.AUREA_ADMIN) return cb && cb();
    if (adminLoading && !attempt) return;
    adminLoading = true;
    attempt = attempt || 1;
    if (!$('link[href^="css/admin.css"]')) {
      var l = document.createElement("link"); l.rel = "stylesheet"; l.href = "css/admin.css"; document.head.appendChild(l);
    }
    var sc = document.createElement("script");
    sc.src = "js/admin.js" + (attempt > 1 ? "?r=" + Date.now() : "");
    sc.onload = function () { adminLoading = false; if (cb) cb(); };
    sc.onerror = function () {
      sc.remove();
      // connessione instabile: riprova ancora due volte prima di arrendersi
      if (attempt < 3) setTimeout(function () { loadAdmin(cb, attempt + 1); }, 800 * attempt);
      else { adminLoading = false; alert("Area amministratore non raggiungibile: controlla la connessione e riprova."); }
    };
    document.body.appendChild(sc);
  }

  /* ---------- Avvio ---------- */
  function boot(published) {
    assignKeys();
    // salva i testi italiani originali prima di qualsiasi modifica
    $$("[data-en]").forEach(function (el) { el.setAttribute("data-it", el.innerHTML); });
    DEFAULTS.menu = readMenuFromDOM();
    DEFAULTS.reviews = readReviewsFromDOM();
    DEFAULTS.texts = {};
    $$("[data-k]").forEach(function (el) {
      DEFAULTS.texts[el.getAttribute("data-k")] = { it: el.getAttribute("data-it") || el.innerHTML, en: el.getAttribute("data-en") || "" };
    });
    DEFAULTS.images = {};
    $$("[data-img]").forEach(function (el) {
      DEFAULTS.images[el.getAttribute("data-img")] = el.tagName === "IMG" ? el.getAttribute("src") : (el.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/) || [])[1];
    });

    var active = published;
    if (isAdminSession()) {
      try { var d = JSON.parse(localStorage.getItem("aurea-draft") || "null"); if (d) active = d; } catch (e) {}
    }
    applyContent(active);
    syncMarquee();
    fillContacts();
    booking = initBooking();
    applyLang(lang);
    initHeader();
    initHero();
    initReveal();
    initParallax();
    initDishes();
    initMenu();
    initGallery();
    initReviews();
    initNewsletter();
    initCursor();
    setInterval(renderStatus, 60000);
    $$(".lang__btn").forEach(function (b) { b.addEventListener("click", function () { applyLang(b.dataset.lang); }); });

    window.AUREA = {
      R: R, DEFAULTS: DEFAULTS, published: published,
      get content() { return content; }, get lang() { return lang; },
      applyText: applyText, applyImage: applyImage, applyLang: applyLang, rerender: rerender,
      syncMarquee: syncMarquee, splitHero: splitHero, esc: esc
    };

    var openAdmin = function () { loadAdmin(function () { window.AUREA_ADMIN.start(); }); };
    $$("[data-admin]").forEach(function (b) { b.addEventListener("click", openAdmin); });
    if (location.hash === "#admin" || isAdminSession()) openAdmin();
    window.addEventListener("hashchange", function () { if (location.hash === "#admin") openAdmin(); });

    var ready = function () {
      document.body.classList.remove("is-loading");
      setTimeout(function () { document.body.classList.add("is-ready"); }, 150);
    };
    if (isAdminSession()) ready();
    else if (document.readyState === "complete") setTimeout(ready, 600);
    else window.addEventListener("load", function () { setTimeout(ready, 400); });
    setTimeout(ready, 2500); // non far mai aspettare troppo il visitatore
  }

  // I contenuti pubblicati vengono letti da data/content.json (se esiste)
  var booted = false;
  var go = function (c) { if (booted) return; booted = true; boot(c && typeof c === "object" ? c : {}); };
  if (window.fetch && location.protocol !== "file:") {
    fetch("data/content.json?v=" + Date.now(), { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(go, function () { go({}); });
    setTimeout(function () { go({}); }, 4000);
  } else {
    go({});
  }
})();
