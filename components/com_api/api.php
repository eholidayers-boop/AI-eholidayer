<?php
defined('_ELXIS') or die;

$path = trim(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH), '/');
$parts = explode('/', $path);

// Expect /api/v1/<endpoint>
if (count($parts) < 3 || $parts[0] !== 'api' || $parts[1] !== 'v1') {
    header('HTTP/1.1 404 Not Found');
    echo json_encode(['error' => 'not_found']);
    exit;
}

$endpoint = $parts[2];
$id = $parts[3] ?? null;

// Token token check
$expected = getenv('API_TOKEN') ?: '';
$provided = $_SERVER['HTTP_X_API_TOKEN'] ?? '';
if (!hash_equals($expected, $provided) || $expected === '') {
    header('HTTP/1.1 401 Unauthorized');
    echo json_encode(['error' => 'unauthorized']);
    exit;
}

// CORS allowlist
$allowedOrigins = [
    'https://app.eholidayer.com',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: X-API-Token, Content-Type');
    header('Access-Control-Allow-Credentials: true');
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// Dispatch
$method = $_SERVER['REQUEST_METHOD'];
$controllerFile = __DIR__ . '/controllers/' . $endpoint . '.php';
if (!file_exists($controllerFile)) {
    header('HTTP/1.1 404 Not Found');
    echo json_encode(['error' => 'unknown_endpoint']);
    exit;
}

require_once $controllerFile;
$fn = "api_{$endpoint}_{$method}";
if (!function_exists($fn)) {
    header('HTTP/1.1 405 Method Not Allowed');
    echo json_encode(['error' => 'method_not_allowed']);
    exit;
}

header('Content-Type: application/json');
$fn($id);
