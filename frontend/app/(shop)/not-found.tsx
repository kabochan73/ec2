import Link from "next/link";

/**
 * ストアフロント内で notFound() が呼ばれたとき（存在しない/未公開の商品 slug など）。
 * Header / Footer は (shop)/layout.tsx のものがそのまま付く。
 */
export default function NotFound() {
  return (
    <section className="mx-auto max-w-md px-6 py-32 text-center">
      <p className="text-xs tracking-[0.3em] text-graphite uppercase">404</p>
      <h1 className="mt-6 text-lg tracking-[0.15em] uppercase">Page Not Found</h1>
      <Link
        href="/"
        className="mt-10 inline-block border-b border-ink pb-1 text-xs tracking-widest uppercase transition-opacity hover:opacity-60"
      >
        Continue Shopping
      </Link>
    </section>
  );
}
