<?php

namespace App\Actions\Admin\Category;

use App\Models\Category;

final class CreateCategory
{
    /**
     * @param  array<string, mixed>  $attributes  StoreCategoryRequest::validated() をそのまま渡す想定
     */
    public function execute(array $attributes): Category
    {
        return Category::create($attributes);
    }
}
