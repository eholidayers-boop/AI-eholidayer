<?php
defined('_ELXIS') or die;

function api_health_GET() {
    $dbUp = 'up';
    try {
        $db = elxisDatabase::getInstance();
        $db->query('SELECT 1');
    } catch (Throwable $e) {
        $dbUp = 'down';
    }
    echo json_encode(['ok' => true, 'version' => '1.0.0', 'db' => $dbUp]);
}
