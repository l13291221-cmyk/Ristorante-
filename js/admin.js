/* ==========================================================================
   AUREA — Area amministratore
   Si apre dal tasto "Amministratore" nella prima schermata (o con #admin).
   PIN iniziale: 123456 (modificabile dal pannello, scheda "Sicurezza").

   Come funziona il salvataggio:
   - ogni modifica viene salvata subito come BOZZA in questo browser;
   - "Pubblica" scrive il file data/content.json (e le foto caricate) nel
     repository GitHub del sito: dopo 1-2 minuti tutti vedono le modifiche;
   - in alternativa si può scaricare content.json e caricarlo a mano.
   ========================================================================== */
(function () {
  "use strict";
  if (window.AUREA_ADMIN) return;

  var A = window.AUREA, R = A.R, esc = A.esc;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clone = function (o) { return JSON.parse(JSON.stringify(o == null ? {} : o)); };
  var LS_DRAFT = "aurea-draft", LS_GH = "aurea-gh", LS_FAIL = "aurea-pin-fail", SS = "aurea-admin";

  /* ---------- SHA-256 (per non salvare mai il PIN in chiaro) ---------- */
  function sha256(str) {
    var ascii = unescape(encodeURIComponent(str));
    var rr = function (v, a) { return (v >>> a) | (v << (32 - a)); };
    var maxWord = Math.pow(2, 32), result = "", words = [], bitLen = ascii.length * 8, hash = [], k = [], pc = 0, comp = {}, i, j;
    for (var c = 2; pc < 64; c++) {
      if (!comp[c]) {
        for (i = 0; i < 313; i += c) comp[i] = c;
        hash[pc] = (Math.pow(c, 0.5) * maxWord) | 0;
        k[pc++] = (Math.pow(c, 1 / 3) * maxWord) | 0;
      }
    }
    ascii += "\x80";
    while (ascii.length % 64 - 56) ascii += "\x00";
    for (i = 0; i < ascii.length; i++) { j = ascii.charCodeAt(i); words[i >> 2] |= j << ((3 - i) % 4) * 8; }
    words[words.length] = (bitLen / maxWord) | 0;
    words[words.length] = bitLen;
    for (j = 0; j < words.length;) {
      var w = words.slice(j, j += 16), old = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2], a = hash[0], e = hash[4];
        var t1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i] +
          (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
        var t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(t1 + t2) | 0].concat(hash);
        hash[4] = (hash[4] + t1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + old[i]) | 0;
    }
    for (i = 0; i < 8; i++) for (j = 3; j + 1; j--) { var b = (hash[i] >> (j * 8)) & 255; result += (b < 16 ? "0" : "") + b.toString(16); }
    return result;
  }
  var hashPin = function (p) { return sha256("aurea-pin:" + p); };
  var DEFAULT_PIN = hashPin("123456");

  /* ---------- Storage sicuro (può fallire in navigazione privata) ---------- */
  var ls = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  /* ---------- Bozza ---------- */
  var draft = null;
  function loadDraft() {
    draft = ls.get(LS_DRAFT) || clone(A.published);
    ["texts", "images", "config"].forEach(function (k) { if (!draft[k] || typeof draft[k] !== "object") draft[k] = {}; });
  }
  var normalize = function (o) {
    var c = clone(o);
    ["texts", "images", "config"].forEach(function (k) { if (c[k] && !Object.keys(c[k]).length) delete c[k]; });
    delete c.updatedAt;
    return JSON.stringify(c);
  };
  var isDirty = function () { return !!ls.get(LS_DRAFT) && normalize(draft) !== normalize(A.published || {}); };
  function saveDraft() {
    if (!ls.set(LS_DRAFT, draft)) {
      toast("Memoria del browser piena: pubblica le modifiche o usa foto più leggere.", true);
      return false;
    }
    updateState();
    return true;
  }
  var cfg = function (k) { return k in draft.config ? draft.config[k] : A.DEFAULTS.config[k]; };
  var bcfg = function (k) { return draft.config.booking && k in draft.config.booking ? draft.config.booking[k] : A.DEFAULTS.config.booking[k]; };
  var rerenderT;
  function liveRerender() { clearTimeout(rerenderT); rerenderT = setTimeout(function () { A.rerender(draft); }, 250); }

  /* ---------- Conversione testo <-> HTML (con *corsivo*) ---------- */
  function toPlain(html) {
    var d = document.createElement("div");
    d.innerHTML = String(html || "").replace(/<br\s*\/?>/gi, "\n").replace(/<em>/gi, "*").replace(/<\/em>/gi, "*");
    return d.textContent;
  }
  function fromPlain(txt) {
    return esc(String(txt || "").trim()).replace(/\*([^*]+)\*/g, "<em>$1</em>").replace(/\n/g, "<br>");
  }

  /* ---------- UI di base ---------- */
  var ui = {};
  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }
  function toast(msg, bad) {
    var t = ui.toast;
    t.textContent = msg; t.className = "adm-toast is-on" + (bad ? " is-bad" : "");
    clearTimeout(t._h); t._h = setTimeout(function () { t.className = "adm-toast"; }, bad ? 5000 : 2600);
  }
  var ICON = {
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    pen: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    min: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
    up: '<svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>'
  };

  /* ==========================================================================
     ACCESSO CON PIN
     ========================================================================== */
  function currentPinHash() {
    var d = ls.get(LS_DRAFT);
    return (d && d.pinHash) || (A.published && A.published.pinHash) || DEFAULT_PIN;
  }
  function showPinPad() {
    if ($(".adm-pin")) return;
    var box = el(
      '<div class="adm-pin" role="dialog" aria-modal="true" aria-label="Accesso amministratore">' +
      '<div class="adm-pin__card">' +
      '<button type="button" class="adm-pin__x" aria-label="Chiudi">' + ICON.close + "</button>" +
      '<div class="adm-pin__icon">' + ICON.lock + "</div>" +
      "<h2>Area amministratore</h2><p>Inserisci il PIN a 6 cifre</p>" +
      '<div class="adm-pin__dots">' + "<i></i><i></i><i></i><i></i><i></i><i></i>" + "</div>" +
      '<p class="adm-pin__msg" aria-live="assertive"></p>' +
      '<div class="adm-pin__pad">' +
      [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (n) { return '<button type="button" data-n="' + n + '">' + n + "</button>"; }).join("") +
      '<span></span><button type="button" data-n="0">0</button><button type="button" data-del aria-label="Cancella">⌫</button>' +
      "</div></div></div>");
    document.body.appendChild(box);
    document.body.classList.add("no-scroll");
    var pin = "", dots = $$(".adm-pin__dots i", box), msg = $(".adm-pin__msg", box);

    function locked() {
      var f = ls.get(LS_FAIL) || {};
      if (f.until && f.until > Date.now()) {
        msg.textContent = "Troppi tentativi. Riprova tra " + Math.ceil((f.until - Date.now()) / 60000) + " min.";
        return true;
      }
      return false;
    }
    function paint() { dots.forEach(function (d, i) { d.classList.toggle("is-on", i < pin.length); }); }
    function close() { box.remove(); document.body.classList.remove("no-scroll"); document.removeEventListener("keydown", onKey); if (location.hash === "#admin") history.replaceState(null, "", location.pathname + location.search); }
    function check() {
      if (locked()) { pin = ""; paint(); return; }
      if (hashPin(pin) === currentPinHash()) {
        ls.del(LS_FAIL);
        try { sessionStorage.setItem(SS, "1"); } catch (e) {}
        box.classList.add("is-ok");
        setTimeout(function () {
          close();
          // se esiste una bozza, ricarica per mostrarla sulla pagina
          if (ls.get(LS_DRAFT)) location.reload(); else openPanel();
        }, 450);
      } else {
        var f = ls.get(LS_FAIL) || { count: 0 };
        f.count = (f.count || 0) + 1;
        if (f.count >= 5) { f.until = Date.now() + 5 * 60000; f.count = 0; }
        ls.set(LS_FAIL, f);
        box.classList.remove("is-shake"); void box.offsetWidth; box.classList.add("is-shake");
        msg.textContent = f.until && f.until > Date.now() ? "Troppi tentativi. Riprova tra 5 minuti." : "PIN errato";
        pin = ""; paint();
      }
    }
    function press(n) {
      if (n === "del") { pin = pin.slice(0, -1); paint(); return; }
      if (pin.length >= 6) return;
      msg.textContent = "";
      pin += n; paint();
      if (pin.length === 6) setTimeout(check, 150);
    }
    function onKey(e) {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") press("del");
      else if (e.key === "Escape") close();
    }
    $$(".adm-pin__pad button", box).forEach(function (b) { b.addEventListener("click", function () { press(b.hasAttribute("data-del") ? "del" : b.dataset.n); }); });
    $(".adm-pin__x", box).addEventListener("click", close);
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    document.addEventListener("keydown", onKey);
    locked();
  }

  /* ==========================================================================
     PANNELLO
     ========================================================================== */
  var TABS = [
    ["pagina", "Pagina"], ["dati", "Dati"], ["orari", "Orari"], ["menu", "Menù"],
    ["recensioni", "Recensioni"], ["immagini", "Immagini"], ["sicurezza", "Sicurezza"], ["pubblica", "Pubblica"]
  ];
  var currentTab = "pagina";

  function buildUI() {
    if (ui.panel) return;
    ui.panel = el(
      '<aside class="adm" aria-label="Pannello amministratore">' +
      '<header class="adm__head"><div><strong>Amministrazione</strong><span class="adm__state"></span></div>' +
      '<div class="adm__head-btns"><button type="button" class="adm__icon" data-act="hide" title="Riduci">' + ICON.min + "</button>" +
      '<button type="button" class="adm__icon" data-act="logout" title="Esci">' + ICON.close + "</button></div></header>" +
      '<nav class="adm__tabs">' + TABS.map(function (t) { return '<button type="button" data-tab="' + t[0] + '">' + t[1] + "</button>"; }).join("") + "</nav>" +
      '<div class="adm__body"></div>' +
      '<footer class="adm__foot"><button type="button" class="adm-btn adm-btn--ghost" data-act="edit">' + ICON.pen + " Modifica pagina</button>" +
      '<button type="button" class="adm-btn" data-act="publish">Pubblica</button></footer>' +
      "</aside>");
    ui.tab = el('<button type="button" class="adm-fab" title="Apri pannello amministratore">' + ICON.lock + "<span>Admin</span></button>");
    ui.bar = el('<div class="adm-bar"><span>' + ICON.pen + ' <b>Modifica</b> <em class="adm-bar__hint">tocca un testo o una foto</em></span>' +
      '<select aria-label="Pagina da modificare">' + A.pageOrder.map(function (p) { return '<option value="' + p + '">' + esc(A.pageNames[p]) + "</option>"; }).join("") + "</select>" +
      '<button type="button" class="adm-btn" data-act="done">Fine</button></div>');
    // in modalità modifica i link non funzionano: si cambia pagina da qui
    $("select", ui.bar).addEventListener("change", function (e) { A.showPage(e.target.value, null, true); $$(".reveal").forEach(function (r) { r.classList.add("is-in"); }); });
    document.addEventListener("aurea:page", function (e) { $("select", ui.bar).value = e.detail; });
    ui.toast = el('<div class="adm-toast" role="status" aria-live="polite"></div>');
    [ui.panel, ui.tab, ui.bar, ui.toast].forEach(function (n) { document.body.appendChild(n); });

    ui.body = $(".adm__body", ui.panel);
    $$(".adm__tabs button", ui.panel).forEach(function (b) { b.addEventListener("click", function () { showTab(b.dataset.tab); }); });
    ui.panel.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]");
      if (!b) return;
      var act = b.dataset.act;
      if (act === "hide") hidePanel();
      if (act === "logout") logout();
      if (act === "edit") startEditing();
      if (act === "publish") { showTab("pubblica"); publish(); }
    });
    ui.tab.addEventListener("click", openPanel);
    $("[data-act=done]", ui.bar).addEventListener("click", function () { stopEditing(); openPanel(); });
  }

  function openPanel() {
    loadDraft();
    buildUI();
    document.body.classList.add("adm-on");
    ui.panel.classList.add("is-open");
    ui.tab.classList.remove("is-on");
    showTab(currentTab);
    updateState();
  }
  function hidePanel() { ui.panel.classList.remove("is-open"); ui.tab.classList.add("is-on"); }
  function logout() {
    stopEditing();
    try { sessionStorage.removeItem(SS); } catch (e) {}
    var msg = isDirty() ? "Sei uscito. Le modifiche non pubblicate restano salvate come bozza su questo dispositivo." : "Sei uscito dall'area amministratore.";
    ui.panel.classList.remove("is-open"); ui.tab.classList.remove("is-on");
    document.body.classList.remove("adm-on");
    if (location.hash === "#admin") history.replaceState(null, "", location.pathname + location.search);
    // ricarica per mostrare la versione pubblicata, come la vedono i visitatori
    toast(msg);
    setTimeout(function () { location.reload(); }, 1200);
  }
  function updateState() {
    if (!ui.panel) return;
    var d = isDirty(), s = $(".adm__state", ui.panel);
    s.textContent = d ? "● Modifiche non pubblicate" : "✓ Tutto pubblicato";
    s.classList.toggle("is-dirty", d);
    ui.tab.classList.toggle("is-dirty", d);
  }
  function showTab(name) {
    currentTab = name;
    $$(".adm__tabs button", ui.panel).forEach(function (b) { b.classList.toggle("is-active", b.dataset.tab === name); });
    ui.body.innerHTML = "";
    ui.body.scrollTop = 0;
    ({ pagina: tabPage, dati: tabData, orari: tabHours, menu: tabMenu, recensioni: tabReviews, immagini: tabImages, sicurezza: tabSecurity, pubblica: tabPublish })[name]();
    var active = $(".adm__tabs .is-active", ui.panel);
    if (active && active.scrollIntoView) active.scrollIntoView({ block: "nearest", inline: "center" });
  }
  function section(title, intro) {
    var s = el('<section class="adm-sec"><h3>' + title + "</h3>" + (intro ? '<p class="adm-note">' + intro + "</p>" : "") + "</section>");
    ui.body.appendChild(s);
    return s;
  }
  function field(label, value, opts) {
    opts = opts || {};
    var id = "adm-f" + Math.random().toString(36).slice(2, 8);
    var input = opts.textarea
      ? '<textarea id="' + id + '" rows="' + (opts.rows || 3) + '" placeholder="' + esc(opts.placeholder || "") + '">' + esc(value) + "</textarea>"
      : '<input id="' + id + '" type="' + (opts.type || "text") + '" value="' + esc(value) + '" placeholder="' + esc(opts.placeholder || "") + '"' + (opts.attrs || "") + ">";
    return '<label class="adm-field" for="' + id + '"><span>' + label + "</span>" + input + (opts.help ? "<small>" + opts.help + "</small>" : "") + "</label>";
  }
  var flash = function () { toast("Salvato come bozza ✓"); };
  var debounce = function (fn, ms) { var h; return function () { var a = arguments, t = this; clearTimeout(h); h = setTimeout(function () { fn.apply(t, a); }, ms); }; };
  var flashLater = debounce(flash, 900);

  /* ---------- Scheda: Pagina ---------- */
  function tabPage() {
    var n = Object.keys(draft.texts).length, m = Object.keys(draft.images).length;
    var s = section("Modifica testi e foto", "Entra in modalità modifica e tocca direttamente qualsiasi titolo, paragrafo, pulsante o foto del sito per cambiarlo. Puoi scrivere sia la versione italiana sia quella inglese.");
    s.appendChild(el('<button type="button" class="adm-btn adm-btn--big">' + ICON.pen + " Modifica la pagina</button>"));
    s.lastChild.addEventListener("click", startEditing);
    s.appendChild(el('<ul class="adm-list">' +
      "<li><b>Testi:</b> tocca il testo, scrivi, premi Salva. Metti una parola tra *asterischi* per il corsivo dorato.</li>" +
      "<li><b>Foto:</b> tocca la foto e caricane una nuova dal telefono o dal computer.</li>" +
      "<li><b>Menù, recensioni, orari e contatti</b> si cambiano dalle schede qui sopra.</li>" +
      "<li>Le modifiche restano in <b>bozza</b> finché non premi <b>Pubblica</b>.</li></ul>"));

    var sp = section("Pagine del sito", "Spegni una pagina se il ristorante non la usa: sparisce dal sito insieme a tutti i tasti che portavano lì. Puoi riaccenderla quando vuoi, i contenuti restano salvati.");
    var hidden = (cfg("hiddenPages") || []).slice();
    var WARN = {
      prenota: "Senza la pagina Prenota i clienti non potranno più prenotare dal sito (resta il tasto Chiama). Spegnerla?",
      menu: "Il menù è la pagina più visitata. Sei sicuro di volerla spegnere?"
    };
    A.pageOrder.forEach(function (pg) {
      var home = pg === "home", on = home || hidden.indexOf(pg) === -1;
      var row = el('<label class="adm-switch' + (home ? " is-locked" : "") + '"><span><b>' + esc(A.pageNames[pg]) + "</b>" +
        (home ? "<small>Sempre visibile</small>" : "<small>" + (on ? "Visibile" : "Spenta") + "</small>") + "</span>" +
        '<input type="checkbox"' + (on ? " checked" : "") + (home ? " disabled" : "") + '><i aria-hidden="true"></i></label>');
      if (!home) $("input", row).addEventListener("change", function (e) {
        if (!e.target.checked && WARN[pg] && !confirm(WARN[pg])) { e.target.checked = true; return; }
        var i = hidden.indexOf(pg);
        if (e.target.checked && i !== -1) hidden.splice(i, 1);
        if (!e.target.checked && i === -1) hidden.push(pg);
        draft.config.hiddenPages = hidden.slice();
        if (!hidden.length) delete draft.config.hiddenPages;
        $("small", row).textContent = e.target.checked ? "Visibile" : "Spenta";
        saveDraft(); liveRerender();
        toast(e.target.checked ? "Pagina «" + A.pageNames[pg] + "» riaccesa ✓" : "Pagina «" + A.pageNames[pg] + "» spenta ✓");
      });
      sp.appendChild(row);
    });

    var s2 = section("Riepilogo");
    s2.appendChild(el('<p class="adm-note">Testi modificati: <b>' + n + "</b> · Foto cambiate: <b>" + m + "</b></p>"));
    if (n || m) {
      var r = el('<button type="button" class="adm-btn adm-btn--ghost adm-btn--danger">Ripristina tutti i testi e le foto originali</button>');
      r.addEventListener("click", function () {
        if (!confirm("Vuoi davvero riportare tutti i testi e le foto alla versione originale?")) return;
        Object.keys(draft.texts).forEach(function (k) { var e = $('[data-k="' + k + '"]'); if (e) A.applyText(e, A.DEFAULTS.texts[k]); });
        Object.keys(draft.images).forEach(function (k) { var e = $('[data-img="' + k + '"]'); if (e) A.applyImage(e, A.DEFAULTS.images[k]); });
        draft.texts = {}; draft.images = {};
        saveDraft(); A.syncMarquee(); showTab("pagina"); flash();
      });
      s2.appendChild(r);
    }

    var s3 = section("Tasto Amministratore");
    var chk = el('<label class="adm-check"><input type="checkbox"' + (cfg("showAdminButton") !== false ? " checked" : "") + "> Mostra il tasto «Amministratore» nella prima schermata</label>");
    s3.appendChild(chk);
    s3.appendChild(el('<p class="adm-note">Se lo nascondi, entri comunque aggiungendo <code>#admin</code> alla fine dell\'indirizzo del sito.</p>'));
    $("input", chk).addEventListener("change", function (e) { draft.config.showAdminButton = e.target.checked; saveDraft(); liveRerender(); flash(); });
  }

  /* ---------- Scheda: Dati ---------- */
  var DATA_FIELDS = [
    ["Il locale"],
    ["name", "Nome del ristorante"],
    ["vat", "Partita IVA"],
    ["Contatti"],
    ["phone", "Telefono", { type: "tel" }],
    ["whatsapp", "Numero WhatsApp", { help: "Solo numeri con prefisso, senza + (es. 393331234567). Riceve le prenotazioni.", attrs: ' inputmode="numeric"' }],
    ["email", "Email", { type: "email" }],
    ["address", "Indirizzo completo"],
    ["mapsQuery", "Indirizzo per la mappa", { help: "Come lo scriveresti su Google Maps." }],
    ["Social"],
    ["instagram", "Instagram (link)", { type: "url" }],
    ["facebook", "Facebook (link)", { type: "url" }],
    ["tripadvisor", "Tripadvisor (link)", { type: "url" }],
    ["Google"],
    ["siteUrl", "Indirizzo del sito", { type: "url", help: "Con la barra finale. Se colleghi un dominio (es. https://www.nomeristorante.it/) scrivilo qui." }],
    ["cuisine", "Tipo di cucina", { placeholder: "Italiana, Pesce, Pizzeria", help: "Separato da virgole. Aiuta Google a capire cosa servite." }],
    ["priceRange", "Fascia di prezzo", { placeholder: "€€€", help: "Da € (economico) a €€€€ (alta cucina)." }],
    ["seoTitle", "Titolo nei risultati di Google", { placeholder: document.title }],
    ["seoDescription", "Descrizione nei risultati di Google", { textarea: true, placeholder: ($('meta[name="description"]') || {}).content }]
  ];
  function tabData() {
    var s;
    DATA_FIELDS.forEach(function (f) {
      if (f.length === 1) { s = section(f[0]); return; }
      var node = el(field(f[1], cfg(f[0]) || "", f[2]));
      var inp = $("input, textarea", node);
      inp.addEventListener("input", function () {
        var v = inp.value;
        if (f[0] === "whatsapp") v = v.replace(/\D/g, "");
        if (v === "" && f[0].indexOf("seo") === 0) delete draft.config[f[0]]; else draft.config[f[0]] = v;
        saveDraft(); liveRerender(); flashLater();
      });
      s.appendChild(node);
    });
    s = section("Prenotazioni via email (facoltativo)", "Se incolli qui l'indirizzo di un modulo Formspree (formspree.io), le prenotazioni ti arrivano anche per email in automatico.");
    var node = el(field("Indirizzo del modulo", bcfg("formEndpoint") || "", { type: "url", placeholder: "https://formspree.io/f/..." }));
    $("input", node).addEventListener("input", function (e) { setBooking("formEndpoint", e.target.value.trim()); });
    s.appendChild(node);
  }
  function setBooking(k, v) {
    draft.config.booking = draft.config.booking || {};
    draft.config.booking[k] = v;
    saveDraft(); liveRerender(); flashLater();
  }

  /* ---------- Scheda: Orari ---------- */
  var DAYS = [[1, "Lunedì"], [2, "Martedì"], [3, "Mercoledì"], [4, "Giovedì"], [5, "Venerdì"], [6, "Sabato"], [0, "Domenica"]];
  function tabHours() {
    var hours = clone(cfg("hours"));
    var commit = function () { draft.config.hours = hours; saveDraft(); liveRerender(); flashLater(); };
    var s = section("Orari di apertura", "Aggiungi una fascia per il pranzo e una per la cena. Nessuna fascia = giorno di chiusura. Per la mezzanotte usa 00:00.");
    DAYS.forEach(function (d) {
      var box = el('<div class="adm-day"><div class="adm-day__head"><b>' + d[1] + '</b><button type="button" class="adm-link">' + ICON.plus + " Fascia</button></div><div class=\"adm-day__rows\"></div></div>");
      var rows = $(".adm-day__rows", box);
      function paint() {
        var list = hours[d[0]] = hours[d[0]] || [];
        rows.innerHTML = list.length ? "" : '<span class="adm-closed">Chiuso</span>';
        list.forEach(function (r, i) {
          var row = el('<div class="adm-range"><input type="time" value="' + r[0] + '" aria-label="Apertura"><span>–</span><input type="time" value="' + r[1] + '" aria-label="Chiusura"><button type="button" class="adm__icon" title="Rimuovi">' + ICON.trash + "</button></div>");
          var ins = $$("input", row);
          ins[0].addEventListener("change", function () { if (ins[0].value) { r[0] = ins[0].value; commit(); } });
          ins[1].addEventListener("change", function () { if (ins[1].value) { r[1] = ins[1].value; commit(); } });
          $("button", row).addEventListener("click", function () { list.splice(i, 1); paint(); commit(); });
          rows.appendChild(row);
        });
      }
      $(".adm-link", box).addEventListener("click", function () {
        var list = hours[d[0]] = hours[d[0]] || [];
        list.push(list.length ? ["19:30", "23:00"] : ["12:30", "15:00"]);
        paint(); commit();
      });
      paint();
      s.appendChild(box);
    });

    var s2 = section("Chiusure straordinarie", "Ferie e festività: in questi giorni non si potrà prenotare.");
    var dates = clone(bcfg("closedDates") || []);
    var listBox = el('<div class="adm-chips"></div>');
    var add = el('<div class="adm-inline"><input type="date" aria-label="Data di chiusura"><button type="button" class="adm-btn adm-btn--ghost">Aggiungi</button></div>');
    function paintDates() {
      dates.sort();
      listBox.innerHTML = dates.length ? "" : '<span class="adm-note">Nessuna chiusura impostata.</span>';
      dates.forEach(function (dt, i) {
        var label = new Date(dt + "T12:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
        var c = el('<span class="adm-chip">' + esc(label) + ' <button type="button" aria-label="Rimuovi">×</button></span>');
        $("button", c).addEventListener("click", function () { dates.splice(i, 1); setBooking("closedDates", dates.slice()); paintDates(); });
        listBox.appendChild(c);
      });
    }
    $("button", add).addEventListener("click", function () {
      var v = $("input", add).value;
      if (v && dates.indexOf(v) === -1) { dates.push(v); setBooking("closedDates", dates.slice()); paintDates(); }
    });
    paintDates();
    s2.appendChild(listBox); s2.appendChild(add);

    var s3 = section("Regole di prenotazione");
    [["maxGuests", "Numero massimo di persone per prenotazione", 1, 40],
     ["daysAhead", "Si può prenotare fino a (giorni in avanti)", 1, 365],
     ["slotMinutes", "Intervallo tra gli orari proposti (minuti)", 5, 120],
     ["lastSeatingBeforeClose", "Ultimo orario prenotabile: minuti prima della chiusura", 0, 240]].forEach(function (f) {
      var node = el(field(f[1], bcfg(f[0]), { type: "number", attrs: ' min="' + f[2] + '" max="' + f[3] + '"' }));
      $("input", node).addEventListener("change", function (e) {
        var v = Math.max(f[2], Math.min(f[3], parseInt(e.target.value, 10) || f[2]));
        e.target.value = v; setBooking(f[0], v);
      });
      s3.appendChild(node);
    });
  }

  /* ---------- Liste modificabili (menù, recensioni) ---------- */
  function listEditor(container, items, render, onChange, addLabel, blank) {
    function paint() {
      container.innerHTML = "";
      items.forEach(function (it, i) {
        var card = el('<div class="adm-card"><div class="adm-card__tools"><span class="adm-card__n">' + (i + 1) + "</span>" +
          '<button type="button" class="adm__icon" data-m="up" title="Sposta su"' + (i === 0 ? " disabled" : "") + ">" + ICON.up + "</button>" +
          '<button type="button" class="adm__icon" data-m="down" title="Sposta giù"' + (i === items.length - 1 ? " disabled" : "") + ">" + ICON.down + "</button>" +
          '<button type="button" class="adm__icon adm__icon--danger" data-m="del" title="Elimina">' + ICON.trash + "</button></div></div>");
        render(card, it, function () { onChange(); });
        $$("[data-m]", card).forEach(function (b) {
          b.addEventListener("click", function () {
            var m = b.dataset.m;
            if (m === "del") { if (!confirm("Eliminare questo elemento?")) return; items.splice(i, 1); }
            if (m === "up" && i > 0) items.splice(i - 1, 0, items.splice(i, 1)[0]);
            if (m === "down" && i < items.length - 1) items.splice(i + 1, 0, items.splice(i, 1)[0]);
            paint(); onChange();
          });
        });
        container.appendChild(card);
      });
      var add = el('<button type="button" class="adm-btn adm-btn--ghost adm-btn--block">' + ICON.plus + " " + addLabel + "</button>");
      add.addEventListener("click", function () {
        items.push(clone(blank)); paint(); onChange();
        var cards = $$(".adm-card", container), last = cards[cards.length - 1];
        if (last) { last.scrollIntoView({ block: "center", behavior: "smooth" }); var f = $("input, textarea", last); if (f) f.focus(); }
      });
      container.appendChild(add);
    }
    paint();
  }
  function bindInputs(card, obj, onChange) {
    $$("[data-f]", card).forEach(function (inp) {
      var f = inp.dataset.f;
      inp.addEventListener(inp.type === "checkbox" || inp.tagName === "SELECT" ? "change" : "input", function () {
        obj[f] = inp.type === "checkbox" ? inp.checked : inp.tagName === "SELECT" ? +inp.value : inp.value;
        onChange();
      });
    });
  }

  /* ---------- Scheda: Menù ---------- */
  var menuCat = "antipasti";
  function tabMenu() {
    var menu = clone(draft.menu || A.DEFAULTS.menu);
    var commit = function () { draft.menu = menu; saveDraft(); liveRerender(); flashLater(); };
    var s = section("Menù", "Scegli la categoria, poi modifica, aggiungi o riordina i piatti. I nomi delle categorie si cambiano da «Modifica pagina».");
    var cats = el('<div class="adm-seg"></div>');
    $$(".menu .tab").forEach(function (t) {
      var b = el('<button type="button" data-c="' + t.dataset.tab + '">' + esc(t.textContent.trim()) + "</button>");
      b.classList.toggle("is-active", t.dataset.tab === menuCat);
      b.addEventListener("click", function () { menuCat = t.dataset.tab; showTab("menu"); });
      cats.appendChild(b);
    });
    s.appendChild(cats);
    var wrap = el("<div></div>");
    s.appendChild(wrap);
    menu[menuCat] = menu[menuCat] || [];
    listEditor(wrap, menu[menuCat], function (card, it, ch) {
      card.appendChild(el("<div>" +
        '<div class="adm-grid2">' + field("Nome del piatto", it.name).replace("<input", '<input data-f="name"') + field("Prezzo", it.price, { placeholder: "€ 18" }).replace("<input", '<input data-f="price"') + "</div>" +
        field("Descrizione (italiano)", toPlain(it.desc_it), { textarea: true, rows: 2 }).replace("<textarea", '<textarea data-f="desc_it"') +
        field("Descrizione (English)", toPlain(it.desc_en), { textarea: true, rows: 2, placeholder: "Facoltativa" }).replace("<textarea", '<textarea data-f="desc_en"') +
        '<div class="adm-inline"><label class="adm-check"><input type="checkbox" data-f="veg"' + (it.veg ? " checked" : "") + '> Vegetariano</label>' +
        '<label class="adm-check"><input type="checkbox" data-f="chef"' + (it.chef ? " checked" : "") + "> Consigliato dallo chef</label></div></div>"));
      var plainObj = new Proxy(it, { set: function (o, k, v) { o[k] = (k === "desc_it" || k === "desc_en") ? fromPlain(v) : v; return true; } });
      bindInputs(card, plainObj, ch);
    }, commit, "Aggiungi piatto", { name: "Nuovo piatto", price: "€ ", desc_it: "", desc_en: "", veg: false, chef: false });
  }

  /* ---------- Scheda: Recensioni ---------- */
  function tabReviews() {
    var list = clone(draft.reviews || A.DEFAULTS.reviews);
    var commit = function () { draft.reviews = list; saveDraft(); liveRerender(); flashLater(); };
    var s = section("Recensioni", "Le recensioni scorrono nella sezione «Dicono di noi». Il voto medio e il numero di recensioni si cambiano da «Modifica pagina».");
    var wrap = el("<div></div>");
    s.appendChild(wrap);
    listEditor(wrap, list, function (card, r, ch) {
      card.appendChild(el("<div>" +
        '<div class="adm-grid2">' + field("Nome", r.name).replace("<input", '<input data-f="name"') +
        '<label class="adm-field"><span>Stelle</span><select data-f="stars">' + [5, 4, 3, 2, 1].map(function (n) { return '<option value="' + n + '"' + (+r.stars === n ? " selected" : "") + ">" + "★★★★★".slice(0, n) + "</option>"; }).join("") + "</select></label></div>" +
        field("Recensione (italiano)", toPlain(r.text_it), { textarea: true, rows: 3 }).replace("<textarea", '<textarea data-f="text_it"') +
        field("Recensione (English)", toPlain(r.text_en), { textarea: true, rows: 3, placeholder: "Facoltativa" }).replace("<textarea", '<textarea data-f="text_en"') +
        '<div class="adm-grid2">' + field("Occasione (italiano)", toPlain(r.sub_it), { placeholder: "Cena di anniversario" }).replace("<input", '<input data-f="sub_it"') +
        field("Occasione (English)", toPlain(r.sub_en), { placeholder: "Facoltativa" }).replace("<input", '<input data-f="sub_en"') + "</div></div>"));
      var p = new Proxy(r, { set: function (o, k, v) { o[k] = /_(it|en)$/.test(k) ? fromPlain(v) : v; return true; } });
      bindInputs(card, p, ch);
    }, commit, "Aggiungi recensione", { name: "Nome C.", stars: 5, text_it: "", text_en: "", sub_it: "", sub_en: "" });
  }

  /* ---------- Scheda: Immagini ---------- */
  var SECTION_NAMES = {
    hero: "Prima schermata", storia: "Storia", piatti: "Piatti firma", chef: "Chef", cellar: "Cantina", galleria: "Galleria",
    eventi: "Eventi", prenota: "Prenotazione", header: "Intestazione", footer: "Piè di pagina", recensioni: "Recensioni", menu: "Menù",
    contatti: "Contatti", marquee: "Striscia scorrevole", tabbar: "Barra in basso", "mobile-nav": "Menù mobile", page: "Pagina"
  };
  var secName = function (key) { return SECTION_NAMES[key.split(":")[1]] || key.split(":")[1]; };
  function tabImages() {
    var s = section("Foto del sito", "Tocca una foto per sostituirla. Consiglio: foto orizzontali, luminose, almeno 1600 pixel di larghezza.");
    var grid = el('<div class="adm-thumbs"></div>');
    Object.keys(A.DEFAULTS.images).forEach(function (k) {
      var node = $('[data-img="' + k + '"]');
      if (!node) return;
      var src = draft.images[k] || A.DEFAULTS.images[k];
      var t = el('<button type="button" class="adm-thumb' + (draft.images[k] ? " is-changed" : "") + '"><img alt="" loading="lazy"><span>' + esc(secName(k)) + (node.alt ? " · " + esc(node.alt) : "") + "</span></button>");
      $("img", t).src = src;
      t.addEventListener("click", function () { editImage(node); });
      grid.appendChild(t);
    });
    s.appendChild(grid);
  }

  /* ---------- Scheda: Sicurezza ---------- */
  function tabSecurity() {
    var s = section("Cambia PIN", "Il PIN protegge l'accesso a quest'area. Dopo averlo cambiato premi <b>Pubblica</b> perché valga su tutti i dispositivi.");
    var f = el("<form class=\"adm-form\" autocomplete=\"off\">" +
      field("PIN attuale", "", { type: "password", attrs: ' inputmode="numeric" maxlength="6" autocomplete="off"' }) +
      field("Nuovo PIN (6 cifre)", "", { type: "password", attrs: ' inputmode="numeric" maxlength="6" autocomplete="new-password"' }) +
      field("Ripeti il nuovo PIN", "", { type: "password", attrs: ' inputmode="numeric" maxlength="6" autocomplete="new-password"' }) +
      '<p class="adm-err" hidden></p><button type="submit" class="adm-btn">Salva nuovo PIN</button></form>');
    s.appendChild(f);
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var ins = $$("input", f), err = $(".adm-err", f);
      var fail = function (m) { err.textContent = m; err.hidden = false; };
      if (hashPin(ins[0].value) !== currentPinHash()) return fail("Il PIN attuale non è corretto.");
      if (!/^\d{6}$/.test(ins[1].value)) return fail("Il nuovo PIN deve avere esattamente 6 cifre.");
      if (/^(\d)\1{5}$/.test(ins[1].value) || ins[1].value === "123456" || ins[1].value === "654321") return fail("Scegli un PIN meno prevedibile.");
      if (ins[1].value !== ins[2].value) return fail("I due PIN non coincidono.");
      draft.pinHash = hashPin(ins[1].value);
      saveDraft();
      err.hidden = true; f.reset();
      toast("PIN cambiato ✓ Ricordati di pubblicare.");
    });

    var s2 = section("Esci");
    var b = el('<button type="button" class="adm-btn adm-btn--ghost">Esci dall\'area amministratore</button>');
    b.addEventListener("click", logout);
    s2.appendChild(b);
  }

  /* ---------- Scheda: Pubblica ---------- */
  function ghSettings() {
    var g = ls.get(LS_GH) || {};
    if (!g.owner && /\.github\.io$/.test(location.hostname)) {
      g.owner = location.hostname.split(".")[0];
      g.repo = location.pathname.split("/")[1] || location.hostname;
    }
    g.branch = g.branch || "main";
    return g;
  }
  function tabPublish() {
    var g = ghSettings();
    var s = section("Pubblica online", isDirty()
      ? "Hai modifiche in bozza visibili solo a te. Premi <b>Pubblica ora</b> per metterle online per tutti."
      : "Non ci sono modifiche da pubblicare: il sito online è aggiornato.");
    var pub = el('<button type="button" class="adm-btn adm-btn--big">Pubblica ora</button>');
    pub.addEventListener("click", publish);
    s.appendChild(pub);
    s.appendChild(el('<div class="adm-log" hidden></div>'));

    var s2 = section("Collegamento a GitHub", "Il sito è ospitato su GitHub: serve un «token» che permette al pannello di salvare le modifiche. Si configura una volta sola su questo dispositivo. " +
      '<a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">Crea il token qui</a>: scegli solo il repository del sito e il permesso <b>Contents: Read and write</b>.');
    var form = el("<div>" +
      '<div class="adm-grid2">' + field("Utente GitHub", g.owner || "").replace("<input", '<input data-g="owner"') + field("Repository", g.repo || "").replace("<input", '<input data-g="repo"') + "</div>" +
      field("Branch", g.branch).replace("<input", '<input data-g="branch"') +
      field("Token", g.token || "", { type: "password", help: "Resta salvato solo su questo dispositivo, non viene mai pubblicato." }).replace("<input", '<input data-g="token" autocomplete="off"') +
      "</div>");
    $$("[data-g]", form).forEach(function (inp) {
      inp.addEventListener("input", function () { var cur = ghSettings(); cur[inp.dataset.g] = inp.value.trim(); ls.set(LS_GH, cur); });
    });
    s2.appendChild(form);

    var s3 = section("Copia di sicurezza", "Scarica tutti i contenuti in un file, oppure ricaricane uno. Se il sito non è su GitHub, carica il file scaricato nella cartella <code>data/</code> del sito con il nome <code>content.json</code>.");
    var row = el('<div class="adm-inline"><button type="button" class="adm-btn adm-btn--ghost">Scarica file</button><label class="adm-btn adm-btn--ghost">Importa file<input type="file" accept="application/json,.json" hidden></label></div>');
    $("button", row).addEventListener("click", function () {
      var blob = new Blob([JSON.stringify(exportable(draft), null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "content.json"; a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    });
    $("input", row).addEventListener("change", function (e) {
      var file = e.target.files[0]; if (!file) return;
      var rd = new FileReader();
      rd.onload = function () {
        try {
          var data = JSON.parse(rd.result);
          if (typeof data !== "object" || Array.isArray(data)) throw new Error();
          draft = data; saveDraft(); toast("File importato ✓"); setTimeout(function () { location.reload(); }, 700);
        } catch (err) { toast("File non valido.", true); }
      };
      rd.readAsText(file);
    });
    s3.appendChild(row);

    if (isDirty()) {
      var s4 = section("Annulla le modifiche");
      var d = el('<button type="button" class="adm-btn adm-btn--ghost adm-btn--danger">Scarta tutte le modifiche non pubblicate</button>');
      d.addEventListener("click", function () {
        if (!confirm("Tutte le modifiche non ancora pubblicate andranno perse. Continuare?")) return;
        ls.del(LS_DRAFT); location.reload();
      });
      s4.appendChild(d);
    }
  }
  function exportable(o) { var c = clone(o); c.version = 1; c.updatedAt = new Date().toISOString(); return c; }

  /* sitemap.xml e robots.txt, rigenerati a ogni pubblicazione */
  function seoFiles(out) {
    var url = String((out.config && out.config.siteUrl) || A.DEFAULTS.config.siteUrl || "").trim();
    if (!/^https?:\/\//.test(url)) return null;
    if (!/\/$/.test(url)) url += "/";
    var x = function (v) { return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
    var seen = {}, imgs = [];
    Object.keys(A.DEFAULTS.images).forEach(function (k) {
      var src = (out.images && out.images[k]) || A.DEFAULTS.images[k];
      if (!src || /^data:/.test(src)) return;
      var abs = /^https?:\/\//.test(src) ? src : url + src.replace(/^\.?\//, "");
      if (!seen[abs]) { seen[abs] = 1; imgs.push(abs); }
    });
    var sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
      "  <url>\n    <loc>" + x(url) + "</loc>\n    <lastmod>" + new Date().toISOString().slice(0, 10) + "</lastmod>\n" +
      imgs.map(function (i) { return "    <image:image><image:loc>" + x(i) + "</image:loc></image:image>\n"; }).join("") +
      "  </url>\n</urlset>\n";
    var robots = "User-agent: *\nAllow: /\n\nSitemap: " + url + "sitemap.xml\n";
    return { sitemap: sitemap, robots: robots };
  }

  function log(msg, cls) {
    var box = $(".adm-log", ui.body);
    if (!box) return;
    box.hidden = false;
    box.appendChild(el('<p class="' + (cls || "") + '">' + msg + "</p>"));
  }
  var b64utf8 = function (str) { return btoa(unescape(encodeURIComponent(str))); };

  var publishing = false;
  async function publish() {
    if (publishing) return;
    var g = ghSettings();
    if (!g.owner || !g.repo || !g.token) {
      if (currentTab !== "pubblica") showTab("pubblica");
      toast("Completa prima il collegamento a GitHub (utente, repository e token).", true);
      var first = $('[data-g="' + (!g.owner ? "owner" : !g.repo ? "repo" : "token") + '"]', ui.body);
      if (first) first.focus();
      return;
    }
    publishing = true;
    var box = $(".adm-log", ui.body); if (box) box.innerHTML = "";
    var api = "https://api.github.com/repos/" + encodeURIComponent(g.owner) + "/" + encodeURIComponent(g.repo) + "/contents/";
    var headers = { Authorization: "Bearer " + g.token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
    var explain = function (st) {
      return st === 401 ? "Token non valido o scaduto." :
        st === 403 ? "Il token non ha il permesso di scrivere (serve «Contents: Read and write»)." :
        st === 404 ? "Repository o branch non trovati, oppure il token non ha accesso a questo repository." :
        st === 409 || st === 422 ? "Conflitto con una modifica recente: riprova tra qualche secondo." : "Errore GitHub (" + st + ").";
    };
    async function put(path, contentB64, message, skipIfSame) {
      var sha;
      var r = await fetch(api + path + "?ref=" + encodeURIComponent(g.branch), { headers: headers, cache: "no-store" });
      if (r.ok) {
        var cur = await r.json();
        sha = cur.sha;
        if (skipIfSame && String(cur.content || "").replace(/\s/g, "") === contentB64) return;
      }
      else if (r.status !== 404) throw new Error(explain(r.status));
      var body = { message: message, content: contentB64, branch: g.branch };
      if (sha) body.sha = sha;
      var w = await fetch(api + path, { method: "PUT", headers: headers, body: JSON.stringify(body) });
      if (!w.ok) throw new Error(explain(w.status));
    }
    try {
      log("Pubblicazione in corso…");
      var out = exportable(draft);
      var keys = Object.keys(out.images || {}).filter(function (k) { return /^data:image\//.test(out.images[k]); });
      for (var i = 0; i < keys.length; i++) {
        var data = out.images[keys[i]], m = data.match(/^data:image\/(\w+);base64,(.*)$/);
        if (!m) continue;
        var path = "assets/img/uploads/" + Date.now() + "-" + i + "." + (m[1] === "jpeg" ? "jpg" : m[1]);
        log("Carico la foto " + (i + 1) + " di " + keys.length + "…");
        await put(path, m[2], "Admin: nuova foto (" + secName(keys[i]) + ")");
        out.images[keys[i]] = path;
        draft.images[keys[i]] = path;
      }
      log("Salvo i contenuti…");
      await put("data/content.json", b64utf8(JSON.stringify(out, null, 2)), "Admin: aggiornamento contenuti del sito");
      var seo = seoFiles(out);
      if (seo) {
        log("Aggiorno i file per Google…");
        await put("sitemap.xml", b64utf8(seo.sitemap), "Admin: aggiornamento sitemap", true);
        await put("robots.txt", b64utf8(seo.robots), "Admin: aggiornamento robots.txt", true);
      }
      A.published = clone(out);
      draft = clone(out);
      saveDraft();
      log("✓ Pubblicato! Il sito online si aggiorna entro 1–2 minuti.", "is-ok");
      toast("Pubblicato ✓");
    } catch (err) {
      saveDraft(); // conserva i percorsi delle foto già caricate
      log("✕ " + (err && err.message && !/fetch/i.test(err.message) ? err.message : "Connessione a GitHub non riuscita. Controlla internet e riprova."), "is-bad");
      toast("Pubblicazione non riuscita", true);
    }
    publishing = false;
    updateState();
  }

  /* ==========================================================================
     MODIFICA DIRETTA SULLA PAGINA
     ========================================================================== */
  var editing = false;
  function startEditing() {
    editing = true;
    document.body.classList.add("adm-editing");
    $$(".reveal").forEach(function (r) { r.classList.add("is-in"); });
    ui.panel.classList.remove("is-open");
    ui.tab.classList.remove("is-on");
    ui.bar.classList.add("is-on");
    $$("option", ui.bar).forEach(function (o) { o.textContent = A.pageNames[o.value] + (A.isHidden(o.value) ? " (spenta)" : ""); });
    $("select", ui.bar).value = A.page;
    toast("Tocca un testo o una foto per modificarli");
  }
  function stopEditing() {
    editing = false;
    document.body.classList.remove("adm-editing");
    if (ui.bar) ui.bar.classList.remove("is-on");
  }
  function findTarget(t) {
    var txt = t.closest("[data-k]");
    if (txt) return { type: "text", el: txt };
    var img = t.closest("[data-img]");
    if (img) return { type: "img", el: img };
    if (t.closest(".hero__veil, .hero__content") && !t.closest("a, button")) return { type: "img", el: $(".hero__slide.is-active") };
    if (t.closest(".cellar")) return { type: "img", el: $(".cellar__bg") };
    if (t.closest(".booking") && !t.closest(".booking__card")) return { type: "img", el: $(".booking__bg") };
    return null;
  }
  document.addEventListener("click", function (e) {
    if (!editing || e.target.closest(".adm, .adm-bar, .adm-modal, .adm-toast, .adm-fab")) return;
    var tg = findTarget(e.target);
    var link = e.target.closest("a[href]");
    if (tg && tg.el) {
      e.preventDefault(); e.stopPropagation();
      if (tg.type === "text") editText(tg.el); else editImage(tg.el);
    } else if (link) {
      e.preventDefault();
    }
  }, true);
  document.addEventListener("mouseover", function (e) {
    if (!editing) return;
    $$(".adm-hover").forEach(function (x) { x.classList.remove("adm-hover"); });
    if (e.target.closest(".adm, .adm-bar, .adm-modal")) return;
    var tg = findTarget(e.target);
    if (tg && tg.el) (tg.type === "img" && tg.el.closest(".hero, .cellar, .booking") && tg.el.tagName !== "IMG" ? tg.el.parentNode.closest("section") : tg.el).classList.add("adm-hover");
  });

  function modal(title, bodyHTML, buttons) {
    var m = el('<div class="adm-modal" role="dialog" aria-modal="true"><div class="adm-modal__card"><header><h3>' + title +
      '</h3><button type="button" class="adm__icon" data-x title="Chiudi">' + ICON.close + "</button></header>" +
      '<div class="adm-modal__body">' + bodyHTML + '</div><footer class="adm-modal__foot"></footer></div></div>');
    var foot = $(".adm-modal__foot", m);
    var close = function () { m.remove(); document.removeEventListener("keydown", onKey); };
    var onKey = function (e) { if (e.key === "Escape") close(); };
    buttons.forEach(function (b) {
      if (!b) return;
      var btn = el('<button type="button" class="adm-btn' + (b.cls ? " " + b.cls : "") + '">' + b.label + "</button>");
      btn.addEventListener("click", function () { if (b.fn(m) !== false) close(); });
      foot.appendChild(btn);
    });
    $("[data-x]", m).addEventListener("click", close);
    m.addEventListener("mousedown", function (e) { if (e.target === m) close(); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(m);
    var f = $("textarea, input", m); if (f) setTimeout(function () { f.focus(); }, 50);
    return m;
  }

  function editText(node) {
    var k = node.getAttribute("data-k");
    var cur = draft.texts[k] || { it: node.getAttribute("data-it") || node.innerHTML, en: node.getAttribute("data-en") || "" };
    var hasEn = node.hasAttribute("data-en");
    var changed = !!draft.texts[k];
    modal("Modifica testo · " + esc(secName(k)),
      field("Italiano", toPlain(cur.it), { textarea: true, rows: 4 }) +
      field("English", toPlain(cur.en), { textarea: true, rows: 4, placeholder: hasEn ? "" : "Facoltativo: se vuoto resta uguale all'italiano" }) +
      '<p class="adm-note">Suggerimento: scrivi una parola tra *asterischi* per renderla in corsivo dorato.</p>',
      [
        changed ? { label: "Ripristina originale", cls: "adm-btn--ghost adm-btn--danger", fn: function () {
          delete draft.texts[k]; saveDraft(); A.applyText(node, A.DEFAULTS.texts[k]); after(node); toast("Testo originale ripristinato");
        } } : null,
        { label: "Annulla", cls: "adm-btn--ghost", fn: function () {} },
        { label: "Salva", fn: function (m) {
          var t = $$("textarea", m);
          if (!t[0].value.trim()) { toast("Il testo italiano non può essere vuoto.", true); return false; }
          var v = { it: fromPlain(t[0].value), en: t[1].value.trim() ? fromPlain(t[1].value) : "" };
          draft.texts[k] = v; saveDraft();
          A.applyText(node, v); after(node); flash();
        } }
      ]);
  }
  function after(node) {
    if (node.closest(".marquee")) A.syncMarquee();
    // nel menù admin i nomi delle categorie arrivano dalla pagina
    if (currentTab === "menu" && ui.panel.classList.contains("is-open")) showTab("menu");
  }

  /* ---------- Foto: ridimensiona e comprimi prima di salvare ---------- */
  function compress(file, cb) {
    var rd = new FileReader();
    rd.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 1800, w = img.naturalWidth, h = img.naturalHeight, sc = Math.min(1, max / Math.max(w, h));
        var c = document.createElement("canvas");
        c.width = Math.round(w * sc); c.height = Math.round(h * sc);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        var out = c.toDataURL("image/webp", 0.8);
        if (out.indexOf("data:image/webp") !== 0) out = c.toDataURL("image/jpeg", 0.82);
        cb(out);
      };
      img.onerror = function () { toast("Questo file non sembra un'immagine valida.", true); };
      img.src = rd.result;
    };
    rd.readAsDataURL(file);
  }
  function editImage(node) {
    var k = node.getAttribute("data-img");
    var cur = draft.images[k] || A.DEFAULTS.images[k];
    var next = null;
    var m = modal("Cambia foto · " + esc(secName(k)),
      '<div class="adm-imgprev"><img alt=""></div>' +
      '<label class="adm-btn adm-btn--ghost adm-btn--block adm-upload">' + ICON.plus + " Carica una foto dal dispositivo<input type=\"file\" accept=\"image/*\" hidden></label>" +
      field("Oppure incolla il link di una foto", "", { type: "url", placeholder: "https://…" }) +
      '<p class="adm-note">La foto viene ottimizzata in automatico per caricarsi veloce.</p>',
      [
        draft.images[k] ? { label: "Ripristina originale", cls: "adm-btn--ghost adm-btn--danger", fn: function () {
          delete draft.images[k]; saveDraft(); A.applyImage(node, A.DEFAULTS.images[k]); refreshImagesTab(); toast("Foto originale ripristinata");
        } } : null,
        { label: "Annulla", cls: "adm-btn--ghost", fn: function () {} },
        { label: "Salva", fn: function () {
          if (!next) { toast("Scegli prima una nuova foto.", true); return false; }
          draft.images[k] = next;
          if (!saveDraft()) { delete draft.images[k]; return false; }
          A.applyImage(node, next); refreshImagesTab(); flash();
        } }
      ]);
    var prev = $(".adm-imgprev img", m);
    prev.src = cur;
    $(".adm-upload input", m).addEventListener("change", function (e) {
      var f = e.target.files[0]; if (!f) return;
      $(".adm-imgprev", m).classList.add("is-loading");
      compress(f, function (data) { next = data; prev.src = data; $(".adm-imgprev", m).classList.remove("is-loading"); });
    });
    $('input[type="url"]', m).addEventListener("input", function (e) {
      var v = e.target.value.trim();
      if (/^https?:\/\/\S+$/.test(v)) { next = v; prev.src = v; }
    });
  }
  function refreshImagesTab() { if (currentTab === "immagini" && ui.panel && ui.panel.classList.contains("is-open")) showTab("immagini"); }

  /* ---------- Avvio ---------- */
  window.AUREA_ADMIN = {
    start: function () {
      var logged = false;
      try { logged = sessionStorage.getItem(SS) === "1"; } catch (e) {}
      if (logged) openPanel(); else showPinPad();
    },
    sha256: sha256
  };
})();
