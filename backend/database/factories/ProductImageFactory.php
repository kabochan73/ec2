<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<ProductImage>
 */
class ProductImageFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            // 実際のバケットのオブジェクトキーを模した適当なパス（テストでは実ファイルは存在しない）
            'path' => 'products/'.fake()->numberBetween(1, 999).'/'.Str::uuid().'.jpg',
            'alt' => fake()->sentence(3),
            'position' => 0,
        ];
    }
}
