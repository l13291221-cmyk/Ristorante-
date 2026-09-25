# Aurea — Sito premium per ristoranti

Sito vetrina di fascia alta per ristoranti: design scuro ed elegante, animazioni cinematografiche, prenotazione online integrata. **Statico al 100%** (HTML + CSS + JS, zero dipendenze): si pubblica gratis su GitHub Pages, Netlify o qualsiasi hosting, e carica veloce.

## Cosa include

| Funzione | Dettaglio |
|---|---|
| **Hero cinematografico** | Slideshow con effetto Ken Burns, titolo animato parola per parola, preloader con logo |
| **Stato "Aperto ora"** | Calcolato in tempo reale sul fuso di Roma: "Aperto · chiude alle 23:30" / "Chiuso · apre domani alle 12:30" |
| **Prenotazione in 4 passi** | Ospiti → calendario (giorni di chiusura e ferie disattivati) → orari reali di pranzo/cena → dati. Invio su **WhatsApp** o email già compilati, oppure a un endpoint (Formspree ecc.) |
| **Menù interattivo** | Schede per categoria, filtro vegetariano, badge "consigliato dallo chef" |
| **Piatti firma** | Carosello trascinabile con foto e prezzi |
| **Chef + menù degustazione** | Con pulsante che precompila la prenotazione |
| **Galleria** | Griglia a mosaico con lightbox (tastiera e swipe) |
| **Recensioni** | Carosello automatico con swipe |
| **Eventi / sala privata / gift card** | Ogni scheda apre la prenotazione con l'occasione già scelta |
| **Contatti** | Orari con "Oggi" evidenziato, mappa Google in tema scuro, indicazioni stradali |
| **Bilingue IT / EN** | Commutatore nel menù, lingua ricordata |
| **Come un'app** | Home in una sola schermata con tasto grande «Menù»; ogni sezione è una pagina a sé con il tasto «Avanti», niente scorrimento infinito. Il tasto indietro del telefono funziona |
| **Mobile first** | Barra in basso Home / Menù / Prenota / Chiama / Dove; categorie del menù sempre visibili in alto |
| **SEO** | Dati strutturati `Restaurant` (schema.org), Open Graph, meta description |
| **Accessibilità** | Navigazione da tastiera, skip link, rispetto di "riduci movimento" |
| **Privacy e cookie** | Pagine Privacy e Cookie; caratteri ospitati nel sito; mappa di Google caricata solo dopo il consenso: nessun cookie di terze parti, quindi niente banner |
| **Dominio fai-da-te** | Dal pannello: guida con i valori DNS, controllo automatico e collegamento con «Pubblica» |
| **Area amministratore** | Tasto «Amministratore» nella prima schermata, PIN, modifica di testi, foto, menù, recensioni, orari e dati senza toccare il codice |

## Area amministratore (per il ristoratore)

1. Nella prima schermata premi **Amministratore** (oppure aggiungi `#admin` all'indirizzo).
2. Inserisci il PIN: all'inizio è **123456**. Cambialo subito dalla scheda **Sicurezza**.
3. Dal pannello puoi:
   - **Pagina → Modifica la pagina**: tocchi qualsiasi titolo, testo, pulsante o foto del sito e lo cambi (italiano e inglese). Scrivi tra `*asterischi*` per il corsivo dorato. Per cambiare pagina mentre modifichi usa il selettore nella barra in basso.
   - **Pagina → Pagine del sito**: spegni o riaccendi un'intera pagina (Menù, Prenota, Chi siamo, Galleria, Eventi, Dove siamo). Spariscono anche tutti i tasti che portavano lì; i contenuti restano salvati.
   - **Tutto si può toccare**: in «Modifica pagina» tocchi qualunque scritta. Nome del locale, telefono, email, indirizzo e P.IVA aprono il campo dei Dati; orari, menù e recensioni aprono la loro scheda; anche i numeri animati, il timbro rotondo e le voci dei menu a tendina sono modificabili.
   - **Scritte**: le frasi che il sito scrive da solo (aperto/chiuso, prenotazione, messaggio WhatsApp, tasti «Avanti»), in italiano e inglese.
   - **Dati**: nome, telefono, WhatsApp, email, indirizzo, social, P.IVA, titolo e descrizione per Google.
   - **Orari**: fasce di pranzo e cena, giorni di chiusura, ferie, regole di prenotazione.
   - **Menù**: aggiungi, modifica, riordina o elimina i piatti di ogni categoria.
   - **Recensioni**: aggiungi, modifica, riordina o elimina le recensioni.
   - **Immagini**: tutte le foto del sito in una griglia, anche quelle dello slideshow.
4. Ogni modifica viene salvata subito come **bozza** (visibile solo a chi è entrato come amministratore su quel dispositivo).
5. Premi **Pubblica** per metterla online per tutti.

### Come funziona la pubblicazione
Il sito resta statico: tutti i contenuti modificati vengono salvati nel file `data/content.json` (e le foto caricate in `assets/img/uploads/`).

- **Sito su GitHub Pages (consigliato):** la prima volta, nella scheda **Pubblica**, inserisci utente, repository e un *token* GitHub
  ([crea il token qui](https://github.com/settings/personal-access-tokens/new): solo il repository del sito, permessi **Contents: Read and write** e **Pages: Read and write**).
  Da quel momento **Pubblica** aggiorna il sito da solo in 1–2 minuti. Il token resta salvato solo su quel dispositivo e non viene mai pubblicato.
- **Altri hosting (Netlify, hosting classico):** usa **Scarica file** e carica il `content.json` scaricato nella cartella `data/` del sito.

### Sicurezza, da sapere
Il PIN serve a tenere fuori i curiosi dal pannello, ma su un sito statico non è una protezione forte (il controllo avviene nel browser).
La vera protezione è il **token GitHub**: senza token nessuno può pubblicare modifiche, anche se indovina il PIN.
Quindi: non condividere il token, e se un dispositivo viene perso revoca il token da GitHub.
Dopo 5 PIN sbagliati l'accesso si blocca per 5 minuti.

## Consegna a un nuovo cliente

Segui la lista passo passo in **[CONSEGNA.md](CONSEGNA.md)**.

## Personalizzare a mano (per chi sa programmare)

1. **`js/config.js`** — nome, telefono, WhatsApp, email, indirizzo, social, **orari**, giorni di ferie, regole di prenotazione. Tutto il sito (stato aperto/chiuso, calendario, orari, link) si aggiorna da solo.
2. **`index.html`** — testi, piatti e prezzi (oppure direttamente dall'area amministratore). Ogni testo ha la traduzione inglese nell'attributo `data-en="..."` accanto.
3. **`assets/img/`** — sostituisci le foto mantenendo gli stessi nomi (formato consigliato `.webp`, max ~2000 px).
4. **Colori e font** — variabili in cima a `css/style.css` (`--gold`, `--bg`, `--serif`…).
5. **SEO** — aggiorna `<title>`, `description`, `canonical` e il blocco JSON-LD in `<head>` di `index.html`.

### Prenotazioni direttamente via email (opzionale)
Crea un modulo gratuito su [formspree.io](https://formspree.io) e incolla l'URL in `booking.formEndpoint` dentro `js/config.js`. Senza endpoint, la prenotazione parte via WhatsApp/email già compilati.

## Pubblicazione
- **GitHub Pages:** Settings → Pages → Branch `main` / root.
- **Netlify:** trascina la cartella su app.netlify.com/drop.
- Anteprima locale: `python3 -m http.server` e apri `http://localhost:8000`.

## Note
- Le foto demo vengono da Unsplash (licenza gratuita, anche per uso commerciale). Per il cliente finale meglio usare le sue foto reali.
- Recensioni, nomi e dati del ristorante "Aurea" sono esempi dimostrativi: vanno sostituiti con quelli veri del cliente prima della pubblicazione.
- Se modifichi la struttura di `index.html` (aggiungi o togli sezioni), i testi già personalizzati dall'area admin possono spostarsi: in quel caso usa «Ripristina tutti i testi e le foto originali» e ricontrolla.
