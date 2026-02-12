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
    const saved = localStorage.getItem('100giorni_admin_config');
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
    PLAYER_MOVE_DELAY: 6,  // frames between player moves
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
    ENEMY_TYPES: [
        { emoji: '👨‍🏫', name: 'Prof. Mate', baseDelay: 18 },
        { emoji: '👩‍🏫', name: 'Prof. Italiano', baseDelay: 22 },
        { emoji: '🧑‍🏫', name: 'Prof. Inglese', baseDelay: 16 },
        { emoji: '👴', name: 'Preside', baseDelay: 25 },
        { emoji: '👨‍🔬', name: 'Prof. Scienze', baseDelay: 20 },
        { emoji: '👩‍💼', name: 'Vicepreside', baseDelay: 14 }
    ],

    // Maze tiles
    TILE_EMPTY: 0,
    TILE_WALL: 1,
    TILE_BEER: 2,
    TILE_VODKA: 3,
    TILE_POWERUP: 4,

    // Emojis - valori di default, aggiornati da updateConfigFromAdmin()
    EMOJI_PLAYER: '🎓',
    EMOJI_SCARED_ENEMY: '😰',
    EMOJI_BEER: '🍺',
    EMOJI_VODKA: '🍾',
    EMOJI_POWERUP: '📜',

    // API
    LEADERBOARD_API: 'api/leaderboard.php',

    // Local storage keys
    STORAGE_HIGHSCORE: '100giorni_highscore',
    STORAGE_SETTINGS: '100giorni_settings',
    STORAGE_TUTORIAL: '100giorni_tutorial_done',
    STORAGE_CONTROL_MODE: '100giorni_control_mode',
    STORAGE_LEADERBOARD: '100giorni_leaderboard',  // Fallback locale

    // Audio settings
    AUDIO_ENABLED: true,
    MUSIC_ENABLED: true,
    VIBRATION_ENABLED: true
};

// Base maze template
const MAZE_TEMPLATE = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,1,2,2,2,2,2,1],
    [1,2,1,1,2,2,2,2,2,1,1,2,1],
    [1,3,1,1,2,1,1,1,2,1,1,3,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,2,1,1,2,1,1,2,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,2,1,0,0,0,1,2,1,1,1],
    [0,0,0,2,1,0,0,0,1,2,0,0,0],
    [1,1,1,2,1,0,0,0,1,2,1,1,1],
    [1,2,2,2,2,2,4,2,2,2,2,2,1],
    [1,2,1,1,2,1,1,1,2,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,3,1,2,1,1,2,1,1,2,1,3,1],
    [1,2,1,2,2,2,2,2,2,2,1,2,1],
    [1,2,2,2,1,1,2,1,1,2,2,2,1],
    [1,2,1,2,2,2,2,2,2,2,1,2,1],
    [1,2,2,2,2,1,2,1,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1]
];

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
    player: null,
    beer: null,
    vodka: null,
    powerup: null,
    scared: null,
    enemies: [null, null, null, null, null, null]
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
    
    // Aggiorna emoji
    if (config.emojis) {
        if (config.emojis.player) CONFIG.EMOJI_PLAYER = config.emojis.player;
        if (config.emojis.scared) CONFIG.EMOJI_SCARED_ENEMY = config.emojis.scared;
        if (config.emojis.beer) CONFIG.EMOJI_BEER = config.emojis.beer;
        if (config.emojis.vodka) CONFIG.EMOJI_VODKA = config.emojis.vodka;
        if (config.emojis.powerup) CONFIG.EMOJI_POWERUP = config.emojis.powerup;
        
        // Aggiorna emoji nemici
        if (config.emojis.enemies && Array.isArray(config.emojis.enemies)) {
            config.emojis.enemies.forEach((emoji, i) => {
                if (emoji && CONFIG.ENEMY_TYPES[i]) {
                    CONFIG.ENEMY_TYPES[i].emoji = emoji;
                }
            });
        }
    }
}

// Carica tutte le immagini dalla configurazione admin
async function loadGameImages() {
    if (!ADMIN_CONFIG || !ADMIN_CONFIG.images) return;
    
    const images = ADMIN_CONFIG.images;
    
    // Carica immagini singole (ora sono URL dal server)
    GAME_IMAGES.player = await preloadImage(images.player);
    GAME_IMAGES.beer = await preloadImage(images.beer);
    GAME_IMAGES.vodka = await preloadImage(images.vodka);
    GAME_IMAGES.powerup = await preloadImage(images.powerup);
    GAME_IMAGES.scared = await preloadImage(images.scared);
    
    // Carica immagini nemici
    if (images.enemies && Array.isArray(images.enemies)) {
        for (let i = 0; i < images.enemies.length; i++) {
            GAME_IMAGES.enemies[i] = await preloadImage(images.enemies[i]);
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
    }
    console.log('Game config initialized:', CONFIG);
}

// Carica configurazione all'avvio
initGameConfig();

