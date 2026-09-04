<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * 開発用の管理者アカウントを作成する。
     * updateOrCreate なので `db:seed` を何度実行しても重複せず、値の更新にも使える。
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'test',
                // User::casts() で password は 'hashed' なので、平文を渡せば自動でハッシュ化される
                'password' => 'Takumi7355',
                'role' => UserRole::Admin,
                'email_verified_at' => now(),
            ]
        );
    }
}
