<?php

namespace App\Http\Resources\Admin;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * GET /api/admin/customers。閲覧のみ（docs/05-admin.md）。
 *
 * @mixin User
 */
class CustomerResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            // withCount('orders') で付く orders_count
            'orders_count' => $this->orders_count,
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
