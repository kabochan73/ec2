<?php

namespace App\Http\Resources\Admin;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * GET /api/admin/products（一覧テーブル用）。公開側と違い is_published に関わらず全件、
 * 編集フォームで使う description 等の重い列は含めない。
 *
 * @mixin Product
 */
class ProductListResource extends JsonResource
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
                'id' => $this->category->id,
                'name' => $this->category->name,
            ],
            'is_published' => $this->is_published,
            'position' => $this->position,
        ];
    }
}
