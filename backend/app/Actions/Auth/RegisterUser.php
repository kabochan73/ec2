<?php

namespace App\Actions\Auth;

use App\Models\User;

/**
 * 会員登録。ユーザーを作成し、以後の API 呼び出しに使う Sanctum トークンを発行する。
 */
final class RegisterUser
{
    /**
     * @return array{user: User, token: string}
     */
    public function execute(string $name, string $email, string $password): array
    {
        $user = User::create([
            'name' => $name,
            'email' => $email,
            // password キャストが 'hashed' なので、平文を渡せば自動でハッシュ化される
            'password' => $password,
            // role は渡さない → DB デフォルトの 'customer'（管理者は Seeder で作成）
        ]);

        $token = $user->createToken('api')->plainTextToken;

        return ['user' => $user, 'token' => $token];
    }
}
