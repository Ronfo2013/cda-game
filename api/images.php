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

// Percorsi
define('IMAGES_JSON', __DIR__ . '/../data/images.json');

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
                  'beer', 'vodka', 'powerup', 'scared', 'logo'];
    return in_array($key, $validKeys, true);
}

function loadImagesData(): array {
    if (!file_exists(IMAGES_JSON)) {
        return [];
    }
    $json = file_get_contents(IMAGES_JSON);
    return json_decode($json, true) ?: [];
}

function saveImagesData(array $data): bool {
    $dir = dirname(IMAGES_JSON);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    return file_put_contents(IMAGES_JSON, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) !== false;
}

function generateFilename(string $key, string $extension): string {
    return $key . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $extension;
}

function getExtensionFromMime(string $mime): string {
    $map = [
        'image/png' => 'png',
        'image/jpeg' => 'jpg',
        'image/gif' => 'gif',
        'image/webp' => 'webp',
        'image/svg+xml' => 'svg'
    ];
    return $map[$mime] ?? 'png';
}

function deleteOldImage(string $imageKey): void {
    $imagesData = loadImagesData();
    
    if (isset($imagesData[$imageKey]) && !empty($imagesData[$imageKey]['filename'])) {
        $oldPath = UPLOAD_DIR . $imagesData[$imageKey]['filename'];
        if (file_exists($oldPath)) {
            @unlink($oldPath);
        }
    }
}

// ============================================
// GET - Ottieni tutte le immagini
// ============================================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $imagesData = loadImagesData();
    $images = [];
    
    foreach ($imagesData as $key => $data) {
        $images[] = [
            'image_key' => $key,
            'filename' => $data['filename'],
            'original_name' => $data['original_name'] ?? '',
            'url' => UPLOAD_URL . $data['filename'],
            'uploaded_at' => $data['uploaded_at'] ?? ''
        ];
    }
    
    respond([
        'success' => true,
        'images' => $images,
        'source' => 'json'
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
    
    // Verifica dimensioni immagine (skip per SVG)
    if ($mimeType !== 'image/svg+xml') {
        $imageInfo = @getimagesize($file['tmp_name']);
        if ($imageInfo === false) {
            respond(['success' => false, 'error' => 'File non è un\'immagine valida'], 400);
        }
        
        $width = $imageInfo[0];
        $height = $imageInfo[1];
        
        if ($width > IMAGE_MAX_WIDTH || $height > IMAGE_MAX_HEIGHT) {
            respond(['success' => false, 'error' => "Immagine troppo grande. Max " . IMAGE_MAX_WIDTH . "x" . IMAGE_MAX_HEIGHT . "px"], 400);
        }
    } else {
        $width = 0;
        $height = 0;
    }
    
    // Genera nome file univoco
    $extension = getExtensionFromMime($mimeType);
    $filename = generateFilename($imageKey, $extension);
    $filepath = UPLOAD_DIR . $filename;
    
    // Crea cartella se non esiste
    if (!is_dir(UPLOAD_DIR)) {
        mkdir(UPLOAD_DIR, 0755, true);
    }
    
    // Elimina vecchia immagine se esiste
    deleteOldImage($imageKey);
    
    // Sposta file
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        respond(['success' => false, 'error' => 'Impossibile salvare il file'], 500);
    }
    
    // Salva metadati nel JSON
    $imagesData = loadImagesData();
    $imagesData[$imageKey] = [
        'filename' => $filename,
        'original_name' => $file['name'],
        'mime_type' => $mimeType,
        'file_size' => $file['size'],
        'width' => $width,
        'height' => $height,
        'uploaded_at' => date('Y-m-d H:i:s')
    ];
    
    if (!saveImagesData($imagesData)) {
        respond(['success' => false, 'error' => 'Impossibile salvare metadati'], 500);
    }
    
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
    
    // Leggi body
    $input = json_decode(file_get_contents('php://input'), true);
    $imageKey = $input['key'] ?? '';
    
    if (!validateImageKey($imageKey)) {
        respond(['success' => false, 'error' => 'Chiave immagine non valida'], 400);
    }
    
    // Elimina file fisico
    deleteOldImage($imageKey);
    
    // Rimuovi dal JSON
    $imagesData = loadImagesData();
    unset($imagesData[$imageKey]);
    saveImagesData($imagesData);
    
    respond([
        'success' => true,
        'message' => 'Immagine eliminata'
    ]);
}

respond(['success' => false, 'error' => 'Metodo non supportato'], 405);
