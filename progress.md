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
