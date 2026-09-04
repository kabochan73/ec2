<?php

namespace Database\Factories;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    /**
     * @var list<string>
     */
    private const PREFECTURES = ['東京都', '大阪府', '神奈川県', '愛知県', '福岡県'];

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // ¥3,000〜¥50,000（100円単位）。送料ルール（¥20,000以上で無料）と整合させて計算する
        $subtotal = fake()->numberBetween(30, 500) * 100;
        $shippingFee = $subtotal >= config('shop.free_shipping_threshold') ? 0 : config('shop.shipping_fee');

        return [
            'user_id' => User::factory(),
            // 本番の採番（OrderNumberGenerator）とは別に、テスト用の一意な値を生成
            'order_number' => 'EC-'.now()->format('Ymd').'-'.fake()->unique()->numberBetween(1000, 9999),
            'status' => OrderStatus::Pending,
            'subtotal' => $subtotal,
            'shipping_fee' => $shippingFee,
            'total' => $subtotal + $shippingFee,
            // 配送先スナップショット（注文作成時点の住所をコピーした想定のダミー値）
            'ship_recipient_name' => fake()->name(),
            'ship_postal_code' => fake()->numerify('###-####'),
            'ship_prefecture' => fake()->randomElement(self::PREFECTURES),
            'ship_city' => fake()->city(),
            'ship_address_line1' => fake()->numerify('#-#-#'),
            'ship_address_line2' => fake()->optional()->secondaryAddress(),
            'ship_phone' => fake()->numerify('090-####-####'),
        ];
    }

    /**
     * キャンセル済み注文。
     */
    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => OrderStatus::Cancelled,
        ]);
    }
}
