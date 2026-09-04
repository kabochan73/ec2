import type { Metadata } from "next";
import Link from "next/link";

import { requireAuth } from "@/lib/auth";
import { fetchOrders } from "@/lib/orders";

export const metadata: Metadata = { title: "Orders" };

/** 注文履歴（docs/01-sitemap-pages.md の `/account/orders`）。表示のみ。 */
export default async function OrderListPage() {
  const { token } = await requireAuth("/account/orders");
  const orders = await fetchOrders(token);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-10 text-2xl tracking-[0.15em] uppercase">Orders</h1>

      {orders.length === 0 ? (
        <p className="text-sm text-graphite">No orders yet.</p>
      ) : (
        <div className="divide-y divide-mist border-t border-b border-ink">
          {orders.map((order) => (
            <Link
              key={order.order_number}
              href={`/account/orders/${order.order_number}`}
              className="flex items-center justify-between gap-4 py-4 text-sm hover:bg-mist"
            >
              <span className="w-40 flex-none">{order.order_number}</span>
              <span className="flex-1 text-graphite">
                {new Date(order.created_at).toLocaleDateString("ja-JP")}
              </span>
              <span className="w-16 flex-none text-graphite">{order.item_count} items</span>
              <span className="w-24 flex-none text-right">
                ¥{order.total.toLocaleString("ja-JP")}
              </span>
              <span className="w-24 flex-none text-right text-xs tracking-widest text-graphite uppercase">
                {order.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
