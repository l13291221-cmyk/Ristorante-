/* ==========================================================================
   CONFIGURAZIONE DEL RISTORANTE
   Modifica SOLO questo file per adattare il sito a un nuovo cliente:
   contatti, orari, giorni di chiusura, prenotazioni e social.
   (Testi, piatti, foto e quasi tutto il resto si cambiano dall'area Amministratore)
   ========================================================================== */
window.RESTAURANT = {
  name: "Aurea",
  tagline: "Cucina d'autore",
  city: "Milano",

  /* Indirizzo pubblico del sito. Vuoto = si usa l'indirizzo da cui il sito è aperto
     (va bene sia su github.io sia con un dominio collegato). */
  siteUrl: "",
  cuisine: "Italiana, Cucina d'autore", // tipo di cucina, separato da virgole
  priceRange: "€€€",
  vat: "01234567890",                 // Partita IVA mostrata nel footer

  phone: "+39 02 1234 5678",          // mostrato e usato per "Chiama"
  whatsapp: "393331234567",           // solo cifre, con prefisso internazionale, senza +
  email: "prenotazioni@aurea-ristorante.it",
  address: "Via della Spiga 12, 20121 Milano MI",
  mapsQuery: "Via della Spiga 12, Milano",

  /* Newsletter: vuoto = il riquadro non compare. Incolla l'indirizzo di un modulo
     Formspree (o simile) per raccogliere davvero le iscrizioni. */
  newsletterEndpoint: "",

  instagram: "https://instagram.com/",
  facebook: "https://facebook.com/",
  tripadvisor: "https://tripadvisor.it/",

  timezone: "Europe/Rome",

  /* Tasto "Amministratore" nella prima schermata.
     Se false, l'area admin resta raggiungibile aggiungendo #admin all'indirizzo. */
  showAdminButton: true,

  /* Orari: 0 = domenica, 1 = lunedì ... 6 = sabato.
     Ogni giorno è una lista di fasce ["HH:MM","HH:MM"]. Lista vuota = chiuso. */
  hours: {
    0: [["12:30", "15:00"]],
    1: [],
    2: [["12:30", "14:30"], ["19:30", "23:30"]],
    3: [["12:30", "14:30"], ["19:30", "23:30"]],
    4: [["12:30", "14:30"], ["19:30", "23:30"]],
    5: [["12:30", "14:30"], ["19:30", "00:00"]],
    6: [["19:30", "00:00"]]
  },

  /* Prenotazioni */
  booking: {
    maxGuests: 12,              // oltre questo numero si invita a chiamare
    daysAhead: 60,              // quanti giorni in avanti si può prenotare
    slotMinutes: 30,            // intervallo tra gli orari proposti
    lastSeatingBeforeClose: 60, // ultimo orario prenotabile = chiusura - N minuti
    closedDates: ["2026-12-25", "2027-01-01", "2026-08-15"], // ferie / festività
    /* Opzionale: endpoint Formspree (https://formspree.io/f/xxxx) o simile.
       Se vuoto, la prenotazione viene inviata via WhatsApp o email. */
    formEndpoint: ""
  }
};
