// ─────────────────────────────────────────────────────────────
// 注文まわりのサーバー側専用ヘルパー。
// /account/orders と /account/orders/[number] は表示専用（クライアント側の書き込みが無い）
// なので、BFF Route Handler を挟まず Server Component から直接ここを呼ぶ。
// トークンを自分で cookies() から読んで付ける点だけが商品閲覧と違う。
// 注文確定（POST /api/orders）は書き込みなので app/bff/orders/route.ts 経由（F7）。
// ─────────────────────────────────────────────────────────────

import { ApiError, apiFetch } from "@/lib/api";
import type {
  ApiCollection,
  ApiResource,
  CreateOrderPayload,
  OrderDetail,
  OrderSummary,
} from "@/lib/types";

/** POST /api/orders（app/bff/orders/route.ts から。/checkout の注文確定）。在庫不足は 422 で throw */
export async function createOrder(
  token: string,
  payload: CreateOrderPayload,
): Promise<OrderDetail> {
  const result = await apiFetch<ApiResource<OrderDetail>>("/api/orders", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return result.data;
}

/** GET /api/orders（本人の注文一覧、新しい順） */
export async function fetchOrders(token: string): Promise<OrderSummary[]> {
  const result = await apiFetch<ApiCollection<OrderSummary>>("/api/orders", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return result.data;
}

/**
 * GET /api/orders/{orderNumber}。
 * 他人の注文・存在しない番号は Laravel がどちらも 404（backend の OrderController::show）。
 * ここでは 404 → null に変換し、ページ側で notFound() に変換する。
 */
export async function findOrder(
  token: string,
  orderNumber: string,
): Promise<OrderDetail | null> {
  try {
    const result = await apiFetch<ApiResource<OrderDetail>>(`/api/orders/${orderNumber}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return result.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
