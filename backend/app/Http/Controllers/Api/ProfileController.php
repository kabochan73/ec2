<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;

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

    // update / updatePassword は Step 12b で追加
}
