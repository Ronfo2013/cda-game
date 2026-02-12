<?php
/**
 * API Upload Immagini - i 100 Giorni Game
 * 
 * Endpoint per caricare, ottenere e eliminare immagini personalizzate
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Password');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/db_config.php';

// ============================================
// FUNZIONI HELPER
// ============================================

function respond(array $payload, int $status = 200): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function validateAdminPassword(): bool {
    $password = $_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? '';
    return $password === ADMIN_PASSWORD;
}

function validateImageKey(string $key): bool {
    $validKeys = ['player', 'enemy1', 'enemy2', 'enemy3', 'enemy4', 'enemy5', 'enemy6', 
                  'beer', 'vodka', 'powerup', 'scared'];
    return in_array($key, $validKeys, true);
}

function generateFilename(string $key, string $extension): string {
    return $key . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $extension;
}

function getExtensionFromMime(string $mime): string {
    $map = [
        'image/png' => 'png',
        'image/jpeg' => 'jpg',
        'image/gif' => 'gif',
        'image/webp' => 'webp'
    ];
    return $map[$mime] ?? 'png';
}

function deleteOldImage(PDO $pdo, string $imageKey): void {
    $stmt = $pdo->prepare("SELECT filename FROM game_images WHERE image_key = ?");
    $stmt->execute([$imageKey]);
    $old = $stmt->fetch();
    
    if ($old && !empty($old['filename'])) {
        $oldPath = UPLOAD_DIR . $old['filename'];
        if (file_exists($oldPath)) {
            @unlink($oldPath);
        }
    }
}

// ============================================
// GET - Ottieni tutte le immagini
// ============================================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Controlla se il DB è configurato
    if (!isDatabaseConfigured()) {
        // Fallback: ritorna lista vuota
        respond([
            'success' => true,
            'images' => [],
            'source' => 'fallback'
        ]);
    }
    
    $pdo = getDB();
    $stmt = $pdo->query("SELECT image_key, filename, original_name, uploaded_at FROM game_images ORDER BY image_key");
    $images = $stmt->fetchAll();
    
    // Aggiungi URL completo
    foreach ($images as &$img) {
        $img['url'] = UPLOAD_URL . $img['filename'];
    }
    
    respond([
        'success' => true,
        'images' => $images,
        'source' => 'database'
    ]);
}

// ============================================
// POST - Carica nuova immagine
// ============================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Verifica password admin
    if (!validateAdminPassword()) {
        respond(['success' => false, 'error' => 'Password admin non valida'], 403);
    }
    
    // Controlla se il DB è configurato
    if (!isDatabaseConfigured()) {
        respond(['success' => false, 'error' => 'Database non configurato. Esegui db.sql prima.'], 500);
    }
    
    // Verifica che ci sia un file
    if (empty($_FILES['image'])) {
        respond(['success' => false, 'error' => 'Nessun file ricevuto'], 400);
    }
    
    $file = $_FILES['image'];
    $imageKey = $_POST['key'] ?? '';
    
    // Valida chiave immagine
    if (!validateImageKey($imageKey)) {
        respond(['success' => false, 'error' => 'Chiave immagine non valida'], 400);
    }
    
    // Controlla errori upload
    if ($file['error'] !== UPLOAD_ERR_OK) {
        respond(['success' => false, 'error' => 'Errore durante upload: ' . $file['error']], 400);
    }
    
    // Controlla dimensione file
    if ($file['size'] > MAX_FILE_SIZE) {
        respond(['success' => false, 'error' => 'File troppo grande. Max ' . (MAX_FILE_SIZE / 1024) . 'KB'], 400);
    }
    
    // Controlla tipo MIME
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mimeType, ALLOWED_TYPES, true)) {
        respond(['success' => false, 'error' => 'Tipo file non consentito. Usa PNG, JPG, GIF o WebP'], 400);
    }
    
    // Verifica dimensioni immagine
    $imageInfo = @getimagesize($file['tmp_name']);
    if ($imageInfo === false) {
        respond(['success' => false, 'error' => 'File non è un\'immagine valida'], 400);
    }
    
    $width = $imageInfo[0];
    $height = $imageInfo[1];
    
    if ($width > IMAGE_MAX_WIDTH || $height > IMAGE_MAX_HEIGHT) {
        respond(['success' => false, 'error' => "Immagine troppo grande. Max {$width}x{$height}px"], 400);
    }
    
    // Genera nome file univoco
    $extension = getExtensionFromMime($mimeType);
    $filename = generateFilename($imageKey, $extension);
    $filepath = UPLOAD_DIR . $filename;
    
    // Crea cartella se non esiste
    if (!is_dir(UPLOAD_DIR)) {
        mkdir(UPLOAD_DIR, 0755, true);
    }
    
    // Sposta file
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        respond(['success' => false, 'error' => 'Impossibile salvare il file'], 500);
    }
    
    // Salva nel database
    $pdo = getDB();
    
    // Elimina vecchia immagine se esiste
    deleteOldImage($pdo, $imageKey);
    
    // Inserisci o aggiorna
    $stmt = $pdo->prepare("
        INSERT INTO game_images (image_key, filename, original_name, mime_type, file_size, width, height)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            filename = VALUES(filename),
            original_name = VALUES(original_name),
            mime_type = VALUES(mime_type),
            file_size = VALUES(file_size),
            width = VALUES(width),
            height = VALUES(height),
            uploaded_at = CURRENT_TIMESTAMP
    ");
    
    $stmt->execute([
        $imageKey,
        $filename,
        $file['name'],
        $mimeType,
        $file['size'],
        $width,
        $height
    ]);
    
    respond([
        'success' => true,
        'message' => 'Immagine caricata con successo',
        'image' => [
            'key' => $imageKey,
            'filename' => $filename,
            'url' => UPLOAD_URL . $filename,
            'width' => $width,
            'height' => $height
        ]
    ]);
}

// ============================================
// DELETE - Elimina immagine
// ============================================
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Verifica password admin
    if (!validateAdminPassword()) {
        respond(['success' => false, 'error' => 'Password admin non valida'], 403);
    }
    
    // Controlla se il DB è configurato
    if (!isDatabaseConfigured()) {
        respond(['success' => false, 'error' => 'Database non configurato'], 500);
    }
    
    // Leggi body
    $input = json_decode(file_get_contents('php://input'), true);
    $imageKey = $input['key'] ?? '';
    
    if (!validateImageKey($imageKey)) {
        respond(['success' => false, 'error' => 'Chiave immagine non valida'], 400);
    }
    
    $pdo = getDB();
    
    // Elimina file e record
    deleteOldImage($pdo, $imageKey);
    
    $stmt = $pdo->prepare("DELETE FROM game_images WHERE image_key = ?");
    $stmt->execute([$imageKey]);
    
    respond([
        'success' => true,
        'message' => 'Immagine eliminata'
    ]);
}

respond(['success' => false, 'error' => 'Metodo non supportato'], 405);
