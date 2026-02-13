# Contesto Progetto: "Caffè Dell'Angolo - Il Gioco" v2.0

## Descrizione
Gioco web in stile **Pac-Man** pensato per celebrare eventi e locali, personalizzato come **"Caffè Dell'Angolo - Il Gioco"**. PWA installabile, mobile-first, con controlli swipe.

## Architettura

| Componente | Tecnologia | Funzione |
|---|---|---|
| **Frontend** | HTML5 + Canvas + CSS3 + JS vanilla | UI, rendering gioco, logica game loop |
| **Backend API** | PHP 7.4+ (file-based JSON) | Classifica condivisa, config, upload immagini |
| **Storage** | File JSON (`data/`) + localStorage (fallback) | Persistenza punteggi e configurazione |
| **DB (opzionale)** | MySQL (`cda_game`) | Upload immagini server-side |
| **PWA** | Service Worker + manifest.json | Installabilità, cache offline |

## File principali

| File | Ruolo |
|---|---|
| `index.html` | Entry point, schermate (titolo, gioco, tutorial, pause, game over, classifica, nickname) |
| `js/config.js` | Config gioco (griglia 13x19, timing, punteggi, emoji, mappa, caricamento config da server) |
| `js/game.js` | Game engine: labirinto, movimento, nemici, collisioni, power-up, combo, particelle (742 righe) |
| `js/main.js` | Event handling UI, swipe touch, tutorial, flusso schermate (472 righe) |
| `js/leaderboard.js` | Classifica: POST/GET API server con fallback localStorage |
| `js/audio.js` | Audio Manager: Web Audio API, musica titolo/gioco, effetti sonori procedurali |
| `css/style.css` | 973 righe CSS, responsive, variabili CSS personalizzabili, animazioni |
| `admin.html` | Pannello admin: personalizzazione evento, colori, emoji, upload immagini (1335 righe) |
| `api/config.php` | API GET/POST config (file JSON-based) |
| `api/leaderboard.php` | API classifica (GET/POST/DELETE) con file-locking |
| `api/images.php` | API upload/delete immagini (DB o JSON) |
| `api/db_config.php` | Config DB + costanti (password admin: `admin123`) |
| `sw.js` | Service Worker: cache assets, network-first strategy |
| `manifest.json` | Manifest PWA: nome, icone, orientamento portrait |
| `data/config.json` | Configurazione corrente (evento, colori, emoji, immagini) |
| `data/leaderboard.json` | Classifica punteggi (top 100, JSON array) |
| `data/images.json` | Registro immagini uploadate |
| `db.sql` | Schema MySQL (tabelle: game_images, game_config, event_info, theme_colors, game_characters, leaderboard) |

## Meccaniche di gioco

- **Griglia** 13×19 con **6 labirinti diversi** (`MAZE_TEMPLATES`), uno per livello
- **Collezionabili**: birra (🍺 10pt), vodka (🍾 50pt)
- **Power-up** (📜 invincibilità): **4 per livello, posizionati nei 4 angoli** del labirinto
- **Nemici progressivi**: Lv.1 = 1 nemico, Lv.2 = 2, Lv.3 = 3, ..., Lv.6 = 6 (max)
- Nemici partono dalla "ghost house" (righe 7-9), IA inseguimento con 30% casualità
- **6 livelli** con player/emoji diversi per livello; dal Lv.7+ si riusa il labirinto 6
- **Velocità ridotta**: player `PLAYER_MOVE_DELAY: 8` (era 6), nemici `baseDelay: 18+` (era 14+)
- **Sistema combo** con moltiplicatore
- **Grace period** post-respawn (180→120 frame in base al livello)
- **Power-up duration**: 300 frame (5 secondi a 60fps) + bonus 90 frame per Lv.1-3
- **3 vite**, game over → inserimento nickname → classifica
- **Controlli**: solo swipe (mobile), frecce/WASD (desktop), ESC/P/Spazio per pausa

### Difficoltà per livello

| Livello | Nemici | Delay bonus nemici | Grace period | Labirinto |
|---------|--------|--------------------|-------------|-----------|
| 1 | 1 | +6 | 180 frame | Arena Aperta (pochi muri) |
| 2 | 2 | +6 | 180 frame | Classico (layout originale) |
| 3 | 3 | +3 | 150 frame | Crocevia (4 quadranti) |
| 4 | 4 | +3 | 150 frame | Corridoi (passaggi lunghi) |
| 5 | 5 | +0 | 120 frame | Isola (isola centrale) |
| 6+ | 6 | +0 | 120 frame | Labirinto (passaggi stretti) |

### Layout labirinti

Tutti i labirinti condividono:
- **Ghost house** fissa (righe 7-9, colonne 5-7)
- **Tunnel** laterale su riga 8
- **Power-up (4)** nelle 4 posizioni angolari: (1,1), (11,1), (1,17), (11,17)
- **Player start** a (6,12)
- Simmetria sinistra-destra per equità

## Sistema di personalizzazione (Admin Panel)

L'admin panel (`admin.html`) permette di configurare:

- **Evento**: titolo, data, luogo, logo
- **App**: titolo pagina, description (SEO/OG meta tags)
- **Colori**: gold, cyan, bg, wall (CSS custom properties)
- **Emoji**: nemico, birra, vodka, power-up, giocatori per livello (6 slot)
- **Icone UI**: titolo, data, luogo, classifica, HUD (score, livello, vite, swipe)
- **Immagini**: player ×6, nemico, nemico spaventato, logo, favicon (upload su server)

Config salvata in `data/config.json` e caricata dal frontend via `api/config.php` con fallback localStorage.

## Configurazione attuale (produzione)

- **App**: "Caffè Dell'Angolo - Il Gioco"
- **Descrizione**: "Unisciti al gruppo e gioca in stile Pac-Man!"
- **Nemico emoji**: 👨‍🏫 (professore)
- **Power-up emoji**: 🐖
- **Players emoji**: tutti 🎓
- **Colori**: gold `#ffd700`, cyan `#4ecdc4`, bg `#0f0f1e`, wall `#1a1a3e`
- **Immagini custom uploadate**: logo, favicon, nemico, 6 player
- **Hosting target**: IONOS con PHP

## Flusso utente

1. **Title screen** → logo, titolo evento, data/luogo, bottoni GIOCA e CLASSIFICA
2. **Tutorial** (3 step, solo al primo avvio) → swipe, obiettivi, nemici → pulsante "Salta"
3. **Gameplay** → canvas con HUD (score, livello, vite), pulsante pausa, annunci livello
4. **Game Over** → input nickname → salvataggio punteggio (API server) → classifica top 10
5. **Classifica** → consultabile anche da menu principale

## API Endpoints

| Metodo | Endpoint | Funzione |
|---|---|---|
| `GET` | `api/leaderboard.php?limit=N` | Legge classifica (top N, max 100) |
| `POST` | `api/leaderboard.php` | Invia punteggio `{nickname, score, level}` |
| `DELETE` | `api/leaderboard.php` | Svuota classifica (richiede `X-Admin-Password`) |
| `GET` | `api/config.php` | Legge configurazione completa |
| `POST` | `api/config.php` | Salva configurazione (richiede `X-Admin-Password`) |
| `POST` | `api/images.php` | Upload immagine (richiede `X-Admin-Password`) |
| `GET` | `api/images.php?key=X` | Legge immagine per chiave |
| `DELETE` | `api/images.php?key=X` | Elimina immagine (richiede `X-Admin-Password`) |

## Note tecniche

- Nessun framework/libreria esterna, tutto **vanilla JS**
- Audio generato **proceduralmente** con Web Audio API (nessun file audio)
- Immagini custom caricate come `Image()` e renderizzate su canvas al posto degli emoji
- **CORS** abilitato su tutte le API PHP
- **File-locking** (`flock`) per scrittura concorrente classifica
- Service Worker con strategia **network-first**, fallback cache
- Config applicata in due fasi: inline `<script>` per FOUC prevention + `initGameConfig()` asincrono
- Toast non bloccante al posto di `alert()`
- `prefers-reduced-motion` gestito nel CSS
- Warning rotazione landscape solo durante gameplay (`body.in-game`)
