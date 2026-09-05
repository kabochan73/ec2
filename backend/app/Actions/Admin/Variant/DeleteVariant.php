<?php

namespace App\Actions\Admin\Variant;

use App\Models\ProductVariant;

/**
 * variant の削除。過去の注文明細はスナップショット列を持つため影響を受けない
 * （order_items.product_variant_id は SET NULL。docs/05-admin.md）。
 * 注文で参照済みでも削除自体は妨げない（在庫を 0 にするだけで足りるケースが多いのは
 * 管理画面 UI 側の運用上の推奨であって、API としては禁止しない）。
 */
final class DeleteVariant
{
    public function execute(ProductVariant $variant): void
    {
        $variant->delete();
    }
}
