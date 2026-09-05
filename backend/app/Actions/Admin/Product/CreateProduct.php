<?php

namespace App\Actions\Admin\Product;

use App\Models\Product;

final class CreateProduct
{
    /**
     * @param  array<string, mixed>  $attributes  StoreProductRequest::validated() をそのまま渡す想定
     */
    public function execute(array $attributes): Product
    {
        return Product::create($attributes);
    }
}
