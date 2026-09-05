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
            // 公開側では未使用だが、管理画面の画像削除・並べ替え（対象 image を特定する）で要る
            'id' => $this->id,
            // path（バケットのオブジェクトキー）から配信用 URL を組み立てる。
            // 実体は Next.js の /media プロキシが返す（docs/05-admin.md）
            'url' => '/media/'.$this->path,
            'alt' => $this->alt,
            'position' => $this->position,
        ];
    }
}
