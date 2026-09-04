// 商品の取得（読み取りなので Server Component から直接呼ぶ。docs/08 §3.1）。
// .tsx にこのロジックを直書きせず、ここに集約する。

import { apiFetch } from "@/lib/api";
import type { ApiCollection, ApiResource, ProductDetail, ProductSummary } from "@/lib/types";

type ProductListParams = {
  /** カテゴリ slug で絞り込む */
  category?: string;
  /** true で作成30日以内・新着順（トップのルックブック等） */
  isNew?: boolean;
  /** 件数上限 */
  limit?: number;
};

/**
 * GET /api/products — 公開商品の一覧（要約形式）。
 *
 * キャッシュ: いまは apiFetch 既定（no-store）。本番向けの ISR は管理画面フェーズで。
 */
export async function getProducts(params: ProductListParams = {}): Promise<ProductSummary[]> {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.isNew) query.set("new", "true");
  if (params.limit) query.set("limit", String(params.limit));

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const { data } = await apiFetch<ApiCollection<ProductSummary>>(`/api/products${suffix}`);
  return data;
}

/**
 * GET /api/products/{slug} — 商品詳細。未公開・存在しない slug は apiFetch が
 * 404 で throw する（呼び出し側で notFound() に変換する。F3）。
 */
export async function getProduct(slug: string): Promise<ProductDetail> {
  const { data } = await apiFetch<ApiResource<ProductDetail>>(`/api/products/${slug}`);
  return data;
}
