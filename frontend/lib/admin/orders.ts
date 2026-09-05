// ─────────────────────────────────────────────────────────────
// 管理画面の注文まわりのサーバー側専用ヘルパー。
// lib/admin/products.ts と同じ方針。
// ─────────────────────────────────────────────────────────────

import { apiFetch } from "@/lib/api";
import type {
  AdminOrderDetail,
  AdminOrderListItem,
  ApiPaginated,
  ApiResource,
  OrderStatus,
} from "@/lib/types";

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export type AdminOrderListParams = {
  status?: string;
  page?: number;
};

/** GET /api/admin/orders */
export async function fetchAdminOrders(
  token: string,
  params: AdminOrderListParams = {},
): Promise<ApiPaginated<AdminOrderListItem>> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.page) query.set("page", String(params.page));

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<ApiPaginated<AdminOrderListItem>>(`/api/admin/orders${suffix}`, {
    headers: authHeader(token),
  });
}

/** GET /api/admin/orders/{orderNumber} */
export async function fetchAdminOrder(
  token: string,
  orderNumber: string,
): Promise<AdminOrderDetail> {
  const result = await apiFetch<ApiResource<AdminOrderDetail>>(
    `/api/admin/orders/${orderNumber}`,
    { headers: authHeader(token) },
  );
  return result.data;
}

/** PUT /api/admin/orders/{orderNumber}/status */
export async function updateOrderStatus(
  token: string,
  orderNumber: string,
  status: OrderStatus,
): Promise<AdminOrderDetail> {
  const result = await apiFetch<ApiResource<AdminOrderDetail>>(
    `/api/admin/orders/${orderNumber}/status`,
    {
      method: "PUT",
      headers: { ...authHeader(token), "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );
  return result.data;
}
