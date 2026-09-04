<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * 注文明細に is_published=false の商品が含まれる場合に投げる
 * （docs/02 の注文作成トランザクション手順4）。
 */
class UnpublishedProductException extends Exception
{
    /**
     * @param  list<int>  $productIds
     */
    public function __construct(public readonly array $productIds)
    {
        parent::__construct('One or more products are not published.');
    }

    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'message' => '購入できない商品が含まれています。',
            'errors' => [
                'items' => ['購入できない商品が含まれています。'],
            ],
        ], 422);
    }
}
