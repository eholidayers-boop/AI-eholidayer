<?php
defined('_ELXIS') or die;

require_once __DIR__ . '/HotelMapper.php';

class HotelDetailMapper {
    public static function mapDetail(array $row, array $photos, array $rooms, array $reviews, array $policies): array {
        $base = HotelMapper::mapHotel($row);
        return array_merge($base, [
            'description' => strip_tags($row['description'] ?? ''),
            'photos' => $photos,
            'rooms' => $rooms,
            'reviews' => [
                'rating' => (float)($row['rating'] ?? 0),
                'count' => (int)($row['review_count'] ?? 0),
                'recent' => $reviews
            ],
            'location' => [
                'lat' => (float)($row['lat'] ?? 0),
                'lng' => (float)($row['lng'] ?? 0),
                'address' => $row['address'] ?? ''
            ],
            'policies' => $policies
        ]);
    }
}
