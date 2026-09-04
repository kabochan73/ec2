import Link from "next/link";

/**
 * ヘッダーの CART (n) リンク。
 *
 * F1 時点では件数を持たない静的な Server Component（常に 0）。
 * F4（カート）で zustand ストア（lib/stores/cart.ts）から数量合計を読む
 * Client Component に差し替える。
 */
export default function CartCount() {
  return (
    <Link href="/cart" className="transition-opacity hover:opacity-60">
      CART (0)
    </Link>
  );
}
