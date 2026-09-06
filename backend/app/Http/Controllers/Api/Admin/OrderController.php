<?php

namespace App\Http\Controllers\Api\Admin;

use App\Actions\Admin\Order\UpdateOrderStatus;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Order\UpdateOrderStatusRequest;
use App\Http\Resources\Admin\OrderListResource;
use App\Http\Resources\Admin\OrderResource;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrderController extends Controller
{
    private const PER_PAGE = 50;

    /**
     * 全ユーザーの注文一覧（新しい順）。クエリ: status / page
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Order::with('user')
            ->withCount('items')
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        return OrderListResource::collection($query->paginate(self::PER_PAGE));
    }

    /**
     * 注文詳細。本人確認は無く全ユーザーの注文番号を対象にする（公開側 OrderController と違う点）。
     */
    public function show(string $orderNumber): OrderResource
    {
        $order = Order::with(['items', 'user'])
            ->where('order_number', $orderNumber)
            ->firstOrFail();

        return OrderResource::make($order);
    }

    public function updateStatus(
        UpdateOrderStatusRequest $request,
        string $orderNumber,
        UpdateOrderStatus $action,
    ): OrderResource {
        $order = Order::where('order_number', $orderNumber)->firstOrFail();

        $order = $action->execute($order, $request->enum('status', OrderStatus::class));

        return OrderResource::make($order->load(['items', 'user']));
    }
}
