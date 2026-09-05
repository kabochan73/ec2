<?php

namespace App\Http\Controllers\Api\Admin;

use App\Actions\Admin\Product\CreateProduct;
use App\Actions\Admin\Product\DeleteProduct;
use App\Actions\Admin\Product\UpdateProduct;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Product\StoreProductRequest;
use App\Http\Requests\Admin\Product\UpdateProductRequest;
use App\Http\Resources\Admin\ProductListResource;
use App\Http\Resources\Admin\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ProductController extends Controller
{
    private const PER_PAGE = 20;

    /**
     * 一覧。公開側と違い is_published に関わらず全件対象。
     * クエリ: q（name の部分一致）/ category（カテゴリ slug）/ page
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Product::with('category')->orderBy('position');

        if ($q = $request->string('q')->toString()) {
            $query->where('name', 'like', "%{$q}%");
        }

        if ($category = $request->string('category')->toString()) {
            $query->whereRelation('category', 'slug', $category);
        }

        return ProductListResource::collection($query->paginate(self::PER_PAGE));
    }

    public function store(StoreProductRequest $request, CreateProduct $action): JsonResponse
    {
        $product = $action->execute($request->validated());

        return ProductResource::make($product)
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * 編集用フル情報。画像・バリアントも一緒に返す（読み取り専用。実際の変更は別エンドポイント）。
     */
    public function show(Product $product): ProductResource
    {
        $product->load([
            'images' => fn ($q) => $q->orderBy('position'),
            'variants' => fn ($q) => $q->orderBy('position'),
        ]);

        return ProductResource::make($product);
    }

    public function update(UpdateProductRequest $request, Product $product, UpdateProduct $action): ProductResource
    {
        $product = $action->execute($product, $request->validated());

        return ProductResource::make($product);
    }

    public function destroy(Product $product, DeleteProduct $action): Response
    {
        $action->execute($product);

        return response()->noContent();
    }
}
