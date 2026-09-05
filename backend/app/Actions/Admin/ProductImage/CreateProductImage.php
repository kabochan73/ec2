<?php

namespace App\Actions\Admin\ProductImage;

use App\Models\Product;
use App\Models\ProductImage;
use App\Services\StorageService;
use Illuminate\Http\UploadedFile;

final class CreateProductImage
{
    public function __construct(private readonly StorageService $storage) {}

    public function execute(Product $product, UploadedFile $file, ?string $alt): ProductImage
    {
        $path = $this->storage->storeProductImage($product->id, $file);

        // 新規アップロードは末尾に追加。position 0 が主画像・1 がホバー画像（docs/05-admin.md）
        $position = $product->images()->max('position');

        return $product->images()->create([
            'path' => $path,
            'alt' => $alt,
            'position' => $position === null ? 0 : $position + 1,
        ]);
    }
}
