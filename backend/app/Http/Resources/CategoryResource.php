<?php

namespace App\Http\Resources;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Category
 */
class CategoryResource extends JsonResource
{
    /**
     * 公開 API（docs/03-api.md）・管理 API（docs/05-admin.md）の両方でこのまま使う。
     * position は公開側では単に無視されるだけなので、Resource を分けるほどの差ではない。
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'position' => $this->position,
        ];
    }
}
