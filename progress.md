Original prompt: analizza app e dimmi eventuali modifiche per rendere ux e ui migliori

- Implementate tutte le modifiche UX/UI richieste nella review e avviata seconda iterazione su richiesta utente.
- Migliorato onboarding: tutorial ridotto a 3 step con pulsante "Salta" e progress indicator.
- Rimossa duplicazione informativa in-game e ridotta sovrapposizione HUD/canvas.
- Aggiunto toggle controlli Swipe/D-Pad nel menu, con persistenza in localStorage.
- Implementato D-Pad touch con area dedicata e attivazione solo in partita.
- Sostituito `alert` con toast non bloccante.
- Migliorata accessibilita: focus-visible su bottoni/input, migliore contrasto istruzioni.
- Aggiunta gestione `prefers-reduced-motion`.
- Corretto bug game-over su `dpad-container` non esistente.
- Landscape meno invasivo: warning di rotazione solo durante gameplay (`body.in-game`).
- Aggiunta favicon locale (`favicon.svg`) per eliminare 404.
- Difficulty tuning: livelli iniziali semplificati (meno nemici, IA piu lenta, grace period maggiore, power-up piu lungo).

TODO / Next agent notes:
- Fare playtest manuale prolungato su dispositivi reali per calibrare meglio ritmo livelli 4-6.
- Valutare layout D-Pad su schermi molto piccoli (altezza < 700px).

- Richiesta utente: classifica condivisa tra tutti i partecipanti.
- Aggiunto backend condiviso `api/leaderboard.php` con storage su `data/leaderboard.json`.
- Implementato locking file (`flock`) e sorting server-side top 100.
- Frontend leaderboard aggiornato per usare API server con fallback locale se API down.
- Aggiornati `README.md` e `INSTALL.txt` con file da caricare su IONOS + permessi cartella `data`.
- Eseguiti check sintassi JS/PHP e smoke test GET/POST API con `php-cgi`.

## Branch personalizzazione

- Rimosse frecce tastiera, controlli solo swipe
- Aggiunta overlay evento in background gioco (opacità 15%)
- Creato pannello admin (`admin.html`) per personalizzare evento, colori, personaggi

### Sistema immagini server-side (DB + upload)

Implementato sistema per salvare immagini su server invece che localStorage:

- **db.sql**: Schema MySQL con tabelle `game_images`, `game_config`, `event_info`, `theme_colors`, `game_characters`, `leaderboard`
- **api/config.php**: API GET/POST per configurazione completa (evento, colori, emoji)
- **api/images.php**: API POST/GET/DELETE per upload immagini (validazione tipo, max 100KB)
- **api/db_config.php**: Configurazione database e costanti (password admin: `admin123`)
- **upload/.htaccess**: Sicurezza cartella upload (solo immagini, no PHP)
- **admin.html**: Aggiornato per usare API server con autenticazione X-Admin-Password
- **js/config.js**: Carica config da `api/config.php` con fallback localStorage
- **api/leaderboard.php**: Aggiunto metodo DELETE per svuotare classifica (richiede password admin)

### Setup database:
1. Crea database MySQL `centogiorni_game`
2. Esegui `db.sql` per creare tabelle
3. Modifica credenziali in `api/db_config.php`
4. La password admin di default è `admin123`
