<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductVariant>
 *
 * 1商品に複数 variant を作るときは size が衝突しないよう ->sequence() で明示すること
 * （UNIQUE(product_id, size, color)＋color NULL 用の部分 UNIQUE インデックスがあるため、
 *   ->count(3) だけだと同じ size を引いて UniqueConstraintViolation になる）:
 *
 *   ProductVariant::factory()->count(3)->sequence(
 *       ['size' => 'S', 'position' => 0],
 *       ['size' => 'M', 'position' => 1],
 *       ['size' => 'L', 'position' => 2],
 *   )
 */
class ProductVariantFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // S→M→L の順で position を振る（docs/02 の並び順）
        $sizes = ['S' => 0, 'M' => 1, 'L' => 2];
        $size = fake()->randomElement(array_keys($sizes));

        return [
            'product_id' => Product::factory(),
            'size' => $size,
            // 色展開しない商品がデフォルト（null）。色違いは state かオーバーライドで指定
            'color' => null,
            'sku' => 'EC-VAR-'.fake()->unique()->numberBetween(100000, 999999),
            'stock' => fake()->numberBetween(0, 20),
            'position' => $sizes[$size],
        ];
    }

    /**
     * 在庫ステータス = SOLD OUT（stock = 0）。
     */
    public function soldOut(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock' => 0,
        ]);
    }

    /**
     * 在庫ステータス = 残りわずか（1〜3、docs/02 の LOW_STOCK_THRESHOLD）。
     */
    public function lowStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock' => fake()->numberBetween(1, 3),
        ]);
    }

    /**
     * 在庫ステータス = 在庫あり（4以上）。
     */
    public function inStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock' => fake()->numberBetween(4, 50),
        ]);
    }
}
