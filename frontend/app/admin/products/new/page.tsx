import type { Metadata } from "next";

import NewProductClient from "@/components/admin/NewProductClient";
import { fetchAdminCategories } from "@/lib/admin/categories";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "New Product | Admin" };

export default async function NewProductPage() {
  const { token } = await requireAdmin("/admin/products/new");
  const categories = await fetchAdminCategories(token);

  return (
    <div>
      <h1 className="mb-8 text-xl tracking-widest uppercase">New Product</h1>
      <NewProductClient categories={categories} />
    </div>
  );
}
