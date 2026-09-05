import type { Metadata } from "next";
import Link from "next/link";

import LogoutButton from "@/components/account/LogoutButton";
import { requireAuth } from "@/lib/auth";
import { fetchOrders } from "@/lib/orders";

export const metadata: Metadata = { title: "Account" };

/**
 * マイページ ダッシュボード（docs/01-sitemap-pages.md の `/account`）。
 * 個人化データなのでキャッシュ対象外。Server Component（表示のみ、ログアウトだけ CC）。
 */
export default async function AccountPage() {
  const { user, token } = await requireAuth("/account");

  const orders = await fetchOrders(token);
  const latestOrder = orders[0];

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl tracking-[0.15em] uppercase">Welcome, {user.name}</h1>

      {/* 直近の注文サマリー（docs/01: 「直近の注文1件のサマリー」） */}
      <section className="mt-10 border border-ink p-6">
        <h2 className="text-[11px] tracking-widest text-graphite uppercase">Recent Order</h2>
        {latestOrder ? (
          <Link
            href={`/account/orders/${latestOrder.order_number}`}
            className="mt-3 flex items-center justify-between text-sm hover:underline"
          >
            <span>
              {latestOrder.order_number}
              <span className="ml-3 text-xs text-graphite uppercase">{latestOrder.status}</span>
            </span>
            <span>¥{latestOrder.total.toLocaleString("ja-JP")}</span>
          </Link>
        ) : (
          <p className="mt-3 text-sm text-graphite">No orders yet.</p>
        )}
      </section>

      {/* マイページメニュー */}
      <nav className="mt-10 divide-y divide-mist border border-ink text-xs tracking-widest uppercase">
        <Link href="/account/orders" className="block px-6 py-4 hover:bg-mist">
          Orders
        </Link>
        <Link href="/account/addresses" className="block px-6 py-4 hover:bg-mist">
          Addresses
        </Link>
        <Link href="/account/profile" className="block px-6 py-4 hover:bg-mist">
          Profile
        </Link>
        {user.role === "admin" && (
          <Link href="/admin" className="block px-6 py-4 hover:bg-mist">
            Admin Panel
          </Link>
        )}
        <div className="px-6 py-4">
          <LogoutButton />
        </div>
      </nav>
    </div>
  );
}
