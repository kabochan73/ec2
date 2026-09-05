import Link from "next/link";

import { requireAdmin } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
];

/**
 * 管理画面の共通レイアウト（docs/05-admin.md）。ストアフロントの (shop) とは別系統で、
 * Header/Footer は持たずサイドバー付きの機能優先レイアウトにする。
 * requireAdmin() で「未ログイン→/login」「非admin→/」を弾く。
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin("/admin");

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 flex-none border-r border-ink px-6 py-8">
        <p className="mb-8 text-xs tracking-[0.15em] uppercase">EC-PORTFOLIO Admin</p>
        <nav className="flex flex-col gap-1 text-xs tracking-widest uppercase">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-2 py-2 transition-colors hover:bg-mist"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-10 border-t border-mist pt-4 text-[11px] text-graphite">
          <p className="mb-2">{user.name}</p>
          <Link href="/" className="underline hover:text-ink">
            Back To Store
          </Link>
        </div>
      </aside>
      <main className="flex-1 px-10 py-8">{children}</main>
    </div>
  );
}
