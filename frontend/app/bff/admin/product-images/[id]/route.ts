// ブラウザ → DELETE /bff/admin/product-images/{id} → Laravel /api/admin/product-images/{id}。
// 商品配下ではなくフラットなパス（docs/05-admin.md）。

import { NextResponse } from "next/server";

import { deleteProductImage } from "@/lib/admin/images";
import { apiErrorResponse } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deleteProductImage(token, Number(id));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
