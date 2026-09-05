<?php

namespace App\Http\Controllers\Api\Admin;

use App\Actions\Admin\Variant\CreateVariant;
use App\Actions\Admin\Variant\DeleteVariant;
use App\Actions\Admin\Variant\UpdateVariant;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Variant\StoreVariantRequest;
use App\Http\Requests\Admin\Variant\UpdateVariantRequest;
use App\Http\Resources\Admin\ProductVariantResource;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class VariantController extends Controller
{
    public function store(StoreVariantRequest $request, Product $product, CreateVariant $action): JsonResponse
    {
        $variant = $action->execute($product, $request->validated());

        return ProductVariantResource::make($variant)
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(UpdateVariantRequest $request, ProductVariant $variant, UpdateVariant $action): ProductVariantResource
    {
        $variant = $action->execute($variant, $request->validated());

        return ProductVariantResource::make($variant);
    }

    public function destroy(ProductVariant $variant, DeleteVariant $action): Response
    {
        $action->execute($variant);

        return response()->noContent();
    }
}
