<?php

namespace App\Actions\Auth;

use App\Models\User;

/**
 * プロフィール（氏名・メールアドレス）の更新。
 */
final class UpdateProfile
{
    public function execute(User $user, string $name, string $email): User
    {
        $user->update([
            'name' => $name,
            'email' => $email,
        ]);

        return $user;
    }
}
