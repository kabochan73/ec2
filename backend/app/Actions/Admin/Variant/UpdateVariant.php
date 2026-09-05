<?php

namespace App\Actions\Admin\Variant;

use App\Models\ProductVariant;

final class UpdateVariant
{
    /**
     * @param  array<string, mixed>  $attributes  UpdateVariantRequest::validated() をそのまま渡す想定
     */
    public function execute(ProductVariant $variant, array $attributes): ProductVariant
    {
        $variant->update($attributes);

        return $variant;
    }
}
