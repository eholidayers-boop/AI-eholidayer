<?php
defined('_ELXIS') or die;

require_once __DIR__ . '/../models/RoomMapper.php';

function api_rooms_GET($id) {
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'missing_id']); return; }
    $db = elxisDatabase::getInstance();
    $rows = $db->loadAssocList('SELECT * FROM elx_res_rooms WHERE hotel_id = ?', [(int)$id]);
    echo json_encode(['rooms' => array_map([RoomMapper::class, 'map'], $rows)]);
}
