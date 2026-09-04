"use client";

import Link from "next/link";

import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/constants";
import { useCartStore } from "@/lib/stores/cart";

/**
 * カート（docs/01-sitemap-pages.md の `/cart`）。
 * カートは zustand（localStorage）にしか無く、サーバー側のデータ取得も無いのでページ丸ごと CC。
 *
 * F4a: 表示・数量変更・削除・サマリーまで。金額は「追加時のスナップショット」。
 * F4b: 各明細を API で再検証（売り切れ・在庫上限・価格変動・未公開）して警告と CHECKOUT ガードを足す。
 */
export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

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

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shippingFee;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="mb-10 text-2xl tracking-[0.15em] uppercase">Cart</h1>

      <div className="grid gap-12 md:grid-cols-3">
        {/* 明細行 */}
        <div className="divide-y divide-mist md:col-span-2">
          {items.map((item) => (
            <div key={item.variantId} className="flex gap-4 py-6">
              {/* サムネ。R2 は画像を持たないので NO IMAGE */}
              <div className="flex aspect-[3/4] w-24 flex-none items-center justify-center bg-mist">
                <span className="text-[8px] tracking-[0.2em] text-graphite uppercase">No Image</span>
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
                    ¥{item.unitPrice.toLocaleString("ja-JP")}
                  </p>
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
                      aria-label="Increase quantity"
                      className="h-7 w-7 border border-ink text-xs transition-opacity"
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
                ¥{(item.unitPrice * item.quantity).toLocaleString("ja-JP")}
              </p>
            </div>
          ))}
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
            className="mt-4 block w-full bg-ink py-3 text-center text-xs tracking-widest text-paper uppercase transition-opacity hover:opacity-80"
          >
            Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
