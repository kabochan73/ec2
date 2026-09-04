<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * - AdminUserSeeder … 管理者アカウント1人
     * - CategorySeeder  … カテゴリ4件（Tops / Bottoms / Outerwear / Accessories）
     * - ProductSeeder   … 開発・レビュー用カタログ（画像なし。ProductSeeder より前に CategorySeeder が必要）
     *
     * ダミー顧客は各自が手動投入する（tinker / 管理画面）。
     */
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
            CategorySeeder::class,
            ProductSeeder::class,
        ]);
    }
}
