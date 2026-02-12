<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Password');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

const MAX_SCORES = 100;
const ADMIN_PASSWORD = 'admin123'; // Deve corrispondere a db_config.php

$dataDir = dirname(__DIR__) . '/data';
$filePath = $dataDir . '/leaderboard.json';

if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0775, true);
}

if (!file_exists($filePath)) {
    file_put_contents($filePath, "[]", LOCK_EX);
}

function respond(array $payload, int $status = 200): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function validateAdminPassword(): bool {
    $password = $_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? '';
    return $password === ADMIN_PASSWORD;
}

function sanitizeNickname(string $nickname): string {
    $nickname = trim(strip_tags($nickname));
    $nickname = preg_replace('/[<>"\']/', '', $nickname) ?? '';
    if (mb_strlen($nickname) > 20) {
        $nickname = mb_substr($nickname, 0, 20);
    }
    return $nickname !== '' ? $nickname : 'Anonimo';
}

function readScores(string $filePath): array {
    $raw = @file_get_contents($filePath);
    if ($raw === false || $raw === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function sortScores(array &$scores): void {
    usort($scores, static function ($a, $b) {
        $scoreA = isset($a['score']) ? (int)$a['score'] : 0;
        $scoreB = isset($b['score']) ? (int)$b['score'] : 0;

        if ($scoreA !== $scoreB) {
            return $scoreB <=> $scoreA;
        }

        $timeA = strtotime((string)($a['created_at'] ?? '')) ?: 0;
        $timeB = strtotime((string)($b['created_at'] ?? '')) ?: 0;
        return $timeA <=> $timeB;
    });
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $limit = max(1, min(100, $limit));

    $scores = readScores($filePath);
    sortScores($scores);

    respond([
        'success' => true,
        'scores' => array_slice($scores, 0, $limit)
    ]);
}

if ($method === 'POST') {
    $rawBody = file_get_contents('php://input');
    $payload = json_decode($rawBody ?: '', true);

    if (!is_array($payload)) {
        respond([
            'success' => false,
            'error' => 'Payload non valido'
        ], 400);
    }

    $nickname = sanitizeNickname((string)($payload['nickname'] ?? ''));
    $score = max(0, (int)($payload['score'] ?? 0));
    $level = max(1, (int)($payload['level'] ?? 1));

    $entry = [
        'nickname' => $nickname,
        'score' => $score,
        'level' => $level,
        'created_at' => gmdate('c')
    ];

    $fp = @fopen($filePath, 'c+');
    if ($fp === false) {
        respond([
            'success' => false,
            'error' => 'Impossibile aprire il file classifica'
        ], 500);
    }

    if (!flock($fp, LOCK_EX)) {
        fclose($fp);
        respond([
            'success' => false,
            'error' => 'Impossibile bloccare il file classifica'
        ], 500);
    }

    rewind($fp);
    $currentRaw = stream_get_contents($fp);
    $scores = json_decode($currentRaw ?: '[]', true);
    if (!is_array($scores)) {
        $scores = [];
    }

    $scores[] = $entry;
    sortScores($scores);
    $scores = array_slice($scores, 0, MAX_SCORES);

    rewind($fp);
    ftruncate($fp, 0);
    fwrite($fp, json_encode($scores, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);

    $position = 0;
    foreach ($scores as $idx => $s) {
        if (
            ($s['nickname'] ?? '') === $entry['nickname'] &&
            (int)($s['score'] ?? 0) === $entry['score'] &&
            ($s['created_at'] ?? '') === $entry['created_at']
        ) {
            $position = $idx + 1;
            break;
        }
    }

    respond([
        'success' => true,
        'position' => $position,
        'scores' => array_slice($scores, 0, 10)
    ]);
}

// DELETE - Svuota classifica (richiede password admin)
if ($method === 'DELETE') {
    if (!validateAdminPassword()) {
        respond([
            'success' => false,
            'error' => 'Password admin non valida'
        ], 403);
    }
    
    $fp = @fopen($filePath, 'w');
    if ($fp === false) {
        respond([
            'success' => false,
            'error' => 'Impossibile aprire il file classifica'
        ], 500);
    }
    
    fwrite($fp, '[]');
    fclose($fp);
    
    respond([
        'success' => true,
        'message' => 'Classifica svuotata'
    ]);
}

respond([
    'success' => false,
    'error' => 'Metodo non supportato'
], 405);
