import Link from "next/link";
import { notFound } from "next/navigation";

import ProductCard from "@/components/product/ProductCard";
import ProductMedia from "@/components/product/ProductMedia";
import { getProduct } from "@/lib/products";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);
  return product ? { title: product.name } : {};
}

/**
 * 商品詳細（docs/01-sitemap-pages.md の `/products/[slug]`）。
 * 読み取りのみなので Server Component。
 * サイズセレクタ + ADD TO CART（VariantSelector）は F3b。
 */
export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <nav className="mb-8 text-[11px] tracking-widest text-graphite uppercase">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span>{product.name}</span>
      </nav>

      <div className="grid gap-12 md:grid-cols-2">
        {/* 画像ギャラリー（全画像を縦積み）。R2 はまだ画像を持たないので NO IMAGE 1枚。
            複数画像のギャラリー（モバイル横スワイプ + ドット）は画像アップロードのフェーズで。 */}
        <div>
          <ProductMedia images={product.images} name={product.name} sizes="(min-width: 768px) 50vw, 100vw" />
        </div>

        {/* 右パネル（PC はスティッキー） */}
        <div className="md:sticky md:top-20 md:self-start">
          <p className="text-[11px] tracking-widest text-graphite uppercase">
            {product.category.name}
          </p>
          <h1 className="mt-2 text-2xl tracking-wide">{product.name}</h1>
          <p className="mt-2 text-lg">¥{product.price.toLocaleString("ja-JP")}</p>

          {/* 配送目安。静的（docs/01-sitemap-pages.md） */}
          <div className="mt-6 border border-ink px-4 py-3 text-xs tracking-widest uppercase">
            Shipping: 3–5 Business Days
          </div>

          {/* F3b: ここに VariantSelector（色スウォッチ / サイズセレクタ / ADD TO CART）が入る */}

          {/* アコーディオンは JS 不要の <details> で実装（CC 化を避ける） */}
          <div className="mt-10 divide-y divide-ink border-t border-b border-ink">
            <details className="py-4">
              <summary className="cursor-pointer text-xs tracking-widest uppercase">
                Description
              </summary>
              <p className="mt-3 text-sm leading-loose text-graphite">{product.description}</p>
            </details>

            <details className="py-4">
              <summary className="cursor-pointer text-xs tracking-widest uppercase">
                Material &amp; Care
              </summary>
              <p className="mt-3 text-sm leading-loose text-graphite">{product.material}</p>
              {product.care && (
                <p className="mt-2 text-sm leading-loose text-graphite">{product.care}</p>
              )}
            </details>

            {product.size_chart && (
              <details className="py-4">
                <summary className="cursor-pointer text-xs tracking-widest uppercase">
                  Size Guide
                </summary>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr>
                        <th className="py-1 pr-4 text-graphite uppercase">Size</th>
                        {product.size_chart.columns.map((column) => (
                          <th key={column} className="py-1 pr-4 text-graphite uppercase">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(product.size_chart.rows).map(([size, values]) => (
                        <tr key={size} className="border-t border-mist">
                          <td className="py-1 pr-4">{size}</td>
                          {values.map((value, index) => (
                            <td key={index} className="py-1 pr-4">
                              {value}
                              {product.size_chart!.unit}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}

            <details className="py-4">
              <summary className="cursor-pointer text-xs tracking-widest uppercase">
                Shipping &amp; Returns
              </summary>
              <p className="mt-3 text-sm leading-loose text-graphite">
                Standard shipping takes 3–5 business days. Returns are accepted within 14 days
                of delivery, unworn and in original packaging.
              </p>
            </details>
          </div>

          <div className="mt-6 flex gap-6 text-[11px] tracking-widest text-graphite uppercase">
            <p>Origin: {product.origin}</p>
            <p>Product Code: {product.product_code}</p>
          </div>
        </div>
      </div>

      {product.related.length > 0 && (
        <section className="mt-24 border-t border-ink pt-16">
          <h2 className="mb-10 text-2xl font-medium tracking-[0.15em] uppercase">
            You May Also Like
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
            {product.related.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
