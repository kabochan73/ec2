<?php

namespace App\Actions\Admin\ProductImage;

use App\Models\ProductImage;
use Illuminate\Support\Facades\DB;

final class ReorderProductImages
{
    /**
     * @param  list<int>  $orderedIds  表示させたい順に並んだ画像 id（対象商品の全画像）
     */
    public function execute(array $orderedIds): void
    {
        DB::transaction(function () use ($orderedIds) {
            foreach ($orderedIds as $position => $id) {
                ProductImage::whereKey($id)->update(['position' => $position]);
            }
        });
    }
}
