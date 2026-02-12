<?php
/**
 * API Configurazione - i 100 Giorni Game
 * 
 * Endpoint per gestire configurazione evento, colori e personaggi
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

function respond(array $payload, int $status = 200): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function validateAdminPassword(): bool {
    $password = $_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? '';
    return $password === ADMIN_PASSWORD;
}

// ============================================
// GET - Ottieni configurazione completa
// ============================================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Prova prima file JSON (fallback)
    $configFile = dirname(__DIR__) . '/data/config.json';
    
    // Controlla se il DB è configurato
    if (!isDatabaseConfigured()) {
        // Prova a leggere da file JSON
        if (file_exists($configFile)) {
            $jsonConfig = json_decode(file_get_contents($configFile), true);
            if (is_array($jsonConfig)) {
                respond([
                    'success' => true,
                    'config' => $jsonConfig,
                    'source' => 'json_file'
                ]);
            }
        }
        
        // Ritorna configurazione di default
        respond([
            'success' => true,
            'config' => [
                'event' => [
                    'title' => 'i 100 Giorni',
                    'date' => 'Sabato 14 Marzo 2026',
                    'location' => 'OPIUM - PORDENONE'
                ],
                'colors' => [
                    'gold' => '#ffd700',
                    'cyan' => '#4ecdc4',
                    'bg' => '#0f0f1e',
                    'pink' => '#ec4899',
                    'wall' => '#1a1a3e'
                ],
                'emojis' => [
                    'player' => '🎓',
                    'beer' => '🍺',
                    'vodka' => '🍾',
                    'powerup' => '📜',
                    'scared' => '😰',
                    'enemies' => ['👨‍🏫', '👩‍🏫', '🧑‍🏫', '👴', '👨‍🔬', '👩‍💼']
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
            ],
            'source' => 'default'
        ]);
    }
    
    $pdo = getDB();
    $config = [];
    
    // Evento
    $stmt = $pdo->query("SELECT title, event_date, location FROM event_info LIMIT 1");
    $event = $stmt->fetch();
    $config['event'] = [
        'title' => $event['title'] ?? 'i 100 Giorni',
        'date' => $event['event_date'] ?? 'Sabato 14 Marzo 2026',
        'location' => $event['location'] ?? 'OPIUM - PORDENONE'
    ];
    
    // Colori
    $stmt = $pdo->query("SELECT color_key, color_value FROM theme_colors");
    $colors = [];
    while ($row = $stmt->fetch()) {
        $colors[$row['color_key']] = $row['color_value'];
    }
    $config['colors'] = $colors;
    
    // Personaggi/Emoji
    $stmt = $pdo->query("SELECT char_key, emoji FROM game_characters");
    $emojis = ['enemies' => []];
    while ($row = $stmt->fetch()) {
        $key = $row['char_key'];
        if (preg_match('/^enemy(\d+)$/', $key, $m)) {
            $emojis['enemies'][(int)$m[1] - 1] = $row['emoji'];
        } else {
            $emojis[$key] = $row['emoji'];
        }
    }
    $config['emojis'] = $emojis;
    
    // Immagini
    $stmt = $pdo->query("SELECT image_key, filename FROM game_images");
    $images = ['enemies' => []];
    while ($row = $stmt->fetch()) {
        $key = $row['image_key'];
        $url = UPLOAD_URL . $row['filename'];
        if (preg_match('/^enemy(\d+)$/', $key, $m)) {
            $images['enemies'][(int)$m[1] - 1] = $url;
        } else {
            $images[$key] = $url;
        }
    }
    $config['images'] = $images;
    
    respond([
        'success' => true,
        'config' => $config,
        'source' => 'database'
    ]);
}

// ============================================
// POST - Salva configurazione
// ============================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Verifica password admin
    if (!validateAdminPassword()) {
        respond(['success' => false, 'error' => 'Password admin non valida'], 403);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        respond(['success' => false, 'error' => 'Payload non valido'], 400);
    }
    
    // Controlla se il DB è configurato
    if (!isDatabaseConfigured()) {
        // Salva su file JSON come fallback
        $configFile = dirname(__DIR__) . '/data/config.json';
        $dataDir = dirname($configFile);
        
        if (!is_dir($dataDir)) {
            @mkdir($dataDir, 0775, true);
        }
        
        // Leggi config esistente e merge
        $existingConfig = [];
        if (file_exists($configFile)) {
            $existingConfig = json_decode(file_get_contents($configFile), true) ?? [];
        }
        
        // Merge nuova configurazione
        $config = array_merge($existingConfig, [
            'event' => $input['event'] ?? $existingConfig['event'] ?? [],
            'colors' => $input['colors'] ?? $existingConfig['colors'] ?? [],
            'emojis' => $input['emojis'] ?? $existingConfig['emojis'] ?? []
        ]);
        
        // Mantieni immagini esistenti
        if (isset($existingConfig['images'])) {
            $config['images'] = $existingConfig['images'];
        }
        
        $result = file_put_contents($configFile, json_encode($config, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
        
        if ($result === false) {
            respond(['success' => false, 'error' => 'Impossibile scrivere config.json. Verifica permessi data/'], 500);
        }
        
        respond([
            'success' => true,
            'message' => 'Configurazione salvata (file JSON)',
            'source' => 'json_file'
        ]);
    }
    
    $pdo = getDB();
    
    try {
        $pdo->beginTransaction();
        
        // Aggiorna evento
        if (!empty($input['event'])) {
            $stmt = $pdo->prepare("
                UPDATE event_info SET 
                    title = ?,
                    event_date = ?,
                    location = ?
                WHERE id = 1
            ");
            $stmt->execute([
                $input['event']['title'] ?? 'i 100 Giorni',
                $input['event']['date'] ?? 'Sabato 14 Marzo 2026',
                $input['event']['location'] ?? 'OPIUM - PORDENONE'
            ]);
        }
        
        // Aggiorna colori
        if (!empty($input['colors'])) {
            $stmt = $pdo->prepare("
                INSERT INTO theme_colors (color_key, color_value) VALUES (?, ?)
                ON DUPLICATE KEY UPDATE color_value = VALUES(color_value)
            ");
            foreach ($input['colors'] as $key => $value) {
                $stmt->execute([$key, $value]);
            }
        }
        
        // Aggiorna emoji
        if (!empty($input['emojis'])) {
            $stmt = $pdo->prepare("
                INSERT INTO game_characters (char_key, emoji) VALUES (?, ?)
                ON DUPLICATE KEY UPDATE emoji = VALUES(emoji)
            ");
            
            foreach ($input['emojis'] as $key => $value) {
                if ($key === 'enemies' && is_array($value)) {
                    foreach ($value as $i => $emoji) {
                        $stmt->execute(['enemy' . ($i + 1), $emoji]);
                    }
                } else {
                    $stmt->execute([$key, $value]);
                }
            }
        }
        
        $pdo->commit();
        
        respond([
            'success' => true,
            'message' => 'Configurazione salvata'
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        respond(['success' => false, 'error' => 'Errore salvataggio: ' . $e->getMessage()], 500);
    }
}

respond(['success' => false, 'error' => 'Metodo non supportato'], 405);
