<?php

namespace App\Actions\Admin\Order;

use App\Enums\OrderStatus;
use App\Exceptions\InsufficientStockException;
use App\Models\Order;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;

/**
 * 注文ステータス変更（docs/05-admin.md）。R2 は pending ⇄ cancelled のみ。
 * cancelled にする → 在庫を戻す。cancelled から pending に戻す → 在庫を再度引き当てる
 * （在庫が足りなければ CreateOrder と同じ InsufficientStockException で 422）。
 */
final class UpdateOrderStatus
{
    public function execute(Order $order, OrderStatus $newStatus): Order
    {
        if ($order->status === $newStatus) {
            return $order;
        }

        return DB::transaction(function () use ($order, $newStatus) {
            $order->load('items');

            if ($newStatus === OrderStatus::Cancelled) {
                $this->restoreStock($order);
            } elseif ($order->status === OrderStatus::Cancelled && $newStatus === OrderStatus::Pending) {
                $this->reserveStock($order);
            }

            $order->update(['status' => $newStatus]);

            return $order;
        });
    }

    private function restoreStock(Order $order): void
    {
        foreach ($order->items as $item) {
            if ($item->product_variant_id !== null) {
                ProductVariant::whereKey($item->product_variant_id)->increment('stock', $item->quantity);
            }
        }
    }

    private function reserveStock(Order $order): void
    {
        $variantIds = $order->items->pluck('product_variant_id')->filter()->all();

        $variants = ProductVariant::whereIn('id', $variantIds)
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        $shortages = [];
        foreach ($order->items as $item) {
            if ($item->product_variant_id === null) {
                continue;
            }
            $variant = $variants->get($item->product_variant_id);
            if ($variant->stock < $item->quantity) {
                $shortages[] = ['variant_id' => $variant->id, 'available' => $variant->stock];
            }
        }
        if ($shortages !== []) {
            throw new InsufficientStockException($shortages);
        }

        foreach ($order->items as $item) {
            if ($item->product_variant_id !== null) {
                $variants->get($item->product_variant_id)->decrement('stock', $item->quantity);
            }
        }
    }
}
