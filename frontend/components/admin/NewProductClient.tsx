"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import ProductForm from "@/components/admin/ProductForm";
import type { AdminProductPayload, ApiResource, Category, AdminProduct } from "@/lib/types";

type NewProductClientProps = {
  categories: Category[];
};

export default function NewProductClient({ categories }: NewProductClientProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(payload: AdminProductPayload) {
    setError(null);
    const res = await fetch("/bff/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? "作成に失敗しました。");
      return;
    }
    const body: ApiResource<AdminProduct> = await res.json();
    router.push(`/admin/products/${body.data.id}`);
  }

  return (
    <div>
      {error && <p className="mb-6 text-xs text-graphite">{error}</p>}
      <ProductForm categories={categories} onSubmit={handleSubmit} submitLabel="Create" />
    </div>
  );
}
