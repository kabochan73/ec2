"use client";

import { useQueries } from "@tanstack/react-query";

import type { ApiResource, CartItem, CartLineValidation, ProductDetail } from "@/lib/types";

/**
 * カートの明細を /bff/products/{slug} で再検証する（docs/01-sitemap-pages.md:
 * 「ページ表示時に各明細の商品/在庫/価格を API で再検証」）。
 *
 * ここでは store（localStorage）を書き換えない。あくまで「今の本当の状態」を
 * 計算して返すだけにして、カートから消す/数量を減らすのはユーザーの操作
 * （数量ステッパー・削除ボタン）に任せる。
 *
 * カートに含まれる unique な slug ごとに1本 useQuery を張る（react-query が
 * 重複排除・キャッシュ・ローディング状態を面倒見る）。数量変更では slug 集合が
 * 変わらないので再取得は走らない。
 */
export function useCartValidation(items: CartItem[]) {
  const slugs = Array.from(new Set(items.map((item) => item.productSlug)));

  const results = useQueries({
    queries: slugs.map((slug) => ({
      queryKey: ["cart-validate", slug],
      queryFn: async (): Promise<ProductDetail | null> => {
        const res = await fetch(`/bff/products/${slug}`);
        if (res.status === 404) {
          // 削除・未公開になった
          return null;
        }
        if (!res.ok) {
          throw new Error(`/bff/products/${slug} が ${res.status}`);
        }
        const body: ApiResource<ProductDetail> = await res.json();
        return body.data;
      },
      staleTime: 30_000,
    })),
  });

  const loading = results.some((result) => result.isPending);

  const bySlug = new Map<string, ProductDetail | null | undefined>();
  slugs.forEach((slug, index) => {
    const result = results[index];
    bySlug.set(slug, result.isSuccess ? result.data : undefined);
  });

  function getValidation(item: CartItem): CartLineValidation {
    const product = bySlug.get(item.productSlug);

    if (product === undefined) {
      // まだ取得できていない（初回ロード中 or エラー）→ 楽観的に available 扱い
      return { currentStock: null, currentPrice: null, available: true };
    }
    if (product === null) {
      // 商品自体が無くなっている
      return { currentStock: 0, currentPrice: null, available: false };
    }

    const variant = product.variants.find((v) => v.id === item.variantId);
    if (!variant) {
      // variant が削除されている
      return { currentStock: 0, currentPrice: product.price, available: false };
    }

    return {
      currentStock: variant.stock,
      currentPrice: product.price,
      available: variant.stock > 0,
    };
  }

  return { getValidation, loading };
}
