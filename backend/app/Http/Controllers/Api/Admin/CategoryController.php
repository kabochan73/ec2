<?php

namespace App\Http\Controllers\Api\Admin;

use App\Actions\Admin\Category\CreateCategory;
use App\Actions\Admin\Category\DeleteCategory;
use App\Actions\Admin\Category\ReorderCategories;
use App\Actions\Admin\Category\UpdateCategory;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Category\ReorderCategoriesRequest;
use App\Http\Requests\Admin\Category\StoreCategoryRequest;
use App\Http\Requests\Admin\Category\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class CategoryController extends Controller
{
    /**
     * 一覧。公開側と違い is_published のような絞り込みは無い（カテゴリに公開/非公開の概念が無いため）。
     */
    public function index(): AnonymousResourceCollection
    {
        return CategoryResource::collection(Category::orderBy('position')->get());
    }

    public function store(StoreCategoryRequest $request, CreateCategory $action): JsonResponse
    {
        $category = $action->execute($request->validated());

        return CategoryResource::make($category)
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(UpdateCategoryRequest $request, Category $category, UpdateCategory $action): CategoryResource
    {
        $category = $action->execute($category, $request->validated());

        return CategoryResource::make($category);
    }

    public function destroy(Category $category, DeleteCategory $action): Response
    {
        $action->execute($category);

        return response()->noContent();
    }

    public function reorder(ReorderCategoriesRequest $request, ReorderCategories $action): Response
    {
        $action->execute($request->validated()['order']);

        return response()->noContent();
    }
}
