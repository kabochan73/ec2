<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\StockStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\OrderListResource;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * ダッシュボード集計（docs/05-admin.md）。
     * low_stock_count / sold_out_count は商品単位（全 variant 合算の在庫）で数える
     * （ProductSummaryResource の stock_status と同じ考え方。docs/02 の在庫ステータス表）。
     *
     * 売上（revenue）は出さない。R2 は決済を扱わず「注文＝支払い済み」でもないため、
     * total を足しても意味のある数字にならない（キャンセル・未払いが混ざる）。R3 で Stripe 導入後に検討。
     */
    public function stats(): JsonResponse
    {
        $ordersCount = Order::count();

        $stockStatuses = Product::withSum('variants', 'stock')
            ->get()
            ->map(fn (Product $product) => StockStatus::fromStock((int) ($product->variants_sum_stock ?? 0)));

        $recentOrders = Order::with('user')
            ->withCount('items')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(5)
            ->get();

        return response()->json([
            'data' => [
                'orders_count' => $ordersCount,
                'low_stock_count' => $stockStatuses->filter(fn (StockStatus $s) => $s === StockStatus::Low)->count(),
                'sold_out_count' => $stockStatuses->filter(fn (StockStatus $s) => $s === StockStatus::SoldOut)->count(),
                'recent_orders' => OrderListResource::collection($recentOrders),
            ],
        ]);
    }
}
