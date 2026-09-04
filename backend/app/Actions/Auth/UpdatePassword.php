<?php

namespace App\Actions\Auth;

use App\Models\User;

/**
 * パスワード変更。現在のパスワードとの一致確認は FormRequest 側
 * （current_password:sanctum ルール）で済んでいるので、ここでは更新のみ。
 */
final class UpdatePassword
{
    public function execute(User $user, string $password): void
    {
        $user->update([
            // password キャストが 'hashed' なので、平文を渡せば自動でハッシュ化される
            'password' => $password,
        ]);
    }
}
