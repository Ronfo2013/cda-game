<?php
/**
 * API Configurazione - Caffè Dell'Angolo Game
 * 
 * Endpoint per gestire configurazione evento, colori e personaggi
 * Tutto basato su file JSON (data/config.json + data/images.json)
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Password');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/db_config.php';

define('CONFIG_JSON', dirname(__DIR__) . '/data/config.json');
define('IMAGES_JSON', dirname(__DIR__) . '/data/images.json');

function respond(array $payload, int $status = 200): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function validateAdminPassword(): bool {
    $password = $_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? '';
    return $password === ADMIN_PASSWORD;
}

function getDefaultConfig(): array {
    return [
        'event' => [
            'title' => 'Caffè Dell\'Angolo',
            'date' => 'Gioca Anche tu!',
            'location' => ''
        ],
        'colors' => [
            'gold' => '#ffd700',
            'cyan' => '#4ecdc4',
            'bg' => '#0f0f1e',
            'pink' => '#ec4899',
            'wall' => '#1a1a3e'
        ],
        'emojis' => [
            'enemy' => '👨‍🏫',
            'beer' => '🍺',
            'vodka' => '🍾',
            'powerup' => '📜',
            'scared' => '😰',
            'players' => ['🎓', '🎓', '🎓', '🎓', '🎓', '🎓']
        ],
        'app' => [
            'title' => 'Caffè Dell\'Angolo - Il Gioco',
            'description' => 'Unisciti al gruppo e gioca in stile Pac-Man!'
        ],
        'uiIcons' => [
            'title' => '🎓',
            'date' => '📅',
            'location' => '📍',
            'leaderboard' => '🏆',
            'score' => '🏆',
            'level' => '📊',
            'lives' => '❤️',
            'swipe' => '👆'
        ],
        'images' => []
    ];
}

/**
 * Costruisce la sezione images con URL completi leggendo images.json
 */
function buildImagesConfig(): array {
    if (!file_exists(IMAGES_JSON)) return [];
    
    $imagesData = json_decode(file_get_contents(IMAGES_JSON), true);
    if (!is_array($imagesData)) return [];
    
    $images = [
        'enemy' => null,
        'beer' => null,
        'vodka' => null,
        'powerup' => null,
        'scared' => null,
        'logo' => null,
        'favicon' => null,
        'players' => [null, null, null, null, null, null],
        'beers' => [null, null, null, null, null, null],
        'vodkas' => [null, null, null, null, null, null],
        'powerups' => [null, null, null, null, null, null]
    ];
    
    foreach ($imagesData as $key => $data) {
        if (empty($data['filename'])) continue;
        $url = UPLOAD_URL . $data['filename'];
        
        if (preg_match('/^player(\d+)$/', $key, $m)) {
            $idx = (int)$m[1] - 1;
            if ($idx >= 0 && $idx < 6) {
                $images['players'][$idx] = $url;
            }
        } elseif (preg_match('/^beer(\d+)$/', $key, $m)) {
            $idx = (int)$m[1] - 1;
            if ($idx >= 0 && $idx < 6) {
                $images['beers'][$idx] = $url;
            }
        } elseif (preg_match('/^vodka(\d+)$/', $key, $m)) {
            $idx = (int)$m[1] - 1;
            if ($idx >= 0 && $idx < 6) {
                $images['vodkas'][$idx] = $url;
            }
        } elseif (preg_match('/^powerup(\d+)$/', $key, $m)) {
            $idx = (int)$m[1] - 1;
            if ($idx >= 0 && $idx < 6) {
                $images['powerups'][$idx] = $url;
            }
        } else {
            $images[$key] = $url;
        }
    }
    
    return $images;
}

// ============================================
// GET - Ottieni configurazione completa
// ============================================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $config = getDefaultConfig();
    
    // Leggi config.json
    if (file_exists(CONFIG_JSON)) {
        $jsonConfig = json_decode(file_get_contents(CONFIG_JSON), true);
        if (is_array($jsonConfig)) {
            // Merge con defaults
            if (isset($jsonConfig['event'])) $config['event'] = array_merge($config['event'], $jsonConfig['event']);
            if (isset($jsonConfig['colors'])) $config['colors'] = array_merge($config['colors'], $jsonConfig['colors']);
            if (isset($jsonConfig['emojis'])) $config['emojis'] = array_merge($config['emojis'], $jsonConfig['emojis']);
            if (isset($jsonConfig['app'])) $config['app'] = array_merge($config['app'], $jsonConfig['app']);
            if (isset($jsonConfig['uiIcons'])) $config['uiIcons'] = array_merge($config['uiIcons'], $jsonConfig['uiIcons']);
        }
    }
    
    // Costruisci immagini da images.json (fonte di verità per i file caricati)
    $config['images'] = buildImagesConfig();
    
    respond([
        'success' => true,
        'config' => $config,
        'source' => 'json_file'
    ]);
}

// ============================================
// POST - Salva configurazione
// ============================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!validateAdminPassword()) {
        respond(['success' => false, 'error' => 'Password admin non valida'], 403);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        respond(['success' => false, 'error' => 'Payload non valido'], 400);
    }
    
    $dataDir = dirname(CONFIG_JSON);
    if (!is_dir($dataDir)) {
        @mkdir($dataDir, 0775, true);
    }
    
    // Leggi config esistente
    $existingConfig = [];
    if (file_exists(CONFIG_JSON)) {
        $existingConfig = json_decode(file_get_contents(CONFIG_JSON), true) ?? [];
    }
    
    // Merge configurazione
    $config = [
        'event' => $input['event'] ?? $existingConfig['event'] ?? [],
        'app' => $input['app'] ?? $existingConfig['app'] ?? [],
        'colors' => $input['colors'] ?? $existingConfig['colors'] ?? [],
        'emojis' => $input['emojis'] ?? $existingConfig['emojis'] ?? [],
        'uiIcons' => $input['uiIcons'] ?? $existingConfig['uiIcons'] ?? []
    ];
    
    // Le immagini vengono gestite da images.php/images.json,
    // ma salviamo anche i riferimenti in config.json per il localStorage del client
    if (isset($input['images'])) {
        $config['images'] = $input['images'];
    } elseif (isset($existingConfig['images'])) {
        $config['images'] = $existingConfig['images'];
    }
    
    $result = file_put_contents(CONFIG_JSON, json_encode($config, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
    
    if ($result === false) {
        respond(['success' => false, 'error' => 'Impossibile scrivere config.json. Verifica permessi data/'], 500);
    }
    
    respond([
        'success' => true,
        'message' => 'Configurazione salvata',
        'source' => 'json_file'
    ]);
}

respond(['success' => false, 'error' => 'Metodo non supportato'], 405);
