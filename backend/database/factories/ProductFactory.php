<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            // category_id を渡さずに使うと自動で新しい Category を1件作る
            'category_id' => Category::factory(),
            'name' => ucfirst($name),
            'slug' => Str::slug($name).'-'.fake()->unique()->numberBetween(1000, 999999),
            // ¥3,000〜¥30,000、1,000円単位
            'price' => fake()->numberBetween(3, 30) * 1000,
            'description' => fake()->paragraph(),
            'material' => '本体 綿100%',
            'care' => fake()->optional()->sentence(),
            'origin' => '中国',
            'product_code' => 'EC-'.strtoupper(fake()->bothify('??####')),
            // カテゴリごとに測定項目が違うため、テストでは基本 null（必要なテストで個別に上書き）
            'size_chart' => null,
            'is_published' => true,
            'position' => fake()->numberBetween(1, 100),
        ];
    }

    /**
     * 非公開商品（一覧・詳細・API から除外される）。
     */
    public function unpublished(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_published' => false,
        ]);
    }
}
