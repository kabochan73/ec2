import Image from "next/image";

import type { ProductImage } from "@/lib/types";

type ProductMediaProps = {
  images: ProductImage[];
  /** カード用に true でホバー時 2枚目に差し替える（詳細ページのギャラリーでは使わない） */
  hoverSwap?: boolean;
  /** 商品名（alt 未設定時のフォールバック） */
  name: string;
  sizes?: string;
};

/**
 * 商品画像の表示。画像が1枚も無ければ「NO IMAGE」のグレーボックスを出す
 * （docs/08 §9。R2 の商品シードは画像を持たないので、当面は全商品ここに落ちる）。
 *
 * 画像の実体配信（/media プロキシ）は管理画面・画像アップロードのフェーズで作る。
 */
export default function ProductMedia({ images, hoverSwap = false, name, sizes }: ProductMediaProps) {
  const primary = images.find((image) => image.position === 0) ?? images[0];
  const hover = hoverSwap ? images.find((image) => image.position === 1) : undefined;

  return (
    <div className="relative aspect-[3/4] overflow-hidden bg-mist">
      {primary ? (
        <>
          <Image
            src={primary.url}
            alt={primary.alt ?? name}
            fill
            sizes={sizes}
            className={
              hover
                ? "object-cover transition-opacity duration-300 group-hover:opacity-0"
                : "object-cover"
            }
          />
          {hover && (
            <Image
              src={hover.url}
              alt={hover.alt ?? name}
              fill
              sizes={sizes}
              className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          )}
        </>
      ) : (
        <div className="flex h-full items-center justify-center">
          <span className="text-[10px] tracking-[0.3em] text-graphite uppercase">No Image</span>
        </div>
      )}
    </div>
  );
}
