<?php

namespace App\Actions\Order;

/**
 * カート明細1行分（variant_id + quantity）。
 */
final readonly class CartLineInput
{
    public function __construct(
        public int $variantId,
        public int $quantity,
    ) {}
}
