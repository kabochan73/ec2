import type { Metadata } from "next";
import { notFound } from "next/navigation";

import EditProductClient from "@/components/admin/EditProductClient";
import { fetchAdminCategories } from "@/lib/admin/categories";
import { fetchAdminProduct } from "@/lib/admin/products";
import { ApiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

type PageProps = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Edit Product | Admin" };

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const { token } = await requireAdmin(`/admin/products/${id}`);

  let product;
  try {
    product = await fetchAdminProduct(token, Number(id));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const categories = await fetchAdminCategories(token);

  return (
    <div>
      <h1 className="mb-8 text-xl tracking-widest uppercase">Edit Product</h1>
      <EditProductClient product={product} categories={categories} />
    </div>
  );
}
