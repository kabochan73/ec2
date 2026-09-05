<?php

namespace App\Http\Resources\Admin;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * GET /api/admin/orders（全ユーザー横断の一覧）。公開側の OrderSummaryResource と違い、
 * どの会員の注文かを識別できるよう customer を含む。
 *
 * @mixin Order
 */
class OrderListResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'order_number' => $this->order_number,
            'created_at' => $this->created_at->toIso8601String(),
            'item_count' => $this->items_count,
            'total' => $this->total,
            'status' => $this->status->value,
            'customer' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ],
        ];
    }
}
