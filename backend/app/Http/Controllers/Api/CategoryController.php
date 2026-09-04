<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CategoryController extends Controller
{
    /**
     * カテゴリ一覧（公開）。表示順（position）で返す。
     */
    public function index(): AnonymousResourceCollection
    {
        return CategoryResource::collection(Category::orderBy('position')->get());
    }
}
