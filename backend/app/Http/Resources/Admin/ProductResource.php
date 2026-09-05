<?php

namespace App\Http\Resources\Admin;

use App\Http\Resources\ProductImageResource;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * GET/POST/PUT /api/admin/products(/{id})。編集フォーム用のフル情報。
 * images / variants は読み取り専用としてここに含める（実際の追加・削除・並べ替えは
 * 別エンドポイント。docs/05-admin.md の「商品編集ページの構成」）。
 *
 * @mixin Product
 */
class ProductResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'price' => $this->price,
            'description' => $this->description,
            'material' => $this->material,
            'care' => $this->care,
            'origin' => $this->origin,
            'product_code' => $this->product_code,
            'size_chart' => $this->size_chart,
            'is_published' => $this->is_published,
            'position' => $this->position,
            'images' => ProductImageResource::collection($this->whenLoaded('images')),
            'variants' => ProductVariantResource::collection($this->whenLoaded('variants')),
        ];
    }
}
