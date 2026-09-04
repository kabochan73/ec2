import AboutSection from "@/components/home/AboutSection";
import BrandConcept from "@/components/home/BrandConcept";
import CategoryGrid from "@/components/home/CategoryGrid";
import Hero from "@/components/home/Hero";
import Lookbook from "@/components/home/Lookbook";

/**
 * トップページ。docs/01-sitemap-pages.md の `/` 構成そのまま:
 * 1. Hero  2. BrandConcept（理念）  3. Lookbook  4. カテゴリ別グリッド  5. About（沿革・素材・製造）
 *
 * 全セクションが静的 or 読み取りのみなので丸ごと Server Component。
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <BrandConcept />
      <Lookbook />
      <CategoryGrid />
      <AboutSection />
    </>
  );
}
