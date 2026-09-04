<?php

namespace App\Http\Resources;

use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ProductImage
 */
class ProductImageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            // path（バケットのオブジェクトキー）から配信用 URL を組み立てる。
            // 実体は Next.js の /media プロキシが返す（docs/05-admin.md）
            'url' => '/media/'.$this->path,
            'alt' => $this->alt,
            'position' => $this->position,
        ];
    }
}
