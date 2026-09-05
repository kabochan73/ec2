"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import ProductForm from "@/components/admin/ProductForm";
import type { AdminProduct, AdminProductPayload, Category } from "@/lib/types";

type EditProductClientProps = {
  product: AdminProduct;
  categories: Category[];
};

/**
 * 商品編集（基本情報タブ）。画像・バリアントのタブは別ステップで追加する
 * （docs/05-admin.md の「商品編集ページの構成」）。
 */
export default function EditProductClient({ product, categories }: EditProductClientProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(payload: AdminProductPayload) {
    setError(null);
    const res = await fetch(`/bff/admin/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? "更新に失敗しました。");
      return;
    }
    router.refresh();
  }

  async function handleDelete() {
    if (!window.confirm(`「${product.name}」を削除しますか？この操作は取り消せません。`)) return;
    const res = await fetch(`/bff/admin/products/${product.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? "削除に失敗しました。");
      return;
    }
    router.push("/admin/products");
  }

  return (
    <div>
      {error && <p className="mb-6 text-xs text-graphite">{error}</p>}
      <ProductForm
        categories={categories}
        initialValues={product}
        onSubmit={handleSubmit}
        submitLabel="Save"
      />
      <button
        type="button"
        onClick={handleDelete}
        className="mt-6 text-xs tracking-widest text-graphite uppercase underline underline-offset-2 hover:text-ink"
      >
        Delete Product
      </button>
    </div>
  );
}
