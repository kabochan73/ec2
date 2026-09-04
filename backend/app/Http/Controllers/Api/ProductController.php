<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductSummaryResource;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    /**
     * 商品一覧（公開）。is_published = true のみ。
     * クエリ: category（カテゴリ slug）/ new（true で新着30日以内・新着順）/ limit（件数上限）
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Product::published()
            // 一覧カードは主画像・ホバー画像（position 0, 1）だけで十分なので2件に絞る
            ->with(['category', 'images' => fn ($q) => $q->orderBy('position')->limit(2)])
            // 在庫ステータスは全 variant 合算で決まるので、合計値だけ取る
            ->withSum('variants', 'stock');

        if ($category = $request->string('category')->toString()) {
            $query->whereRelation('category', 'slug', $category);
        }

        if ($request->boolean('new')) {
            $query->where('created_at', '>=', now()->subDays(config('shop.new_product_days')))
                ->orderByDesc('created_at');
        } else {
            $query->orderBy('position');
        }

        if ($limit = $request->integer('limit')) {
            $query->limit($limit);
        }

        return ProductSummaryResource::collection($query->get());
    }
}
