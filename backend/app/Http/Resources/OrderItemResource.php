<?php

namespace App\Http\Resources;

use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin OrderItem
 */
class OrderItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'product_name' => $this->product_name,
            'variant_size' => $this->variant_size,
            'variant_color' => $this->variant_color,
            // image_url は注文時点でフルパス（/media/...）のまま DB に保存済みなのでそのまま返す
            // （product_images.path と違い、'/media/' を組み立て直さない）
            'image_url' => $this->image_url,
            'unit_price' => $this->unit_price,
            'quantity' => $this->quantity,
            'line_total' => $this->line_total,
        ];
    }
}
