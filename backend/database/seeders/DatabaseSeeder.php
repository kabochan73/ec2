<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * 今は管理者アカウントのみ。
     * - ダミー顧客は各自が手動投入（tinker / 管理画面）
     * - categories は /admin のカテゴリ管理から作る方針なので Seeder を作らない
     * - 商品シードは別途（画像なし・フロントで NO IMAGE 表示）
     */
    public function run(): void
    {
        $this->call(AdminUserSeeder::class);
    }
}
