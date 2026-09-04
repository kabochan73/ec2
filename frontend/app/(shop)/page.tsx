import CategoryGrid from "@/components/home/CategoryGrid";

/**
 * トップページ。docs/01-sitemap-pages.md の `/` 構成。
 * F2a: カテゴリ別グリッドのみ。
 * F2b で Hero / BrandConcept / Lookbook / AboutSection の装飾セクションを足す。
 *
 * 全セクションが読み取りのみなので丸ごと Server Component。
 */
export default function HomePage() {
  return (
    <>
      <CategoryGrid />
    </>
  );
}
