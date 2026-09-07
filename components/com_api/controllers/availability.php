<?php
defined('_ELXIS') or die;

function api_availability_GET() {
    $db = elxisDatabase::getInstance();
    $q = $_GET;
    if (empty($q['destination']) || empty($q['checkIn']) || empty($q['checkOut'])) {
        http_response_code(400);
        echo json_encode(['error' => 'missing_params']);
        return;
    }
    $rows = $db->loadAssocList(
        'SELECT h.id, h.name, MIN(r.price) AS min_price, r.currency
         FROM elx_res_hotels h
         JOIN elx_res_rooms r ON r.hotel_id = h.id
         WHERE h.destination_id = ? AND r.available_from <= ? AND r.available_to >= ?
         GROUP BY h.id, h.name, r.currency
         ORDER BY min_price ASC LIMIT 50',
        [(int)$q['destination'], $q['checkIn'], $q['checkOut']]
    );
    $out = array_map(fn($r) => [
        'hotelId' => (string)$r['id'],
        'name' => $r['name'],
        'minPrice' => ['amount' => (float)$r['min_price'], 'currency' => $r['currency']]
    ], $rows);
    echo json_encode(['hotels' => $out]);
}
