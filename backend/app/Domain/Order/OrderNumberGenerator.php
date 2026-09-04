<?php

namespace App\Domain\Order;

use App\Models\Order;

/**
 * 注文番号の採番。形式: EC-YYYYMMDD-NNNN（当日内の連番、4桁ゼロ埋め）。
 *
 * 呼び出し元（CreateOrder Action）の DB トランザクション内で使う想定。
 * 当日の最終番号を lockForUpdate で読んでから +1 するため、既に当日の注文が
 * 1件以上ある状態での同時実行には強いが、「その日の最初の1件目」が完全に同時に
 * 来た場合はごく僅かな競合の余地が残る（その場合は orders.order_number の
 * UNIQUE 制約で DB が重複を弾く）。R2 の想定規模ではこれで十分と判断している。
 */
final class OrderNumberGenerator
{
    public function generate(): string
    {
        $prefix = 'EC-'.now()->format('Ymd').'-';

        $lastNumber = Order::where('order_number', 'like', $prefix.'%')
            ->lockForUpdate()
            ->orderByDesc('order_number')
            ->value('order_number');

        $nextSequence = $lastNumber
            ? ((int) substr($lastNumber, -4)) + 1
            : 1;

        return $prefix.str_pad((string) $nextSequence, 4, '0', STR_PAD_LEFT);
    }
}
