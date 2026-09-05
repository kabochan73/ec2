<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * /api/admin/* の認可。auth:sanctum の後ろに付けて使う（未認証は auth:sanctum 側で 401 済み）。
 * 個々のリソースの所有権チェック（例: 他人の住所は 404）とは違い、ここは
 * 「認証済みだが権限が無い」ことがはっきりしているケースなので素直に 403。
 */
class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->user()?->role === UserRole::Admin, 403);

        return $next($request);
    }
}
