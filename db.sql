-- ============================================
-- i 100 GIORNI - DATABASE SCHEMA
-- ============================================

-- Creazione database (opzionale, eseguire separatamente se necessario)
-- CREATE DATABASE IF NOT EXISTS centogiorni_game CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE centogiorni_game;

-- ============================================
-- TABELLA: Configurazione Gioco
-- ============================================
CREATE TABLE IF NOT EXISTS game_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(50) NOT NULL UNIQUE,
    config_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELLA: Immagini Personalizzate
-- ============================================
-- Dimensioni consigliate: 64x64 px, PNG trasparente, max 100KB
CREATE TABLE IF NOT EXISTS game_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_key VARCHAR(50) NOT NULL UNIQUE COMMENT 'Chiave univoca: player, enemy1, enemy2, enemy3, enemy4, beer, vodka, powerup, scared',
    filename VARCHAR(255) NOT NULL COMMENT 'Nome file nella cartella upload/',
    original_name VARCHAR(255) COMMENT 'Nome originale del file caricato',
    mime_type VARCHAR(50) DEFAULT 'image/png',
    file_size INT COMMENT 'Dimensione in bytes',
    width INT DEFAULT 64 COMMENT 'Larghezza in pixel',
    height INT DEFAULT 64 COMMENT 'Altezza in pixel',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_image_key (image_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELLA: Leaderboard (Classifica)
-- ============================================
CREATE TABLE IF NOT EXISTS leaderboard (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nickname VARCHAR(20) NOT NULL,
    score INT NOT NULL DEFAULT 0,
    level INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) COMMENT 'IPv4 o IPv6',
    user_agent VARCHAR(255),
    INDEX idx_score (score DESC),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELLA: Evento
-- ============================================
CREATE TABLE IF NOT EXISTS event_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL DEFAULT 'i 100 Giorni',
    event_date VARCHAR(50) NOT NULL DEFAULT 'Sabato 14 Marzo 2026',
    location VARCHAR(100) NOT NULL DEFAULT 'OPIUM - PORDENONE',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserisci valori di default per evento
INSERT INTO event_info (title, event_date, location) VALUES 
('i 100 Giorni', 'Sabato 14 Marzo 2026', 'OPIUM - PORDENONE')
ON DUPLICATE KEY UPDATE id=id;

-- ============================================
-- TABELLA: Colori Tema
-- ============================================
CREATE TABLE IF NOT EXISTS theme_colors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    color_key VARCHAR(30) NOT NULL UNIQUE,
    color_value VARCHAR(20) NOT NULL,
    description VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserisci colori di default
INSERT INTO theme_colors (color_key, color_value, description) VALUES 
('gold', '#ffd700', 'Colore principale'),
('cyan', '#4ecdc4', 'Colore secondario'),
('bg', '#0f0f1e', 'Sfondo'),
('pink', '#ec4899', 'Colore accento'),
('wall', '#1a1a3e', 'Colore muri')
ON DUPLICATE KEY UPDATE color_value=VALUES(color_value);

-- ============================================
-- TABELLA: Emoji/Personaggi
-- ============================================
CREATE TABLE IF NOT EXISTS game_characters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    char_key VARCHAR(30) NOT NULL UNIQUE,
    emoji VARCHAR(10) NOT NULL,
    name VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserisci personaggi di default
INSERT INTO game_characters (char_key, emoji, name) VALUES 
('player', '🎓', 'Studente'),
('enemy1', '👨‍🏫', 'Prof. Mate'),
('enemy2', '👩‍🏫', 'Prof. Italiano'),
('enemy3', '🧑‍🏫', 'Prof. Inglese'),
('enemy4', '👴', 'Preside'),
('enemy5', '👨‍🔬', 'Prof. Scienze'),
('enemy6', '👩‍💼', 'Vicepreside'),
('beer', '🍺', 'Birra'),
('vodka', '🍾', 'Vodka'),
('powerup', '📜', 'Giustificativo'),
('scared', '😰', 'Nemico Spaventato')
ON DUPLICATE KEY UPDATE emoji=VALUES(emoji);

-- ============================================
-- VISTA: Configurazione Completa
-- ============================================
CREATE OR REPLACE VIEW v_full_config AS
SELECT 
    'event' as section,
    e.title,
    e.event_date,
    e.location,
    NULL as color_value,
    NULL as emoji,
    NULL as filename
FROM event_info e
WHERE e.id = 1

UNION ALL

SELECT 
    'colors' as section,
    tc.color_key as title,
    NULL as event_date,
    NULL as location,
    tc.color_value,
    NULL as emoji,
    NULL as filename
FROM theme_colors tc

UNION ALL

SELECT 
    'characters' as section,
    gc.char_key as title,
    gc.name as event_date,
    NULL as location,
    NULL as color_value,
    gc.emoji,
    gi.filename
FROM game_characters gc
LEFT JOIN game_images gi ON gc.char_key = gi.image_key;
