<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * カテゴリ初期4件（docs/02-database-design.md）。
     *
     * 当初は「/admin のカテゴリ管理から手動で作る」方針だったが、商品 Seeder が
     * category を必須とするため Seeder で作ることにした（2026-09-04 方針変更）。
     * admin のカテゴリ管理は「この4件を編集・並べ替え・5件目を追加」で動作確認する。
     *
     * slug をキーに updateOrCreate なので `db:seed` を何度流しても重複しない。
     */
    public function run(): void
    {
        $categories = [
            ['slug' => 'tops', 'name' => 'Tops', 'position' => 1],
            ['slug' => 'bottoms', 'name' => 'Bottoms', 'position' => 2],
            ['slug' => 'outerwear', 'name' => 'Outerwear', 'position' => 3],
            ['slug' => 'accessories', 'name' => 'Accessories', 'position' => 4],
        ];

        foreach ($categories as $category) {
            Category::updateOrCreate(
                ['slug' => $category['slug']],
                ['name' => $category['name'], 'position' => $category['position']],
            );
        }
    }
}
