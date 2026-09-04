<?php

namespace App\Http\Resources;

use App\Enums\StockStatus;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * 商品一覧（GET /api/products）と、商品詳細の related で使う要約形式。
 * カード表示に必要な項目のみ（説明文・素材・variant 個々の情報などは含まない）。
 *
 * @mixin Product
 */
class ProductSummaryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // withSum('variants', 'stock') で付く合算値。variant 0件のときは null なので ?? 0
        $totalStock = (int) ($this->variants_sum_stock ?? 0);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'price' => $this->price,
            'category' => [
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ],
            // 全 variant 合算の在庫数で判定する（個々の variant ではなく商品全体の状態）
            'stock_status' => StockStatus::fromStock($totalStock)->value,
            'is_new' => $this->created_at->greaterThanOrEqualTo(
                now()->subDays(config('shop.new_product_days'))
            ),
            'images' => ProductImageResource::collection($this->whenLoaded('images')),
        ];
    }
}
