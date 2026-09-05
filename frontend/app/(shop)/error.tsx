"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * (shop) 配下共通のエラー表示。Server Component の描画中の例外
 * （Laravel 側の障害等）をここで受け止める。error.tsx は Client Component 必須。
 */
export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-6 py-32 text-center">
      <p className="text-sm tracking-widest text-graphite uppercase">Something Went Wrong</p>
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        <button
          type="button"
          onClick={() => reset()}
          className="border border-ink px-6 py-3 text-xs tracking-widest uppercase transition-colors hover:bg-mist"
        >
          Try Again
        </button>
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
