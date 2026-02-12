// ============================================
// GAME CONFIGURATION
// ============================================

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

    // Enemies
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

    // Emojis
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
