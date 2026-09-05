"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { OrderStatus } from "@/lib/types";

type OrderStatusToggleProps = {
  orderNumber: string;
  status: OrderStatus;
};

/**
 * 注文ステータスの切り替え（docs/05-admin.md）。R2 は pending ⇄ cancelled のみ。
 * cancelled にすると在庫を戻し、pending に戻すと在庫を再度引き当てる
 * （在庫不足なら 422 + unavailable。backend/app/Actions/Admin/Order/UpdateOrderStatus.php）。
 */
export default function OrderStatusToggle({ orderNumber, status }: OrderStatusToggleProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    const nextStatus: OrderStatus = status === "pending" ? "cancelled" : "pending";
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/bff/admin/orders/${orderNumber}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? "ステータス変更に失敗しました。");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {error && <p className="mb-2 text-xs text-graphite">{error}</p>}
      <button
        type="button"
        onClick={handleToggle}
        disabled={submitting}
        className="border border-ink px-6 py-3 text-xs tracking-widest uppercase transition-colors hover:bg-mist disabled:opacity-50"
      >
        {submitting ? "..." : status === "pending" ? "Cancel Order" : "Reopen Order"}
      </button>
    </div>
  );
}
