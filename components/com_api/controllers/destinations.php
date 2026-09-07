<?php
defined('_ELXIS') or die;

function api_destinations_GET() {
    $db = elxisDatabase::getInstance();
    $rows = $db->loadAssocList('SELECT id, name, country FROM elx_destinations ORDER BY name ASC');
    $out = array_map(function($r) {
        return [
            'id' => (string)$r['id'],
            'name' => $r['name'],
            'country' => $r['country']
        ];
    }, $rows);
    echo json_encode(['destinations' => $out]);
}
