<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * 注文明細の在庫が足りない場合に投げる（docs/02 の注文作成トランザクション手順3）。
 * 呼び出し元（CreateOrder）は DB トランザクション内で投げるので、
 * この Exception が飛んだ時点でトランザクションはロールバックされる。
 */
class InsufficientStockException extends Exception
{
    /**
     * @param  list<array{variant_id: int, available: int}>  $shortages
     */
    public function __construct(public readonly array $shortages)
    {
        parent::__construct('Insufficient stock for one or more items.');
    }

    /**
     * docs/03-api.md のレスポンス形に合わせる:
     * { "message", "errors": { "items": [...] }, "unavailable": [ { "variant_id", "available" } ] }
     */
    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'message' => '在庫が不足している商品があります。',
            'errors' => [
                'items' => ['在庫が不足している商品があります。'],
            ],
            'unavailable' => $this->shortages,
        ], 422);
    }
}
