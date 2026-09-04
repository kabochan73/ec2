// ブラウザ → POST /bff/orders → Laravel POST /api/orders。/checkout の「PLACE ORDER」から。
// 在庫不足時は Laravel が 422 + unavailable を返し、apiErrorResponse がそのまま中継する
// （フロント側で該当明細に理由を表示する）。

import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";
import { createOrder } from "@/lib/orders";

export async function POST(request: Request) {
  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const body = await request.json();

  try {
    const order = await createOrder(token, body);
    return NextResponse.json({ data: order }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
