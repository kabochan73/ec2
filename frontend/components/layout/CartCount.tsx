"use client";

import Link from "next/link";

import { useCartItemCount } from "@/lib/stores/cart";

/**
 * ヘッダーの CART (n) リンク。zustand ストアの数量合計を表示する。
 * 復元前（SSR・hydration 直後）は 0。CartHydration がマウント後に復元すると
 * この値も自動で更新される。
 */
export default function CartCount() {
  const count = useCartItemCount();

  return (
    <Link href="/cart" className="transition-opacity hover:opacity-60">
      CART ({count})
    </Link>
  );
}
