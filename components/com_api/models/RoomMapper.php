<?php
defined('_ELXIS') or die;

class RoomMapper {
    public static function map(array $r): array {
        return [
            'id' => (string)$r['id'],
            'name' => $r['name'] ?? '',
            'capacity' => [
                'adults' => (int)($r['adults'] ?? 2),
                'children' => (int)($r['children'] ?? 0)
            ],
            'boardType' => $r['board_type'] ?? 'room_only',
            'refundable' => (bool)($r['refundable'] ?? false),
            'cancellationDeadline' => $r['cancellation_deadline'] ?? null,
            'price' => [
                'amount' => (float)($r['price'] ?? 0),
                'currency' => $r['currency'] ?? 'USD'
            ]
        ];
    }
}
