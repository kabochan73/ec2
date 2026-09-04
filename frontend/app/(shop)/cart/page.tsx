"use client";

import Link from "next/link";

import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/constants";
import { useCartValidation } from "@/lib/hooks/useCartValidation";
import { useCartStore } from "@/lib/stores/cart";

/**
 * カート（docs/01-sitemap-pages.md の `/cart`）。
 * カートは zustand（localStorage）にしか無いのでページ丸ごと CC。
 *
 * 表示時に各明細を /bff/products/{slug} で再検証し（useCartValidation）、
 * 売り切れ・在庫上限・価格変動を反映する。store は書き換えず、警告表示と
 * ステッパー/CHECKOUT の無効化で気づかせる（減らす/消すはユーザー操作）。
 */
export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const { getValidation, loading } = useCartValidation(items);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-6 py-32 text-center">
        <p className="text-sm tracking-widest text-graphite uppercase">Your Cart Is Empty</p>
        <Link
          href="/"
          className="mt-6 inline-block border border-ink px-6 py-3 text-xs tracking-widest uppercase transition-colors hover:bg-mist"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  // 表示価格は再検証後の最新価格を優先し、まだ取得できていなければ追加時のスナップショット
  const lines = items.map((item) => {
    const validation = getValidation(item);
    const price = validation.currentPrice ?? item.unitPrice;
    return { item, validation, price, lineTotal: price * item.quantity };
  });

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shippingFee;

  // 売り切れ、または「在庫はあるが今の数量が上回っている」状態なら CHECKOUT へ進ませない
  // （進めても注文作成時に 422 で弾かれるので、ここで気づかせる）
  const hasUnavailable = lines.some(
    (line) =>
      !line.validation.available ||
      (line.validation.currentStock !== null &&
        line.item.quantity > line.validation.currentStock),
  );
  const checkoutBlocked = hasUnavailable || loading;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="mb-10 text-2xl tracking-[0.15em] uppercase">Cart</h1>

      <div className="grid gap-12 md:grid-cols-3">
        {/* 明細行 */}
        <div className="divide-y divide-mist md:col-span-2">
          {lines.map(({ item, validation, price, lineTotal }) => {
            // 取得前（currentStock=null）は現在の数量を上限にして + を一旦止める
            const maxQuantity = validation.currentStock ?? item.quantity;
            const overStock =
              validation.available &&
              validation.currentStock !== null &&
              item.quantity > validation.currentStock;

            return (
              <div key={item.variantId} className="flex gap-4 py-6">
                <div className="flex aspect-3/4 w-24 flex-none items-center justify-center bg-mist">
                  <span className="text-[8px] tracking-[0.2em] text-graphite uppercase">
                    No Image
                  </span>
                </div>

                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link
                      href={`/products/${item.productSlug}`}
                      className="text-sm hover:underline"
                    >
                      {item.productName}
                    </Link>
                    <p className="mt-1 text-xs tracking-widest text-graphite uppercase">
                      {item.size}
                      {item.color ? ` / ${item.color}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-graphite">
                      ¥{price.toLocaleString("ja-JP")}
                    </p>

                    {!validation.available && (
                      <p className="mt-1 text-xs tracking-widest uppercase">Sold Out</p>
                    )}
                    {overStock && (
                      <p className="mt-1 text-xs text-graphite">
                        Only {validation.currentStock} left in stock. Please reduce the quantity.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setQuantity(item.variantId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label="Decrease quantity"
                        className="h-7 w-7 border border-ink text-xs transition-opacity disabled:opacity-30"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(item.variantId, item.quantity + 1)}
                        disabled={!validation.available || item.quantity >= maxQuantity}
                        aria-label="Increase quantity"
                        className="h-7 w-7 border border-ink text-xs transition-opacity disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.variantId)}
                      className="text-xs text-graphite underline underline-offset-2 hover:text-ink"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <p className="w-20 flex-none text-right text-sm">
                  ¥{lineTotal.toLocaleString("ja-JP")}
                </p>
              </div>
            );
          })}
        </div>

        {/* サマリー（PC: 右 / モバイル: 下） */}
        <div className="h-fit border border-ink p-6 text-xs tracking-widest uppercase">
          <div className="flex justify-between py-2">
            <span>Subtotal</span>
            <span>¥{subtotal.toLocaleString("ja-JP")}</span>
          </div>
          <div className="flex justify-between border-t border-mist py-2">
            <span>Shipping</span>
            <span>{shippingFee === 0 ? "Free" : `¥${shippingFee.toLocaleString("ja-JP")}`}</span>
          </div>
          <div className="flex justify-between border-t border-ink py-3 text-sm normal-case">
            <span>Total</span>
            <span>¥{total.toLocaleString("ja-JP")}</span>
          </div>

          <Link
            href="/checkout"
            aria-disabled={checkoutBlocked}
            tabIndex={checkoutBlocked ? -1 : undefined}
            className={`mt-4 block w-full py-3 text-center text-xs tracking-widest text-paper uppercase transition-opacity ${
              checkoutBlocked
                ? "pointer-events-none bg-graphite"
                : "bg-ink hover:opacity-80"
            }`}
          >
            Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
