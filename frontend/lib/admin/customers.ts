// 会員一覧の取得（閲覧のみ。読み取りなので Server Component から直接呼ぶ）。

import { apiFetch } from "@/lib/api";
import type { AdminCustomer, ApiPaginated } from "@/lib/types";

/** GET /api/admin/customers */
export async function fetchAdminCustomers(
  token: string,
  page?: number,
): Promise<ApiPaginated<AdminCustomer>> {
  const suffix = page ? `?page=${page}` : "";
  return apiFetch<ApiPaginated<AdminCustomer>>(`/api/admin/customers${suffix}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
