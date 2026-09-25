# Lista di consegna — un sito nuovo per un ristorante

Da seguire ogni volta che vendi un sito. Tempo totale: circa 1 ora e mezza, quasi tutta con il cliente.

---

## Una volta sola (prima del primo cliente)

- [ ] Sul repository demo (**Ristorante-**): **Settings → General → spunta «Template repository»**. Così ogni cliente può fare una copia del sito con un tocco.
- [ ] Non pubblicare modifiche dal pannello sul sito demo: le copie partirebbero con quelle modifiche. Il demo deve restare «pulito».

---

## 1. Prima dell'appuntamento (fatti mandare dal cliente)

- [ ] Nome del locale, indirizzo, telefono, numero **WhatsApp** che riceverà le prenotazioni, email, Partita IVA
- [ ] Orari di pranzo e cena, giorno di chiusura, ferie già decise
- [ ] Menù con prezzi (va bene anche una foto del menù cartaceo)
- [ ] 10–20 **foto vere**: sala, piatti, esterno, staff. Orizzontali, luminose
- [ ] Link Instagram / Facebook / Tripadvisor
- [ ] 3–5 recensioni **vere** (per esempio da Google), con nome e iniziale del cognome

## 2. Account GitHub del cliente (il sito sarà suo)

- [ ] Vai su **github.com/signup** e crea un account con l'**email del ristorante**. Serve il codice che arriva per email: fattelo leggere dal cliente.
- [ ] Nome utente: corto e legato al locale, per esempio `trattoriadamario`.
- [ ] Segna email e password su un foglio da lasciare al cliente.

## 3. Copia del sito

- [ ] Da loggato con l'account del cliente apri **github.com/l13291221-cmyk/Ristorante-** e premi **Use this template → Create a new repository**.
- [ ] Nome del repository: **`nomeutente.github.io`** (esempio: `trattoriadamario.github.io`). Così il link sarà corto: `https://trattoriadamario.github.io/`
- [ ] Visibilità: **Public** → **Create repository**.

## 4. Mettere online

- [ ] Nel nuovo repository: **Settings → Pages → Source: Deploy from a branch → main → / (root) → Save**.
- [ ] Aspetta 1–2 minuti e ricarica: in alto compare il link del sito. Aprilo e controlla che si veda.

## 5. Chiave per il tasto «Pubblica» (token)

- [ ] Sempre con l'account del cliente apri **github.com/settings/personal-access-tokens/new**
- [ ] **Token name:** `Sito` · **Expiration:** la più lunga disponibile (se scegli una data, segnati in calendario di rinnovarlo)
- [ ] **Repository access → Only select repositories →** il repository del sito
- [ ] **Permissions → Repository permissions →** **Contents: Read and write** e **Pages: Read and write**
- [ ] **Generate token** e copialo subito (inizia con `github_pat_`): si vede una volta sola.

## 6. Primo accesso al pannello (sul telefono del cliente)

- [ ] Apri il sito sul **telefono del ristoratore** → **Amministratore** → PIN **123456**
- [ ] Scheda **Pubblica**: utente e repository sono già compilati → incolla il **token**
- [ ] Scheda **Sicurezza**: fai scegliere al cliente un **PIN nuovo** e scrivilo sul foglio

> Il token resta salvato solo su quel telefono. Se il cliente vuole modificare il sito anche da un altro dispositivo, va incollato anche lì. Se cambia telefono, si crea un token nuovo (punto 5).

## 7. Inserire i contenuti (dal pannello)

- [ ] **Dati:** nome, telefono, WhatsApp, email, indirizzo, indirizzo per la mappa, social, P.IVA, tipo di cucina, fascia di prezzo, titolo e descrizione per Google
- [ ] **Orari:** fasce di pranzo e cena, chiusure straordinarie, regole di prenotazione
- [ ] **Menù:** tutti i piatti con prezzi, spunta vegetariano / consigliato dallo chef
- [ ] **Recensioni:** solo recensioni vere
- [ ] **Immagini:** sostituisci **tutte** le foto demo con quelle del locale
- [ ] **Pagina → Modifica la pagina:** storia, chef, degustazione, eventi, numeri (anni, etichette…), timbro rotondo, prezzo della degustazione
- [ ] **Pagina → Pagine del sito:** spegni le pagine che il locale non usa (esempio: Eventi)
- [ ] Controlla la pagina **Privacy**: i dati del titolare si prendono da «Dati». È un modello: se il cliente ha un consulente privacy, faglielo guardare
- [ ] Premi **Pubblica**: aggiorna anche l'anteprima su WhatsApp e i file per Google

## 8. Prova finale (insieme al cliente)

- [ ] Apri il sito da un **altro telefono**, fai una **prenotazione di prova** e verifica che il messaggio arrivi sul WhatsApp del ristorante
- [ ] Manda il link del sito su WhatsApp: l'anteprima deve mostrare nome e foto del locale
- [ ] Prova **Chiama** e **Dove** dalla barra in basso
- [ ] Apri il sito in inglese (tasto EN)

## 9. Google (è da qui che arrivano i clienti)

- [ ] **Scheda Google Business** del locale (business.google.com): orari, foto, e nel campo **Sito web** il link del sito
- [ ] **Google Search Console** (search.google.com/search-console): aggiungi il sito, verifica e invia la sitemap `sitemap.xml`

## 10. Dominio (facoltativo, lo può fare anche il cliente da solo)

- [ ] Compra il dominio a nome del cliente (Aruba, Register.it…)
- [ ] Nel pannello: **Pubblica → Il tuo dominio**: ci sono i valori da copiare nella gestione DNS, il tasto **Controlla** e poi **Pubblica**

## 11. Spiega al cliente (10 minuti)

- [ ] Come si entra: tasto Amministratore + PIN
- [ ] Come si cambia un prezzo (scheda Menù) e un orario (scheda Orari)
- [ ] Come si cambia una scritta o una foto (Modifica pagina → tocca → Salva)
- [ ] Che finché non preme **Pubblica** le modifiche le vede solo lui
- [ ] Che le prenotazioni arrivano su WhatsApp e vanno **confermate rispondendo**

## 12. Consegna

- [ ] Foglio al cliente con: link del sito, email e password GitHub, PIN
- [ ] Incasso del saldo
- [ ] Chiedi il permesso di mostrare il sito ai prossimi clienti come esempio
