<?php

namespace App\Domain\Order;

/**
 * 送料計算。一律 config('shop.shipping_fee') 円、
 * 小計が config('shop.free_shipping_threshold') 円以上なら無料。
 * Eloquent に依存しない純粋ロジックなので Actions ではなく Domain に置く（docs/06 §3）。
 */
final class ShippingFeeCalculator
{
    public function for(int $subtotal): int
    {
        return $subtotal >= config('shop.free_shipping_threshold')
            ? 0
            : config('shop.shipping_fee');
    }
}
