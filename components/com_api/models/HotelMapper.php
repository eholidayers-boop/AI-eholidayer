<?php
defined('_ELXIS') or die;

require_once __DIR__ . '/../../com_reservations/includes/mappers.php';

class HotelMapper {
    public static function mapHotel(array $row): array {
        return [
            'id' => (string)$row['id'],
            'slug' => $row['slug'] ?? '',
            'name' => $row['name'] ?? '',
            'destination' => [
                'id' => (string)($row['destination_id'] ?? ''),
                'name' => $row['destination_name'] ?? '',
                'country' => $row['country'] ?? ''
            ],
            'category' => (int)($row['category'] ?? 0),
            'rating' => (float)($row['rating'] ?? 0),
            'reviewCount' => (int)($row['review_count'] ?? 0),
            'priceFrom' => [
                'amount' => (float)($row['price_from'] ?? 0),
                'currency' => $row['currency'] ?? 'USD'
            ],
            'thumbnail' => $row['thumbnail'] ?? '',
            'amenities' => $row['amenities'] ?? [],
            'beachDistance' => isset($row['beach_distance']) ? (int)$row['beach_distance'] : null
        ];
    }
}
