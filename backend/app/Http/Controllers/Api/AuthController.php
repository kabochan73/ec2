<?php

namespace App\Http\Controllers\Api;

use App\Actions\Auth\AuthenticateUser;
use App\Actions\Auth\RegisterUser;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class AuthController extends Controller
{
    /**
     * 会員登録。作成した user と、以後の認証に使う token を返す。
     */
    public function register(RegisterRequest $request, RegisterUser $action): JsonResponse
    {
        ['user' => $user, 'token' => $token] = $action->execute(
            name: $request->string('name')->toString(),
            email: $request->string('email')->toString(),
            password: $request->string('password')->toString(),
        );

        return UserResource::make($user)
            ->additional(['token' => $token])
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * ログイン。成功したら user と token を返す。
     * 失敗時は AuthenticateUser が ValidationException を投げ、自動的に 422 になる。
     */
    public function login(LoginRequest $request, AuthenticateUser $action): JsonResponse
    {
        ['user' => $user, 'token' => $token] = $action->execute(
            email: $request->string('email')->toString(),
            password: $request->string('password')->toString(),
        );

        return UserResource::make($user)
            ->additional(['token' => $token])
            ->response();
    }

    /**
     * ログアウト。今回のリクエストに使われたトークンだけを失効させる
     * （同じユーザーの他デバイス・他タブのログインは維持される）。
     */
    public function logout(Request $request): Response
    {
        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }
}
