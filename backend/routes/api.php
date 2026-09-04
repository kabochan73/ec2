<?php

use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// ヘルスチェック。API が起きているか＆DB に繋がっているかを1発で確認する用。
Route::get('/health', function () {
    // DB へ実際に接続を試みて、生きているか確かめる
    try {
        DB::connection()->getPdo();
        $db = 'ok';
    } catch (Throwable $e) {
        $db = 'error';
    }

    return response()->json([
        'status' => 'ok',
        'app' => config('app.name'),
        'database' => $db,
        'time' => now()->toIso8601String(),
    ]);
});

// --- 商品閲覧（公開） ---
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/products', [ProductController::class, 'index']);
