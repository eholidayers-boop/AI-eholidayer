<?php
require_once __DIR__ . '/../../models/HotelMapper.php';

class HotelMapperTest extends PHPUnit\Framework\TestCase {
    public function testMapsBasicHotelRow(): void {
        $row = [
            'id' => 42, 'slug' => 'azure-bay', 'name' => 'Azure Bay Resort',
            'destination_id' => 7, 'destination_name' => 'Hurghada', 'country' => 'EG',
            'category' => 5, 'rating' => 9.1, 'review_count' => 124,
            'price_from' => 540, 'currency' => 'USD',
            'thumbnail' => 'https://images.eholidayer.com/42.jpg',
            'amenities' => ['pool', 'spa', 'beach']
        ];
        $h = HotelMapper::mapHotel($row);
        $this->assertSame('42', $h['id']);
        $this->assertSame('Azure Bay Resort', $h['name']);
        $this->assertSame(5, $h['category']);
        $this->assertSame(['pool', 'spa', 'beach'], $h['amenities']);
    }
}
