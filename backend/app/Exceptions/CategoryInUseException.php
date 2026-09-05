<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * 所属商品が1件以上あるカテゴリを削除しようとした場合に投げる
 * （products.category_id は RESTRICT なので DB も防いでくれるが、
 * QueryException のパースに頼らず事前チェックしてわかりやすいレスポンスにする）。
 */
class CategoryInUseException extends Exception
{
    public function __construct(public readonly int $productCount)
    {
        parent::__construct('Category has products and cannot be deleted.');
    }

    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'message' => "このカテゴリには商品が{$this->productCount}件あるため削除できません。",
        ], 409);
    }
}
