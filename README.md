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
| **Mobile first** | Barra fissa Chiama / Prenota / Mappa, menù a schermo intero |
| **SEO** | Dati strutturati `Restaurant` (schema.org), Open Graph, meta description |
| **Accessibilità** | Navigazione da tastiera, skip link, rispetto di "riduci movimento" |

## Personalizzare per un nuovo cliente (15 minuti)

1. **`js/config.js`** — nome, telefono, WhatsApp, email, indirizzo, social, **orari**, giorni di ferie, regole di prenotazione. Tutto il sito (stato aperto/chiuso, calendario, orari, link) si aggiorna da solo.
2. **`index.html`** — testi, piatti e prezzi. Ogni testo ha la traduzione inglese nell'attributo `data-en="..."` accanto.
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
