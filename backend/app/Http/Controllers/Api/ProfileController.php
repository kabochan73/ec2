<?php

namespace App\Http\Controllers\Api;

use App\Actions\Auth\UpdatePassword;
use App\Actions\Auth\UpdateProfile;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\UpdatePasswordRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ProfileController extends Controller
{
    /**
     * ログイン中ユーザー自身の情報（GET /api/me）。
     * BFF 側が role を見て /admin の出し分けなどに使う。
     */
    public function show(Request $request): UserResource
    {
        return UserResource::make($request->user());
    }

    /**
     * 氏名・メールアドレスを更新する（PUT /api/me）。
     */
    public function update(UpdateProfileRequest $request, UpdateProfile $action): UserResource
    {
        $user = $action->execute(
            user: $request->user(),
            name: $request->string('name')->toString(),
            email: $request->string('email')->toString(),
        );

        return UserResource::make($user);
    }

    /**
     * パスワードを変更する（PUT /api/me/password）。
     */
    public function updatePassword(UpdatePasswordRequest $request, UpdatePassword $action): Response
    {
        $action->execute(
            user: $request->user(),
            password: $request->string('password')->toString(),
        );

        return response()->noContent();
    }
}
