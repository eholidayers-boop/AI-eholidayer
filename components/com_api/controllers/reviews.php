<?php
defined('_ELXIS') or die;

function api_reviews_GET() {
    $db = elxisDatabase::getInstance();
    $q = $_GET;
    $where = ['1=1'];
    $params = [];
    if (!empty($q['hotelId'])) { $where[] = 'r.hotel_id = ?'; $params[] = (int)$q['hotelId']; }
    if (!empty($q['destination'])) { $where[] = 'h.destination_id = ?'; $params[] = (int)$q['destination']; }
    if (!empty($q['minRating'])) { $where[] = 'r.rating >= ?'; $params[] = (int)$q['minRating']; }
    $page = max(1, (int)($q['page'] ?? 1));
    $pageSize = 20;
    $offset = ($page - 1) * $pageSize;
    $rows = $db->loadAssocList(
        'SELECT r.id, r.rating, r.title, r.body, r.author, r.created_at
        FROM elx_res_reviews r JOIN elx_res_hotels h ON h.id = r.hotel_id
        WHERE ' . implode(' AND ', $where) . '
        ORDER BY r.created_at DESC LIMIT ? OFFSET ?',
        array_merge($params, [$pageSize, $offset])
    );
    $out = array_map(fn($r) => [
        'id' => (string)$r['id'],
        'rating' => (int)$r['rating'],
        'title' => $r['title'],
        'body' => strip_tags($r['body'] ?? ''),
        'author' => $r['author'],
        'createdAt' => $r['created_at']
    ], $rows);
    echo json_encode(['reviews' => $out]);
}
