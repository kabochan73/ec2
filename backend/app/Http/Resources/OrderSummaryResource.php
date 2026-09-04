<?php

namespace App\Http\Resources;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * 注文一覧（GET /api/orders）用の要約形式（docs/03-api.md）。
 *
 * @mixin Order
 */
class OrderSummaryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'order_number' => $this->order_number,
            'created_at' => $this->created_at->toIso8601String(),
            // withCount('items') で付く items_count を使う（明細を全件ロードしない）
            'item_count' => $this->items_count,
            'total' => $this->total,
            'status' => $this->status->value,
        ];
    }
}
