import type { Metadata } from "next";
import Link from "next/link";

import { fetchAdminOrders } from "@/lib/admin/orders";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Orders | Admin" };

type PageProps = {
  searchParams: Promise<{ status?: string; page?: string }>;
};

/**
 * 注文一覧（docs/05-admin.md）。商品一覧と同じ方針で、絞り込み・ページングは
 * GET クエリのみで完結させる。
 */
export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const { token } = await requireAdmin("/admin/orders");
  const { status, page } = await searchParams;
  const currentPage = page ? Number(page) : 1;

  const result = await fetchAdminOrders(token, { status, page: currentPage });

  function pageHref(targetPage: number): string {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("page", String(targetPage));
    return `/admin/orders?${params.toString()}`;
  }

  return (
    <div>
      <h1 className="mb-8 text-xl tracking-widest uppercase">Orders</h1>

      <form method="get" className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label
            htmlFor="status"
            className="block text-[11px] tracking-widest text-graphite uppercase"
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? ""}
            className="mt-2 w-40 border-b border-ink bg-transparent py-2 text-sm outline-none"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <button
          type="submit"
          className="border border-ink px-6 py-2 text-xs tracking-widest uppercase transition-colors hover:bg-mist"
        >
          Filter
        </button>
      </form>

      {result.data.length === 0 ? (
        <p className="text-sm text-graphite">No orders found.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink text-left text-[11px] tracking-widest text-graphite uppercase">
              <th className="py-2 font-normal">Order</th>
              <th className="py-2 font-normal">Customer</th>
              <th className="py-2 font-normal">Date</th>
              <th className="py-2 font-normal">Status</th>
              <th className="py-2 text-right font-normal">Total</th>
            </tr>
          </thead>
          <tbody>
            {result.data.map((order) => (
              <tr key={order.order_number} className="border-b border-mist">
                <td className="py-2">
                  <Link href={`/admin/orders/${order.order_number}`} className="hover:underline">
                    {order.order_number}
                  </Link>
                </td>
                <td className="py-2 text-graphite">{order.customer.name}</td>
                <td className="py-2 text-graphite">
                  {new Date(order.created_at).toLocaleDateString("ja-JP")}
                </td>
                <td className="py-2 text-xs tracking-widest uppercase">{order.status}</td>
                <td className="py-2 text-right">¥{order.total.toLocaleString("ja-JP")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {result.meta.last_page > 1 && (
        <div className="mt-6 flex items-center gap-4 text-xs tracking-widest uppercase">
          {result.meta.current_page > 1 ? (
            <Link href={pageHref(result.meta.current_page - 1)} className="hover:underline">
              Prev
            </Link>
          ) : (
            <span className="text-graphite">Prev</span>
          )}
          <span>
            {result.meta.current_page} / {result.meta.last_page}
          </span>
          {result.meta.current_page < result.meta.last_page ? (
            <Link href={pageHref(result.meta.current_page + 1)} className="hover:underline">
              Next
            </Link>
          ) : (
            <span className="text-graphite">Next</span>
          )}
        </div>
      )}
    </div>
  );
}
