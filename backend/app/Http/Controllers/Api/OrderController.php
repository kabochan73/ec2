<?php

namespace App\Http\Controllers\Api;

use App\Actions\Order\CreateOrder;
use App\Actions\Order\CreateOrderInput;
use App\Http\Controllers\Controller;
use App\Http\Requests\Order\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use Illuminate\Http\JsonResponse;
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

    // index / show（注文一覧・詳細）は Step 14b で追加
}
