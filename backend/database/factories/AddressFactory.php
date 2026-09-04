<?php

namespace Database\Factories;

use App\Models\Address;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Address>
 */
class AddressFactory extends Factory
{
    /**
     * プロジェクトのデフォルト faker locale は en_US（config/app.php）で、
     * 都道府県のような日本固有の値は生成できないため、固定リストから選ぶ。
     *
     * @var list<string>
     */
    private const PREFECTURES = ['東京都', '大阪府', '神奈川県', '愛知県', '福岡県'];

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'recipient_name' => fake()->name(),
            'postal_code' => fake()->numerify('###-####'),
            'prefecture' => fake()->randomElement(self::PREFECTURES),
            'city' => fake()->city(),
            'address_line1' => fake()->numerify('#-#-#'),
            'address_line2' => fake()->optional()->secondaryAddress(),
            'phone' => fake()->numerify('090-####-####'),
            'is_default' => false,
        ];
    }

    /**
     * そのユーザーのデフォルト住所として作る。
     */
    public function default(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_default' => true,
        ]);
    }
}
