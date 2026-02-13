// ============================================
// GAME CONFIGURATION
// ============================================

// Configurazione caricata da server/localStorage
let ADMIN_CONFIG = null;

// Carica configurazione da server API (con fallback localStorage)
async function loadAdminConfig() {
    // Prova prima dal server
    try {
        const res = await fetch('api/config.php');
        const data = await res.json();
        if (data.success) {
            console.log('Config loaded from:', data.source);
            return data.config;
        }
    } catch (e) {
        console.log('Server API not available, trying localStorage');
    }
    
    // Fallback localStorage
    const saved = localStorage.getItem('cda_admin_config');
    if (!saved) return null;
    try {
        return JSON.parse(saved);
    } catch (e) {
        return null;
    }
}

// Configurazione base (aggiornata dopo il caricamento asincrono)
const CONFIG = {
    // Grid settings
    COLS: 13,
    ROWS: 19,

    // Timing
    PLAYER_MOVE_DELAY: 8,  // frames between player moves (era 6, rallentato)
    GRACE_PERIOD: 120,     // frames of invulnerability after respawn
    POWERUP_DURATION: 300, // frames of power-up (5 seconds at 60fps)
    COMBO_TIMEOUT: 60,     // frames before combo resets

    // Scoring
    SCORE_BEER: 10,
    SCORE_VODKA: 50,
    SCORE_GHOST: 200,
    COMBO_MULTIPLIER: 1,   // Multiplied by combo level

    // Enemies - valori di default, aggiornati da updateConfigFromAdmin()
    MAX_ENEMIES: 6,
    ENEMY_EMOJI: '�',
    ENEMY_NAME: 'Nemico',

    // Maze tiles
    TILE_EMPTY: 0,
    TILE_WALL: 1,
    TILE_BEER: 2,
    TILE_VODKA: 3,
    TILE_POWERUP: 4,

    // Emojis - valori di default, aggiornati da updateConfigFromAdmin()
    EMOJI_PLAYERS: ['🎓', '🎓', '🎓', '🎓', '🎓', '🎓'],  // Per livelli 1-6+
    EMOJI_SCARED_ENEMY: '😰',
    EMOJI_BEER: '🍺',
    EMOJI_VODKA: '🍾',
    EMOJI_POWERUP: '📜',
    // Emoji per livello (se impostati, sovrascrivono i default sopra)
    EMOJI_BEERS: ['🍺', '🍺', '🍺', '🍺', '🍺', '🍺'],
    EMOJI_VODKAS: ['🍾', '🍾', '🍾', '🍾', '🍾', '🍾'],
    EMOJI_POWERUPS: ['📜', '📜', '📜', '📜', '📜', '📜'],

    // API
    LEADERBOARD_API: 'api/leaderboard.php',

    // Local storage keys
    STORAGE_HIGHSCORE: 'cda_highscore',
    STORAGE_SETTINGS: 'cda_settings',
    STORAGE_TUTORIAL: 'cda_tutorial_done',
    STORAGE_CONTROL_MODE: 'cda_control_mode',
    STORAGE_LEADERBOARD: 'cda_leaderboard',  // Fallback locale

    // Audio settings
    AUDIO_ENABLED: true,
    MUSIC_ENABLED: true,
    VIBRATION_ENABLED: true
};

// Maze templates - un labirinto diverso per ogni livello (6 totali)
// Power-up (4) posizionati nei 4 angoli di ogni labirinto
const MAZE_TEMPLATES = [
    // ===== LIVELLO 1 - "Arena Aperta" (facile, pochi muri) =====
    [
        [1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,4,2,2,2,2,2,2,2,2,2,4,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,2,1,2,2,3,2,2,1,2,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,2,2,1,2,2,2,1,2,2,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,1,1,2,1,0,0,0,1,2,1,1,1],
        [0,0,0,2,1,0,0,0,1,2,0,0,0],
        [1,1,1,2,1,0,0,0,1,2,1,1,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,2,2,1,2,2,2,1,2,2,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,2,1,2,2,3,2,2,1,2,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,4,2,2,2,2,2,2,2,2,2,4,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    // ===== LIVELLO 2 - "Classico" (layout originale rielaborato) =====
    [
        [1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,4,2,2,2,2,1,2,2,2,2,4,1],
        [1,2,1,1,2,2,2,2,2,1,1,2,1],
        [1,3,1,1,2,1,1,1,2,1,1,3,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,2,1,1,2,1,1,2,1,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,1,1,2,1,0,0,0,1,2,1,1,1],
        [0,0,0,2,1,0,0,0,1,2,0,0,0],
        [1,1,1,2,1,0,0,0,1,2,1,1,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,2,1,1,1,2,1,1,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,3,1,2,1,1,2,1,1,2,1,3,1],
        [1,2,1,2,2,2,2,2,2,2,1,2,1],
        [1,2,2,2,1,1,2,1,1,2,2,2,1],
        [1,2,1,2,2,2,2,2,2,2,1,2,1],
        [1,4,2,2,2,1,2,1,2,2,2,4,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    // ===== LIVELLO 3 - "Crocevia" (croce centrale divide 4 quadranti) =====
    [
        [1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,4,2,2,2,2,2,2,2,2,2,4,1],
        [1,2,1,2,1,2,2,2,1,2,1,2,1],
        [1,2,2,2,2,2,1,2,2,2,2,2,1],
        [1,2,1,2,2,2,2,2,2,2,1,2,1],
        [1,2,2,2,1,1,3,1,1,2,2,2,1],
        [1,2,1,2,2,2,2,2,2,2,1,2,1],
        [1,1,1,2,1,0,0,0,1,2,1,1,1],
        [0,0,0,2,1,0,0,0,1,2,0,0,0],
        [1,1,1,2,1,0,0,0,1,2,1,1,1],
        [1,2,1,2,2,2,2,2,2,2,1,2,1],
        [1,2,2,2,1,1,3,1,1,2,2,2,1],
        [1,2,1,2,2,2,2,2,2,2,1,2,1],
        [1,2,2,2,2,2,1,2,2,2,2,2,1],
        [1,2,1,2,1,2,2,2,1,2,1,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,2,2,2,2,2,1,1,2,1],
        [1,4,2,2,2,2,2,2,2,2,2,4,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    // ===== LIVELLO 4 - "Corridoi" (lunghi corridoi, pochi incroci) =====
    [
        [1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,4,2,2,2,2,2,2,2,2,2,4,1],
        [1,1,1,2,1,1,2,1,1,2,1,1,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,1,2,1,2,1,1,1,2,1],
        [1,2,2,2,2,2,3,2,2,2,2,2,1],
        [1,2,1,2,1,2,2,2,1,2,1,2,1],
        [1,1,1,2,1,0,0,0,1,2,1,1,1],
        [0,0,0,2,1,0,0,0,1,2,0,0,0],
        [1,1,1,2,1,0,0,0,1,2,1,1,1],
        [1,2,1,2,1,2,2,2,1,2,1,2,1],
        [1,2,2,2,2,2,3,2,2,2,2,2,1],
        [1,2,1,1,1,2,2,2,1,1,1,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,1,1,2,1,1,2,1,1,2,1,1,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,1,2,1,2,1,1,1,2,1],
        [1,4,2,2,2,2,2,2,2,2,2,4,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    // ===== LIVELLO 5 - "Isola" (isola centrale con percorsi intorno) =====
    [
        [1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,4,2,2,2,2,2,2,2,2,2,4,1],
        [1,2,1,2,2,2,2,2,2,2,1,2,1],
        [1,2,2,2,1,1,2,1,1,2,2,2,1],
        [1,2,2,1,1,2,2,2,1,1,2,2,1],
        [1,2,2,2,2,2,3,2,2,2,2,2,1],
        [1,2,2,1,2,2,2,2,2,1,2,2,1],
        [1,1,1,2,1,0,0,0,1,2,1,1,1],
        [0,0,0,2,1,0,0,0,1,2,0,0,0],
        [1,1,1,2,1,0,0,0,1,2,1,1,1],
        [1,2,2,1,2,2,2,2,2,1,2,2,1],
        [1,2,2,2,2,2,3,2,2,2,2,2,1],
        [1,2,2,1,1,2,2,2,1,1,2,2,1],
        [1,2,2,2,1,1,2,1,1,2,2,2,1],
        [1,2,1,2,2,2,2,2,2,2,1,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,2,2,1,2,1,2,2,1,2,1],
        [1,4,2,2,2,2,2,2,2,2,2,4,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    // ===== LIVELLO 6 - "Labirinto" (complesso, passaggi stretti) =====
    [
        [1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,4,2,2,1,2,2,2,1,2,2,4,1],
        [1,2,1,2,2,2,1,2,2,2,1,2,1],
        [1,2,2,2,1,2,3,2,1,2,2,2,1],
        [1,1,2,1,1,2,2,2,1,1,2,1,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,2,1,2,2,2,1,2,1,2,1],
        [1,1,1,2,1,0,0,0,1,2,1,1,1],
        [0,0,0,2,1,0,0,0,1,2,0,0,0],
        [1,1,1,2,1,0,0,0,1,2,1,1,1],
        [1,2,1,2,1,2,2,2,1,2,1,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,2,2,2,2,2,1,1,2,1],
        [1,2,2,2,1,2,3,2,1,2,2,2,1],
        [1,2,1,2,2,2,1,2,2,2,1,2,1],
        [1,2,2,1,2,2,2,2,2,1,2,2,1],
        [1,2,1,2,1,2,1,2,1,2,1,2,1],
        [1,4,2,2,2,2,2,2,2,2,2,4,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1]
    ]
];

// Alias per retrocompatibilità
const MAZE_TEMPLATE = MAZE_TEMPLATES[0];

// Enemy start positions in ghost house
const ENEMY_START_POSITIONS = [
    { x: 6, y: 8 },   // Center
    { x: 5, y: 8 },   // Left
    { x: 7, y: 8 },   // Right
    { x: 6, y: 7 },   // Top center
    { x: 5, y: 9 },   // Bottom left
    { x: 7, y: 9 }    // Bottom right
];

// Player start position
const PLAYER_START = { x: 6, y: 12 };

// ============================================
// IMAGE LOADER - Carica immagini personalizzate
// ============================================

const GAME_IMAGES = {
    enemy: null,
    beer: null,
    vodka: null,
    powerup: null,
    scared: null,
    players: [null, null, null, null, null, null],
    // Immagini per livello
    beers: [null, null, null, null, null, null],
    vodkas: [null, null, null, null, null, null],
    powerups: [null, null, null, null, null, null]
};

// Precarica immagine da URL (server) o base64
function preloadImage(src) {
    return new Promise((resolve) => {
        if (!src) {
            resolve(null);
            return;
        }
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });
}

// Aggiorna CONFIG con i dati admin
function updateConfigFromAdmin(config) {
    if (!config) return;
    
    // Aggiorna emoji (stringa vuota = campo vuoto intenzionale)
    if (config.emojis) {
        if (config.emojis.enemy !== undefined) CONFIG.ENEMY_EMOJI = config.emojis.enemy;
        if (config.emojis.scared !== undefined) CONFIG.EMOJI_SCARED_ENEMY = config.emojis.scared;
        if (config.emojis.beer !== undefined) CONFIG.EMOJI_BEER = config.emojis.beer;
        if (config.emojis.vodka !== undefined) CONFIG.EMOJI_VODKA = config.emojis.vodka;
        if (config.emojis.powerup !== undefined) CONFIG.EMOJI_POWERUP = config.emojis.powerup;
        
        // Aggiorna emoji players per livello
        if (config.emojis.players && Array.isArray(config.emojis.players)) {
            config.emojis.players.forEach((emoji, i) => {
                if (emoji !== undefined && i < CONFIG.EMOJI_PLAYERS.length) {
                    CONFIG.EMOJI_PLAYERS[i] = emoji;
                }
            });
        }
        // Aggiorna emoji per livello (array)
        if (config.emojis.beers && Array.isArray(config.emojis.beers)) {
            config.emojis.beers.forEach((emoji, i) => {
                if (emoji !== undefined && i < CONFIG.EMOJI_BEERS.length) {
                    CONFIG.EMOJI_BEERS[i] = emoji;
                }
            });
        }
        if (config.emojis.vodkas && Array.isArray(config.emojis.vodkas)) {
            config.emojis.vodkas.forEach((emoji, i) => {
                if (emoji !== undefined && i < CONFIG.EMOJI_VODKAS.length) {
                    CONFIG.EMOJI_VODKAS[i] = emoji;
                }
            });
        }
        if (config.emojis.powerups && Array.isArray(config.emojis.powerups)) {
            config.emojis.powerups.forEach((emoji, i) => {
                if (emoji !== undefined && i < CONFIG.EMOJI_POWERUPS.length) {
                    CONFIG.EMOJI_POWERUPS[i] = emoji;
                }
            });
        }
    }
}
async function loadGameImages() {
    if (!ADMIN_CONFIG || !ADMIN_CONFIG.images) return;
    
    const images = ADMIN_CONFIG.images;
    
    // Carica immagini singole (ora sono URL dal server)
    GAME_IMAGES.enemy = await preloadImage(images.enemy);
    GAME_IMAGES.beer = await preloadImage(images.beer);
    GAME_IMAGES.vodka = await preloadImage(images.vodka);
    GAME_IMAGES.powerup = await preloadImage(images.powerup);
    GAME_IMAGES.scared = await preloadImage(images.scared);
    
    // Carica immagini players per livello
    if (images.players && Array.isArray(images.players)) {
        for (let i = 0; i < images.players.length; i++) {
            GAME_IMAGES.players[i] = await preloadImage(images.players[i]);
        }
    }
    
    // Carica immagini oggetti per livello
    if (images.beers && Array.isArray(images.beers)) {
        for (let i = 0; i < images.beers.length; i++) {
            GAME_IMAGES.beers[i] = await preloadImage(images.beers[i]);
        }
    }
    if (images.vodkas && Array.isArray(images.vodkas)) {
        for (let i = 0; i < images.vodkas.length; i++) {
            GAME_IMAGES.vodkas[i] = await preloadImage(images.vodkas[i]);
        }
    }
    if (images.powerups && Array.isArray(images.powerups)) {
        for (let i = 0; i < images.powerups.length; i++) {
            GAME_IMAGES.powerups[i] = await preloadImage(images.powerups[i]);
        }
    }
    
    console.log('Game images loaded:', GAME_IMAGES);
}

// Inizializza configurazione e immagini
async function initGameConfig() {
    ADMIN_CONFIG = await loadAdminConfig();
    if (ADMIN_CONFIG) {
        updateConfigFromAdmin(ADMIN_CONFIG);
        await loadGameImages();
        
        // Aggiorna meta tags per condivisione link (dal server, sovrascrive inline)
        if (ADMIN_CONFIG.app) {
            if (ADMIN_CONFIG.app.title) {
                document.title = ADMIN_CONFIG.app.title;
                const ogTitle = document.getElementById('og-title');
                if (ogTitle) ogTitle.content = ADMIN_CONFIG.app.title;
            }
            if (ADMIN_CONFIG.app.description) {
                const metaDesc = document.getElementById('meta-description');
                const ogDesc = document.getElementById('og-description');
                if (metaDesc) metaDesc.content = ADMIN_CONFIG.app.description;
                if (ogDesc) ogDesc.content = ADMIN_CONFIG.app.description;
            }
        }
        // Aggiorna favicon (priorità: favicon dedicata > logo)
        const faviconUrl = ADMIN_CONFIG.images?.favicon || ADMIN_CONFIG.event?.logo;
        if (faviconUrl) {
            const faviconEl = document.getElementById('favicon-link');
            if (faviconEl) { faviconEl.href = faviconUrl; faviconEl.type = 'image/png'; }
            const touchIcon = document.querySelector('link[rel="apple-touch-icon"]');
            if (touchIcon) touchIcon.href = faviconUrl;
        }
        
        // Aggiorna testi evento visibili nel DOM (necessario quando localStorage è vuoto, es. incognito)
        if (ADMIN_CONFIG.event) {
            const textTitle = document.getElementById('text-title');
            const textDate = document.getElementById('text-date');
            const textLoc = document.getElementById('text-location');
            if (ADMIN_CONFIG.event.title !== undefined && textTitle) textTitle.textContent = ADMIN_CONFIG.event.title;
            if (ADMIN_CONFIG.event.date !== undefined && textDate) textDate.textContent = ADMIN_CONFIG.event.date;
            if (ADMIN_CONFIG.event.location !== undefined && textLoc) textLoc.textContent = ADMIN_CONFIG.event.location;
        }
        
        // Aggiorna logo evento
        if (ADMIN_CONFIG.event?.logo || ADMIN_CONFIG.images?.logo) {
            const logoUrl = ADMIN_CONFIG.images?.logo || ADMIN_CONFIG.event?.logo;
            const logoContainer = document.getElementById('event-logo-container');
            const logoImg = document.getElementById('event-logo');
            if (logoContainer && logoImg) {
                logoImg.src = logoUrl;
                logoContainer.style.display = 'block';
            }
        }
        
        // Applica colori tema
        if (ADMIN_CONFIG.colors) {
            const root = document.documentElement;
            if (ADMIN_CONFIG.colors.gold) root.style.setProperty('--color-gold', ADMIN_CONFIG.colors.gold);
            if (ADMIN_CONFIG.colors.cyan) root.style.setProperty('--color-cyan', ADMIN_CONFIG.colors.cyan);
            if (ADMIN_CONFIG.colors.bg) root.style.setProperty('--color-bg', ADMIN_CONFIG.colors.bg);
            if (ADMIN_CONFIG.colors.wall) root.style.setProperty('--color-wall', ADMIN_CONFIG.colors.wall);
        }
        
        // Applica icone UI personalizzate
        if (ADMIN_CONFIG.uiIcons) {
            const icons = ADMIN_CONFIG.uiIcons;
            const iconMap = {
                'icon-title-left': icons.title, 'icon-title-right': icons.title,
                'icon-date': icons.date, 'icon-location': icons.location,
                'icon-leaderboard': icons.leaderboard,
                'icon-hud-score': icons.score, 'icon-hud-level': icons.level,
                'icon-hud-lives': icons.lives, 'icon-swipe': icons.swipe
            };
            for (const [id, value] of Object.entries(iconMap)) {
                if (value) {
                    const el = document.getElementById(id);
                    if (el) el.textContent = value;
                }
            }
        }
    }
    console.log('Game config initialized:', CONFIG);
    
    // Notifica che la config è pronta
    window.dispatchEvent(new Event('gameConfigReady'));
}

// Carica configurazione all'avvio
initGameConfig();

