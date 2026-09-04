<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // 実運用では categories は admin 画面から作る（Seeder では作らない）。
        // この Factory は「テストで適当なカテゴリが1つ要る」場合に使う。
        $name = fake()->unique()->word();

        return [
            'name' => ucfirst($name),
            'slug' => $name,
            'position' => fake()->numberBetween(1, 10),
        ];
    }
}
