<?php

namespace App\Actions\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * ログイン。メールアドレスとパスワードを検証し、Sanctum トークンを発行する。
 */
final class AuthenticateUser
{
    /**
     * @return array{user: User, token: string}
     *
     * @throws ValidationException 認証情報が正しくない場合
     */
    public function execute(string $email, string $password): array
    {
        $user = User::where('email', $email)->first();

        // 「メールが存在しない」と「パスワードが違う」を区別しない。
        // 区別すると「このメールアドレスは登録済みか」を外部から探索できてしまうため。
        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['メールアドレスまたはパスワードが正しくありません。'],
            ]);
        }

        $token = $user->createToken('api')->plainTextToken;

        return ['user' => $user, 'token' => $token];
    }
}
