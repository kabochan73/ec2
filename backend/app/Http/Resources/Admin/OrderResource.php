<?php

namespace App\Http\Resources\Admin;

use App\Http\Resources\OrderItemResource;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * GET /api/admin/orders/{order_number}。公開側の OrderResource と違い customer を含む。
 *
 * @mixin Order
 */
class OrderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'order_number' => $this->order_number,
            'status' => $this->status->value,
            'subtotal' => $this->subtotal,
            'shipping_fee' => $this->shipping_fee,
            'total' => $this->total,
            'shipping_address' => [
                'recipient_name' => $this->ship_recipient_name,
                'postal_code' => $this->ship_postal_code,
                'prefecture' => $this->ship_prefecture,
                'city' => $this->ship_city,
                'address_line1' => $this->ship_address_line1,
                'address_line2' => $this->ship_address_line2,
                'phone' => $this->ship_phone,
            ],
            'created_at' => $this->created_at->toIso8601String(),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'customer' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ],
        ];
    }
}
