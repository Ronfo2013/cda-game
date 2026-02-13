<?php
/**
 * index.php - Serve index.html con meta tag dinamici da config.json
 * 
 * I crawler social (WhatsApp, Facebook, Twitter) NON eseguono JavaScript,
 * quindi i meta tag og:title, og:description ecc. devono essere nel HTML statico.
 * Questo file legge data/config.json e data/images.json e inietta i valori corretti.
 */

// Leggi configurazione
$configFile = __DIR__ . '/data/config.json';
$imagesFile = __DIR__ . '/data/images.json';

$config = [];
if (file_exists($configFile)) {
    $config = json_decode(file_get_contents($configFile), true) ?: [];
}

$images = [];
if (file_exists($imagesFile)) {
    $images = json_decode(file_get_contents($imagesFile), true) ?: [];
}

// Valori per meta tag (priorità: app > event > default)
$appTitle = $config['app']['title'] ?? 'Caffè Dell\'Angolo - Il Gioco';
$appDescription = $config['app']['description'] ?? 'Unisciti al gruppo e gioca in stile Pac-Man!';
$eventTitle = $config['event']['title'] ?? 'Caffè Dell\'Angolo';
$eventDate = $config['event']['date'] ?? 'Gioca Anche tu!';
$eventLocation = $config['event']['location'] ?? '';

// Favicon: priorità favicon dedicata > logo > default
$faviconUrl = 'favicon.svg';
$faviconType = 'image/svg+xml';
if (!empty($images['favicon']['filename'])) {
    $faviconUrl = 'upload/' . $images['favicon']['filename'];
    $faviconType = 'image/png';
} elseif (!empty($images['logo']['filename'])) {
    $faviconUrl = 'upload/' . $images['logo']['filename'];
    $faviconType = 'image/png';
}

// Logo evento
$logoUrl = '';
if (!empty($images['logo']['filename'])) {
    $logoUrl = 'upload/' . $images['logo']['filename'];
}

// OG Image (usa logo se disponibile)
$ogImage = $logoUrl ?: '';

// Escape HTML per sicurezza
$e = function($s) { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); };

// Leggi index.html e sostituisci i meta tag
$html = file_get_contents(__DIR__ . '/index.html');

if ($html === false) {
    http_response_code(500);
    echo 'Errore: impossibile leggere index.html';
    exit;
}

// Sostituisci meta description
$html = preg_replace(
    '/<meta\s+name="description"[^>]*content="[^"]*"/',
    '<meta name="description" id="meta-description" content="' . $e($appDescription) . '"',
    $html
);

// Sostituisci og:title
$html = preg_replace(
    '/<meta\s+property="og:title"[^>]*content="[^"]*"/',
    '<meta property="og:title" id="og-title" content="' . $e($appTitle) . '"',
    $html
);

// Sostituisci og:description
$html = preg_replace(
    '/<meta\s+property="og:description"[^>]*content="[^"]*"/',
    '<meta property="og:description" id="og-description" content="' . $e($appDescription) . '"',
    $html
);

// Sostituisci <title>
$html = preg_replace(
    '/<title>[^<]*<\/title>/',
    '<title>' . $e($appTitle) . '</title>',
    $html
);

// Sostituisci favicon
$html = preg_replace(
    '/<link\s+rel="icon"[^>]*href="[^"]*"[^>]*id="favicon-link"[^>]*>/',
    '<link rel="icon" type="' . $e($faviconType) . '" href="' . $e($faviconUrl) . '" id="favicon-link">',
    $html
);

// Sostituisci apple-touch-icon
$html = preg_replace(
    '/<link\s+rel="apple-touch-icon"[^>]*href="[^"]*"/',
    '<link rel="apple-touch-icon" href="' . $e($faviconUrl) . '"',
    $html
);

// Aggiungi og:image se abbiamo un logo (prima di og:type)
if ($ogImage) {
    $html = preg_replace(
        '/(<meta\s+property="og:type")/',
        '<meta property="og:image" content="' . $e($ogImage) . '">' . "\n    " . '$1',
        $html
    );
}

// Sostituisci testi evento nel body
$html = preg_replace(
    '/(<span\s+id="text-title">)[^<]*(<\/span>)/',
    '$1' . $e($eventTitle) . '$2',
    $html
);
$html = preg_replace(
    '/(<span\s+id="text-date">)[^<]*(<\/span>)/',
    '$1' . $e($eventDate) . '$2',
    $html
);
$html = preg_replace(
    '/(<span\s+id="text-location">)[^<]*(<\/span>)/',
    '$1' . $e($eventLocation) . '$2',
    $html
);

// Se c'è un logo, mostra il container
if ($logoUrl) {
    $html = str_replace(
        '<div id="event-logo-container" style="display: none;">',
        '<div id="event-logo-container" style="display: block;">',
        $html
    );
    $html = preg_replace(
        '/(<img\s+id="event-logo"\s+src=")[^"]*"/',
        '$1' . $e($logoUrl) . '"',
        $html
    );
}

// Icone UI personalizzate
if (!empty($config['uiIcons'])) {
    $icons = $config['uiIcons'];
    $iconMap = [
        'icon-title-left' => $icons['title'] ?? null,
        'icon-title-right' => $icons['title'] ?? null,
        'icon-date' => $icons['date'] ?? null,
        'icon-location' => $icons['location'] ?? null,
        'icon-leaderboard' => $icons['leaderboard'] ?? null,
        'icon-hud-score' => $icons['score'] ?? null,
        'icon-hud-level' => $icons['level'] ?? null,
        'icon-hud-lives' => $icons['lives'] ?? null,
        'icon-swipe' => $icons['swipe'] ?? null,
    ];
    foreach ($iconMap as $id => $value) {
        if ($value) {
            $html = preg_replace(
                '/(<span\s+id="' . preg_quote($id, '/') . '">)[^<]*(<\/span>)/',
                '$1' . $e($value) . '$2',
                $html
            );
        }
    }
}

// Output
header('Content-Type: text/html; charset=UTF-8');
echo $html;
