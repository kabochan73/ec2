/**
 * (shop) 配下共通のローディング表示。Server Component のデータ取得中に
 * Next.js が自動でこの Suspense フォールバックを出す。
 */
export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-xl px-6 py-32 text-center">
      <p className="animate-pulse text-sm tracking-widest text-graphite uppercase">Loading…</p>
    </div>
  );
}
