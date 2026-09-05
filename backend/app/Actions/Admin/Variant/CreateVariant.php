<?php

namespace App\Actions\Admin\Variant;

use App\Models\Product;
use App\Models\ProductVariant;

final class CreateVariant
{
    /**
     * @param  array<string, mixed>  $attributes  StoreVariantRequest::validated() をそのまま渡す想定
     */
    public function execute(Product $product, array $attributes): ProductVariant
    {
        // position は末尾に追加（並べ替えの UI は今回作らないので単純に採番するだけ）
        $position = $product->variants()->max('position');

        return $product->variants()->create([
            ...$attributes,
            'position' => $position === null ? 0 : $position + 1,
        ]);
    }
}
