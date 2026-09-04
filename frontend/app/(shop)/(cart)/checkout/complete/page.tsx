import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Order Confirmed" };

type PageProps = {
  searchParams: Promise<{ order?: string }>;
};

/**
 * 注文完了（docs/01-sitemap-pages.md の `/checkout/complete`）。
 * 注文番号はクエリで受け取って表示するだけ。カートを空にする処理は
 * 注文確定の瞬間（checkout/page.tsx 側）で済んでいる。
 */
export default async function CheckoutCompletePage({ searchParams }: PageProps) {
  const { order } = await searchParams;

  if (!order) {
    // 直接この URL を叩いた等、注文番号を持たずに来た場合のフォールバック
    return (
      <div className="mx-auto max-w-xl px-6 py-32 text-center">
        <p className="text-sm tracking-widest text-graphite uppercase">Order Not Found</p>
        <Link
          href="/"
          className="mt-6 inline-block border border-ink px-6 py-3 text-xs tracking-widest uppercase transition-colors hover:bg-mist"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-32 text-center">
      <p className="text-sm tracking-widest text-graphite uppercase">Thank You</p>
      <h1 className="mt-4 text-2xl tracking-[0.15em] uppercase">Order Confirmed</h1>
      <p className="mt-4 text-sm text-graphite">{order}</p>

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link
          href={`/account/orders/${order}`}
          className="border border-ink px-6 py-3 text-xs tracking-widest uppercase transition-colors hover:bg-mist"
        >
          View Order
        </Link>
        <Link
          href="/"
          className="bg-ink px-6 py-3 text-xs tracking-widest text-paper uppercase transition-opacity hover:opacity-80"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
