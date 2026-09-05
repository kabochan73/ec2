// ブラウザ → PUT /bff/admin/orders/{orderNumber}/status → Laravel の同パス。
// 在庫不足で戻せない場合は Laravel が 422 + unavailable を返し、そのまま中継する
// （CreateOrder と同じ InsufficientStockException。docs/05-admin.md）。

import { NextResponse } from "next/server";

import { updateOrderStatus } from "@/lib/admin/orders";
import { apiErrorResponse } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";

type Params = { params: Promise<{ orderNumber: string }> };

export async function PUT(request: Request, { params }: Params) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { orderNumber } = await params;
  const body = await request.json();

  try {
    const order = await updateOrderStatus(token, orderNumber, body.status);
    return NextResponse.json({ data: order });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
