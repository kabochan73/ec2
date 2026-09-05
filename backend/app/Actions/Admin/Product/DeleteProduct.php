<?php

namespace App\Actions\Admin\Product;

use App\Models\Product;

/**
 * 商品の削除。画像・バリアントは DB 側 CASCADE で一緒に削除される。
 * 過去の注文明細はスナップショット列を持つため影響を受けない
 * （order_items.product_id は SET NULL。docs/05-admin.md）。
 */
final class DeleteProduct
{
    public function execute(Product $product): void
    {
        $product->delete();
    }
}
