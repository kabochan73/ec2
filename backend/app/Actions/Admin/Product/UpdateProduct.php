<?php

namespace App\Actions\Admin\Product;

use App\Models\Product;

final class UpdateProduct
{
    /**
     * @param  array<string, mixed>  $attributes  UpdateProductRequest::validated() をそのまま渡す想定
     */
    public function execute(Product $product, array $attributes): Product
    {
        $product->update($attributes);

        return $product;
    }
}
