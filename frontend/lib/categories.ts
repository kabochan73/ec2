// カテゴリの取得（読み取りなので Server Component から直接呼ぶ。docs/08 §3.1）。
// .tsx にこのロジックを直書きせず、ここに集約する。

import { apiFetch } from "@/lib/api";
import type { ApiCollection, Category } from "@/lib/types";

/**
 * GET /api/categories — position 順の全カテゴリ。
 *
 * キャッシュ: いまは apiFetch 既定（no-store）。dev で reseed した内容を即反映したいため。
 * 本番向けの ISR + revalidateTag は管理画面（カテゴリ更新）を作るフェーズで足す。
 */
export async function getCategories(): Promise<Category[]> {
  const { data } = await apiFetch<ApiCollection<Category>>("/api/categories");
  return data;
}
