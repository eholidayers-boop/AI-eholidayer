<?php
defined('_ELXIS') or die;

require_once __DIR__ . '/../models/HotelMapper.php';

function api_hotels_GET() {
    $db = elxisDatabase::getInstance();
    $q = $_GET;
    $where = ['1=1'];
    $params = [];
    if (!empty($q['destination'])) {
        $where[] = 'h.destination_id = ?';
        $params[] = (int)$q['destination'];
    }
    if (!empty($q['category'])) {
        $where[] = 'h.category = ?';
        $params[] = (int)$q['category'];
    }
    if (!empty($q['minPrice'])) {
        $where[] = 'h.price_from >= ?';
        $params[] = (float)$q['minPrice'];
    }
    if (!empty($q['maxPrice'])) {
        $where[] = 'h.price_from <= ?';
        $params[] = (float)$q['maxPrice'];
    }
    $page = max(1, (int)($q['page'] ?? 1));
    $pageSize = min(50, max(1, (int)($q['pageSize'] ?? 20)));
    $offset = ($page - 1) * $pageSize;

    $sql = 'SELECT h.*, d.name AS destination_name, d.country
            FROM elx_res_hotels h
            JOIN elx_destinations d ON d.id = h.destination_id
            WHERE ' . implode(' AND ', $where) . '
            ORDER BY h.rating DESC
            LIMIT ? OFFSET ?';
    $rows = $db->loadAssocList($sql, array_merge($params, [$pageSize, $offset]));

    $countSql = 'SELECT COUNT(*) AS total FROM elx_res_hotels h WHERE ' . implode(' AND ', $where);
    $total = (int)$db->loadResult($countSql, $params);

    echo json_encode([
        'hotels' => array_map([HotelMapper::class, 'mapHotel'], $rows),
        'total' => $total,
        'page' => $page
    ]);
}
