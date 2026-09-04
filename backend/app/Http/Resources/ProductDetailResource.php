<?php

namespace App\Http\Resources;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * 商品詳細（GET /api/products/{slug}）。docs/03-api.md 参照。
 *
 * @mixin Product
 */
class ProductDetailResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'price' => $this->price,
            'category' => [
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ],
            'description' => $this->description,
            'material' => $this->material,
            'care' => $this->care,
            'origin' => $this->origin,
            'product_code' => $this->product_code,
            'size_chart' => $this->size_chart,
            'is_new' => $this->created_at->greaterThanOrEqualTo(
                now()->subDays(config('shop.new_product_days'))
            ),
            'images' => ProductImageResource::collection($this->whenLoaded('images')),
            // 色展開している variant があれば、その色一覧（重複なし）。無ければ空配列
            'colors' => $this->whenLoaded(
                'variants',
                fn () => $this->variants->pluck('color')->filter()->unique()->values()
            ),
            'variants' => ProductVariantResource::collection($this->whenLoaded('variants')),
            // Product に related という本物のリレーションは無く、コントローラ側で
            // setRelation('related', ...) して疑似的にセットしたものを whenLoaded で拾う
            'related' => ProductSummaryResource::collection($this->whenLoaded('related')),
        ];
    }
}
