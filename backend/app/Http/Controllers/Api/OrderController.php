<?php

namespace App\Http\Controllers\Api;

use App\Actions\Order\CreateOrder;
use App\Actions\Order\CreateOrderInput;
use App\Http\Controllers\Controller;
use App\Http\Requests\Order\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Http\Resources\OrderSummaryResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class OrderController extends Controller
{
    /**
     * 注文確定（POST /api/orders）。在庫トランザクションは CreateOrder Action が持つ。
     */
    public function store(StoreOrderRequest $request, CreateOrder $action): JsonResponse
    {
        $order = $action->execute($request->user(), CreateOrderInput::fromRequest($request));

        return OrderResource::make($order)
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * 本人の注文一覧（新しい順）。要約形式。
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $orders = $request->user()->orders()
            ->withCount('items')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();

        return OrderSummaryResource::collection($orders);
    }

    /**
     * 本人の注文詳細。他人の注文・存在しない注文番号はどちらも 404
     * （firstOrFail の ModelNotFoundException を Laravel が自動で 404 JSON に変換する）。
     */
    public function show(Request $request, string $orderNumber): OrderResource
    {
        $order = $request->user()->orders()
            ->where('order_number', $orderNumber)
            ->with('items')
            ->firstOrFail();

        return OrderResource::make($order);
    }
}
