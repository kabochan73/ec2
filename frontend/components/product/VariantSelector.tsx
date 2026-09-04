"use client";

import { useState } from "react";

import { useCartStore } from "@/lib/stores/cart";
import type { ProductVariant } from "@/lib/types";

type Props = {
  productSlug: string;
  productName: string;
  price: number;
  imageUrl: string;
  colors: string[];
  variants: ProductVariant[];
};

const STOCK_LABEL: Partial<Record<ProductVariant["stock_status"], string>> = {
  low_stock: "LOW STOCK",
};

/**
 * 色スウォッチ・サイズセレクタ・ADD TO CART。選択中の色・サイズという状態を
 * 共有するのでまとめて Client Component にする（docs/01-sitemap-pages.md）。
 *
 * 注意: 「色を選ぶと画像も切り替わる」は product_images が色を持たない
 * （商品単位の画像しか無い）データモデルのため実装しない。色選択で切り替わるのは
 * サイズごとの在庫状況のみ。R2 のシードは全 variant が color=null なので色 UI は出ない。
 */
export default function VariantSelector({
  productSlug,
  productName,
  price,
  imageUrl,
  colors,
  variants,
}: Props) {
  const hasColors = colors.length > 0;
  const [selectedColor, setSelectedColor] = useState<string | null>(hasColors ? colors[0] : null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  // 選択中の色に属する variant だけを対象にする（色展開が無い商品は color=null の variant のみ）
  const availableVariants = variants.filter((variant) => variant.color === selectedColor);
  const selectedVariant =
    availableVariants.find((variant) => variant.size === selectedSize) ?? null;
  const canAddToCart = selectedVariant !== null && selectedVariant.stock > 0;

  function handleColorChange(color: string) {
    setSelectedColor(color);
    // 色を変えたらサイズ選択をリセット（同じサイズが同じ在庫状態とは限らない）
    setSelectedSize(null);
  }

  function handleAddToCart() {
    if (!selectedVariant) {
      return;
    }
    addItem({
      variantId: selectedVariant.id,
      productSlug,
      productName,
      size: selectedVariant.size,
      color: selectedVariant.color,
      unitPrice: price,
      quantity: 1,
      imageUrl,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div>
      {hasColors && (
        <div className="mb-6">
          <p className="mb-2 text-[11px] tracking-widest text-graphite uppercase">Color</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleColorChange(color)}
                className={`border px-3 py-1.5 text-xs tracking-widest uppercase transition-colors ${
                  selectedColor === color
                    ? "border-ink bg-ink text-paper"
                    : "border-ink text-ink hover:bg-mist"
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <p className="mb-2 text-[11px] tracking-widest text-graphite uppercase">Size</p>
        <div className="flex flex-wrap gap-2">
          {availableVariants.map((variant) => {
            const soldOut = variant.stock_status === "sold_out";
            const label = STOCK_LABEL[variant.stock_status];
            const active = selectedSize === variant.size;

            return (
              <button
                key={variant.id}
                type="button"
                disabled={soldOut}
                onClick={() => setSelectedSize(variant.size)}
                className={`border px-3 py-1.5 text-xs tracking-widest uppercase transition-colors ${
                  soldOut
                    ? "cursor-not-allowed border-graphite text-graphite line-through"
                    : active
                      ? "border-ink bg-ink text-paper"
                      : "border-ink text-ink hover:bg-mist"
                }`}
              >
                {variant.size}
                {label && !active && (
                  <span className="ml-1 text-[9px] normal-case text-graphite">({label})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        disabled={!canAddToCart}
        onClick={handleAddToCart}
        className="w-full bg-ink py-3 text-xs tracking-widest text-paper uppercase transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30"
      >
        {added ? "Added" : "Add to Cart"}
      </button>
    </div>
  );
}
