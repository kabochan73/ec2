<?php

namespace App\Http\Resources;

use App\Enums\StockStatus;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * 商品詳細でのみ使う（一覧では個々の variant までは返さない）。
 * docs/03-api.md のサンプル通り stock の生数値も返す（詳細ページで表示するため）。
 *
 * @mixin ProductVariant
 */
class ProductVariantResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'size' => $this->size,
            'color' => $this->color,
            'stock' => $this->stock,
            'stock_status' => StockStatus::fromStock($this->stock)->value,
        ];
    }
}
