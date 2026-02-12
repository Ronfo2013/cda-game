# 🎓 i 100 Giorni - The Game v2.0

Gioco in stile Pac-Man per celebrare i 100 giorni alla maturità!

## ✨ NOVITÀ VERSIONE 2.0

### 🎯 Tutorial Interattivo
- Guida passo-passo al primo avvio
- Tutorial compatto in 3 schermate
- Pulsante "Salta" per entrare subito in gioco
- Mostra obiettivi e power-up

### 📱 Controlli Mobile Migliorati
- **Swipe continuo** - scorri per muoverti
- **D-Pad opzionale** - selezionabile dal menu iniziale
- Preferenza controlli salvata nel browser
- Perfetto per smartphone

### 💾 Nessun Database Richiesto
- **Classifica condivisa tra partecipanti** (API PHP + file JSON)
- **Nessun database MySQL necessario**
- Richiede hosting con PHP (es. IONOS)
- Fallback locale se API non raggiungibile

## 📋 Requisiti

- Web server con supporto PHP
- Hosting con PHP (consigliato: IONOS, Aruba, ecc.)
- Nessun database richiesto
- PHP 7.4+ consigliato
- **Spazio web:** circa 80 KB

## 🚀 Installazione Ultra-Semplice

### 1. Scarica i File
Estrai il file ZIP o usa la cartella `100giorni-game/`

### 2. Carica su Hosting
Via FTP o File Manager, carica **TUTTI** i file:

```
/tuosito.com/
├── index.html
├── favicon.svg
├── .htaccess
├── api/
│   └── leaderboard.php
├── css/
│   └── style.css
├── data/
│   ├── .htaccess
│   └── leaderboard.json
└── js/
    ├── config.js
    ├── audio.js
    ├── leaderboard.js
    ├── game.js
    └── main.js
```

### Guida Rapida IONOS (consigliata)

1. Apri il pannello IONOS e vai su **Hosting > Gestisci > File Manager**  
2. Entra nella cartella pubblica del dominio (di solito `htdocs` o `public_html`)  
3. Carica dentro quella cartella i file:
   - `index.html`
   - `favicon.svg`
   - `.htaccess`
   - cartella `api/`
   - cartella `css/`
   - cartella `data/`
   - cartella `js/`
4. Verifica che la struttura online sia identica a quella mostrata sopra  
5. Apri `https://tuodominio.it/` (o `https://tuodominio.it/index.html`)

### Checklist Pre-Pubblicazione

- `index.html` è nella root pubblica del dominio
- `css/style.css` esiste online
- `js/config.js`, `js/audio.js`, `js/leaderboard.js`, `js/game.js`, `js/main.js` esistono online
- `api/leaderboard.php` esiste online
- `data/leaderboard.json` esiste online
- `favicon.svg` esiste online
- Non caricare file di lavoro locali (es. `progress.md`, `.code-workspace`)

### Permessi Cartella `data` (IONOS)

- La cartella `data/` deve essere scrivibile da PHP
- Valori tipici:
  - cartella `data`: `755` o `775`
  - file `data/leaderboard.json`: `664` o `666`
- Se la classifica non si aggiorna, controlla prima questi permessi

### 3. Apri nel Browser
`https://tuosito.com/index.html`

### 4. Fine! 🎉
Nessuna configurazione necessaria!

## 🎮 Come Giocare

### Tutorial Automatico
Al primo avvio vedrai un tutorial interattivo in 3 passaggi che spiega tutto!

### Controlli Mobile
- **Swipe su** ⬆️ - vai in alto
- **Swipe giù** ⬇️ - vai in basso
- **Swipe sinistra** ⬅️ - vai a sinistra
- **Swipe destra** ➡️ - vai a destra
- **Scorri continuamente** per cambiare direzione al volo
- **D-Pad opzionale** - attivabile nel menu iniziale

### Controlli Desktop
- **Frecce direzionali** ↑ ↓ ← →
- **WASD**
- **ESC / P / Spazio** per pausa

### Obiettivi

| Simbolo | Cosa | Punti |
|---------|------|-------|
| 🍺 | Birra | 10 pt |
| 🍾 | Vodka | 50 pt |
| 📜 | Giustificativo | Invincibilità! |
| 👨‍🏫 | Professore | Evita! (-1 vita) |
| 😰 | Prof. Spaventato | 200 pt (mangialo!) |

### Come Vincere

1. ✅ **Raccogli tutte le bevande** del livello
2. ✅ **Completa più livelli** possibile
3. ✅ **Fai combo** per moltiplicare i punti
4. ✅ **Usa il giustificativo** al momento giusto
5. ✅ **Supera il tuo record!** 🏆

## 📊 Sistema Classifica

La classifica è **condivisa** tramite `api/leaderboard.php`:
- Tutti i partecipanti vedono gli stessi punteggi
- Top 100 globale
- Salvataggio su `data/leaderboard.json`
- Fallback in localStorage solo se il server API non è raggiungibile

### Reset Classifica Globale (server)

Svuota il file `data/leaderboard.json` lasciando:
```json
[]
```

## ⚙️ Personalizzazione Facile

### Cambiare Data/Luogo

File: `index.html`

Cerca e modifica:
```html
<div class="event-date">📅 Sabato 14 Marzo 2026</div>
<div class="event-location">📍 OPIUM - PORDENONE</div>
```

### Modificare Difficoltà

File: `js/config.js`

```javascript
// Più facile
MAX_ENEMIES: 4,           // Meno professori (default: 6)
PLAYER_MOVE_DELAY: 4,     // Giocatore più veloce (default: 6)

// Più difficile
MAX_ENEMIES: 6,
PLAYER_MOVE_DELAY: 8,     // Giocatore più lento
```

### Cambiare Punteggi

File: `js/config.js`

```javascript
SCORE_BEER: 10,      // Birra
SCORE_VODKA: 50,     // Vodka
SCORE_GHOST: 200,    // Professore
```

### Modificare Colori

File: `css/style.css` (inizio file)

```css
:root {
    --color-gold: #ffd700;    /* Oro */
    --color-cyan: #4ecdc4;    /* Ciano */
    --color-red: #ff6b6b;     /* Rosso */
}
```

## 🛠️ Funzioni Utili

### Rivedere Tutorial
Console browser (F12):
```javascript
localStorage.removeItem('100giorni_tutorial_done');
location.reload();
```

### Reset Classifica
Console browser:
```javascript
localStorage.removeItem('100giorni_leaderboard');
location.reload();
```

### Disabilitare Audio
Console browser:
```javascript
AudioManager.toggleSound();
```

## 🐛 Risoluzione Problemi

### Gioco non si carica
1. Controlla console browser (F12)
2. Verifica che tutti i file siano stati caricati
3. Controlla che JavaScript sia abilitato

### Swipe non funziona
1. Gioca in modalità portrait (verticale)
2. Scorri direttamente sull'area di gioco
3. Ricarica la pagina
4. Prova con browser diverso (Chrome, Safari)

### Classifica non salva
1. Controlla che `api/leaderboard.php` sia raggiungibile
2. Verifica permessi cartella `data/` e file `data/leaderboard.json`
3. Controlla errori PHP nel pannello hosting IONOS

### Tutorial non appare
```javascript
localStorage.removeItem('100giorni_tutorial_done');
location.reload();
```

## 📱 Hosting Consigliati

### Richiesto
- Hosting con supporto **PHP** e file scrivibili su disco

### Esempi
- **IONOS** - consigliato per questo progetto
- **Aruba** - hosting Linux con PHP
- Qualsiasi hosting PHP equivalente

## 📦 Caratteristiche

✅ Tutorial interattivo  
✅ Swipe + D-Pad opzionale  
✅ Nessun database  
✅ Nessuna configurazione  
✅ Sistema audio  
✅ Sistema combo  
✅ Pausa con menu  
✅ Effetti particellari  
✅ Vibrazione tattile  
✅ Classifica condivisa globale  
✅ Fallback locale se API non raggiungibile  
✅ Responsive design  
✅ Solo 80 KB  

## 🆚 v1.0 vs v2.0

| | v1.0 | v2.0 |
|---|---|---|
| Tutorial | ❌ | ✅ |
| Controlli | D-Pad + Swipe | Swipe + D-Pad opzionale |
| Backend classifica | PHP + MySQL | PHP + JSON condiviso |
| Config | Complessa | Zero |
| Hosting | Solo PHP | Hosting PHP + file write |
| Modalità fallback | ❌ | LocalStorage (se API giù) |

## 🎉 Quick Start

```bash
# 1. Scarica
unzip 100giorni-game.zip

# 2. Carica su hosting
# (via FTP o drag & drop)

# 3. Apri index.html

# 4. Gioca! 🎮
```

## 📄 Licenza

Uso personale ed educativo.

---

**Buon divertimento! 🎓🍺**

*v2.0 - Tutorial + Shared Leaderboard + Zero DB*
