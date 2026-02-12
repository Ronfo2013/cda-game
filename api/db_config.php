<?php
/**
 * Configurazione Database - i 100 Giorni Game
 * 
 * Modifica questi valori con le credenziali del tuo database MySQL
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'centogiorni_game');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Percorso cartella upload (relativo alla root del progetto)
define('UPLOAD_DIR', __DIR__ . '/../upload/');
define('UPLOAD_URL', 'upload/');

// Limiti upload
define('MAX_FILE_SIZE', 100 * 1024); // 100KB
define('ALLOWED_TYPES', ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']);
define('IMAGE_MAX_WIDTH', 256);
define('IMAGE_MAX_HEIGHT', 256);

// Password admin (cambia questa!)
define('ADMIN_PASSWORD', 'admin123');

/**
 * Connessione PDO al database
 */
function getDB(): ?PDO {
    static $pdo = null;
    
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            return null;
        }
    }
    
    return $pdo;
}

/**
 * Verifica se il database è configurato e raggiungibile
 */
function isDatabaseConfigured(): bool {
    $pdo = getDB();
    if ($pdo === null) return false;
    
    try {
        $stmt = $pdo->query("SELECT 1 FROM game_images LIMIT 1");
        return true;
    } catch (PDOException $e) {
        return false;
    }
}
