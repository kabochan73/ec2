// ─────────────────────────────────────────────────────────────
// 住所録まわりのサーバー側専用ヘルパー（Route Handler から使う）。
// lib/auth.ts と同じ方針: 実処理はここ、app/bff/**\/route.ts は薄い窓口。
// ─────────────────────────────────────────────────────────────

import { apiFetch } from "@/lib/api";
import type { Address, AddressPayload, ApiCollection, ApiResource } from "@/lib/types";

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/** GET /api/addresses（is_default が先頭） */
export async function fetchAddresses(token: string): Promise<Address[]> {
  const result = await apiFetch<ApiCollection<Address>>("/api/addresses", {
    headers: authHeader(token),
  });
  return result.data;
}

/** POST /api/addresses */
export async function createAddress(token: string, payload: AddressPayload): Promise<Address> {
  const result = await apiFetch<ApiResource<Address>>("/api/addresses", {
    method: "POST",
    headers: { ...authHeader(token), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return result.data;
}

/** PUT /api/addresses/{id} */
export async function updateAddress(
  token: string,
  id: number,
  payload: AddressPayload,
): Promise<Address> {
  const result = await apiFetch<ApiResource<Address>>(`/api/addresses/${id}`, {
    method: "PUT",
    headers: { ...authHeader(token), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return result.data;
}

/** DELETE /api/addresses/{id}（204） */
export async function deleteAddress(token: string, id: number): Promise<void> {
  await apiFetch<void>(`/api/addresses/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
}

/** POST /api/addresses/{id}/default */
export async function setDefaultAddress(token: string, id: number): Promise<Address> {
  const result = await apiFetch<ApiResource<Address>>(`/api/addresses/${id}/default`, {
    method: "POST",
    headers: authHeader(token),
  });
  return result.data;
}
