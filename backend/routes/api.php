<?php

use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProfileController;
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
// {product:slug} … Product モデルの既定キーは id のまま、このルートだけ slug でバインドする
Route::get('/products/{product:slug}', [ProductController::class, 'show']);

// --- 認証（公開） ---
Route::post('/register', [AuthController::class, 'register']);
// throttle:login … メール＋IP で 5回/分（AppServiceProvider で定義したレートリミッタ）
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

// --- 認証必須 ---
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/me', [ProfileController::class, 'show']);
    Route::put('/me', [ProfileController::class, 'update']);
    Route::put('/me/password', [ProfileController::class, 'updatePassword']);

    // --- 住所録（本人のもののみ。他人の ID は 404） ---
    Route::get('/addresses', [AddressController::class, 'index']);
    Route::post('/addresses', [AddressController::class, 'store']);
    Route::put('/addresses/{address}', [AddressController::class, 'update']);
    Route::delete('/addresses/{address}', [AddressController::class, 'destroy']);
    Route::post('/addresses/{address}/default', [AddressController::class, 'setDefault']);

    // --- 注文（本人のもののみ。他人の注文番号は 404） ---
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{orderNumber}', [OrderController::class, 'show']);
});
