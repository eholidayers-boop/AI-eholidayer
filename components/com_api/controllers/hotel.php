<?php
defined('_ELXIS') or die;

require_once __DIR__ . '/../models/HotelDetailMapper.php';

function api_hotel_GET($id) {
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'missing_id']); return; }
    $db = elxisDatabase::getInstance();
    $row = $db->loadAssocRow(
        'SELECT h.*, d.name AS destination_name, d.country
         FROM elx_res_hotels h
         JOIN elx_destinations d ON d.id = h.destination_id
         WHERE h.id = ?', [(int)$id]
    );
    if (!$row) { http_response_code(404); echo json_encode(['error' => 'not_found']); return; }

    $photos = array_map(fn($r) => $r['url'], $db->loadAssocList(
        'SELECT url FROM elx_res_hotel_photos WHERE hotel_id = ? ORDER BY sort_order ASC', [(int)$id]
    ));
    $rooms = array_map([RoomMapper::class, 'map'], $db->loadAssocList(
        'SELECT * FROM elx_res_rooms WHERE hotel_id = ?', [(int)$id]
    ));
    $reviews = $db->loadAssocList(
        'SELECT id, rating, title, body, author, created_at FROM elx_res_reviews WHERE hotel_id = ? ORDER BY created_at DESC LIMIT 10',
        [(int)$id]
    );
    $policies = [
        'cancellation' => $row['cancellation_policy'] ?? '',
        'checkIn' => $row['check_in_time'] ?? '14:00',
        'checkOut' => $row['check_out_time'] ?? '12:00'
    ];

    echo json_encode(['hotel' => HotelDetailMapper::mapDetail($row, $photos, $rooms, $reviews, $policies)]);
}
