import ProductCard from "@/components/product/ProductCard";
import { getCategories } from "@/lib/categories";
import { getProducts } from "@/lib/products";

/**
 * トップページのメインコンテンツ。カテゴリごとに極太見出し＋そのカテゴリの
 * 全公開商品グリッドを position 順で並べる（docs/01-sitemap-pages.md）。
 * `/collections` を作らない方針なので、先頭N点に絞らず全件をここで出し切る。
 *
 * 全部読み取りだけなので Server Component。
 */
export default async function CategoryGrid() {
  const categories = await getCategories();

  if (categories.length === 0) {
    // カテゴリがまだ無い（Seeder 未実行）場合は何も出さない
    return null;
  }

  // カテゴリごとの商品をまとめて取得
  const sections = await Promise.all(
    categories.map(async (category) => ({
      category,
      products: await getProducts({ category: category.slug }),
    })),
  );

  return (
    <div>
      {sections.map(({ category, products }) => {
        if (products.length === 0) {
          // そのカテゴリに公開商品が無ければセクションごと出さない
          return null;
        }

        return (
          <section
            key={category.id}
            id={category.slug}
            className="border-t border-ink px-6 py-20"
          >
            <h2 className="mb-10 text-3xl font-medium tracking-[0.15em] uppercase md:text-5xl">
              {category.name}
            </h2>

            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
