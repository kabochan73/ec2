import type { Metadata } from "next";
import Link from "next/link";

import StatCard from "@/components/admin/StatCard";
import { fetchDashboardStats } from "@/lib/admin/dashboard";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const { token } = await requireAdmin("/admin");
  const stats = await fetchDashboardStats(token);

  return (
    <div>
      <h1 className="mb-8 text-xl tracking-[0.1em] uppercase">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Orders" value={stats.orders_count} />
        <StatCard label="Revenue" value={`¥${stats.revenue_total.toLocaleString("ja-JP")}`} />
        <StatCard label="Low Stock" value={stats.low_stock_count} />
        <StatCard label="Sold Out" value={stats.sold_out_count} />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-[11px] tracking-widest text-graphite uppercase">Recent Orders</h2>
        {stats.recent_orders.length === 0 ? (
          <p className="text-sm text-graphite">No orders yet.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink text-left text-[11px] tracking-widest text-graphite uppercase">
                <th className="py-2 font-normal">Order</th>
                <th className="py-2 font-normal">Customer</th>
                <th className="py-2 font-normal">Status</th>
                <th className="py-2 text-right font-normal">Total</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_orders.map((order) => (
                <tr key={order.order_number} className="border-b border-mist">
                  <td className="py-2">
                    <Link
                      href={`/admin/orders/${order.order_number}`}
                      className="hover:underline"
                    >
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="py-2">{order.customer.name}</td>
                  <td className="py-2 text-xs tracking-widest uppercase">{order.status}</td>
                  <td className="py-2 text-right">¥{order.total.toLocaleString("ja-JP")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
