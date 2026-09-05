<?php

namespace App\Actions\Admin\Category;

use App\Models\Category;

final class UpdateCategory
{
    /**
     * @param  array<string, mixed>  $attributes  UpdateCategoryRequest::validated() をそのまま渡す想定
     */
    public function execute(Category $category, array $attributes): Category
    {
        $category->update($attributes);

        return $category;
    }
}
