// ─────────────────────────────────────────────────────────────
// カート状態。zustand + persist で localStorage に保存する（サーバーには一切送らない）。
// ログイン状態と無関係にブラウザ単位で保持される（docs/01-sitemap-pages.md）。
//
// ここに持つのは「追加した時点の表示スナップショット」。実際の在庫・価格は
// /cart と /checkout の表示時に API で再検証する（F4 以降）。
// 確定金額は POST /api/orders でサーバーが再計算するので、ここがズレても実害はない。
// ─────────────────────────────────────────────────────────────

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { CartItem } from "@/lib/types";

type CartState = {
  items: CartItem[];
  /** 同じ variantId が既にあれば数量を加算する */
  addItem: (item: CartItem) => void;
  removeItem: (variantId: number) => void;
  /** 0 以下を渡したら削除扱い（数量ステッパーで 0 まで下げたケース） */
  setQuantity: (variantId: number, quantity: number) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i,
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        })),

      setQuantity: (variantId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.variantId !== variantId)
              : state.items.map((i) =>
                  i.variantId === variantId ? { ...i, quantity } : i,
                ),
        })),

      clear: () => set({ items: [] }),
    }),
    {
      name: "ec2-cart", // localStorage のキー名
      // SSR 時は localStorage が無いのでサーバーの初回描画は必ず items:[] になる。
      // 自動復元させるとクライアントの初回描画がサーバーと食い違って hydration mismatch に
      // なるので、復元は明示的に（マウント後に）行う（components/providers/CartHydration.tsx）。
      skipHydration: true,
    },
  ),
);

/** ヘッダーの CART (n) 用。明細の総数量（行数ではなく数量合計）を返す */
export function useCartItemCount(): number {
  return useCartStore((state) => state.items.reduce((sum, i) => sum + i.quantity, 0));
}
