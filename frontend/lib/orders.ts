// ─────────────────────────────────────────────────────────────
// 注文まわりのサーバー側専用ヘルパー。
// /account/orders と /account/orders/[number] は表示専用（クライアント側の書き込みが無い）
// なので、BFF Route Handler を挟まず Server Component から直接ここを呼ぶ。
// トークンを自分で cookies() から読んで付ける点だけが商品閲覧と違う。
// 注文確定（POST /api/orders）は書き込みなので app/bff/orders/route.ts 経由（F7）。
// ─────────────────────────────────────────────────────────────

import { apiFetch } from "@/lib/api";
import type { ApiCollection, ApiResource, OrderDetail, OrderSummary } from "@/lib/types";

/** GET /api/orders（本人の注文一覧、新しい順） */
export async function fetchOrders(token: string): Promise<OrderSummary[]> {
  const result = await apiFetch<ApiCollection<OrderSummary>>("/api/orders", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return result.data;
}

/** GET /api/orders/{orderNumber}（本人以外・存在しない番号は 404 で apiFetch が throw） */
export async function fetchOrderDetail(
  token: string,
  orderNumber: string,
): Promise<OrderDetail> {
  const result = await apiFetch<ApiResource<OrderDetail>>(`/api/orders/${orderNumber}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return result.data;
}
