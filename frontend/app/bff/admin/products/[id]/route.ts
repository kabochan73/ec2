// ブラウザ → GET/PUT/DELETE /bff/admin/products/{id} → Laravel /api/admin/products/{id}。
// GET は ProductImagesManager / VariantsManager の refetch() から使う
// （商品自体の初期表示は Server Component が直接 lib を呼ぶので、GET はそれ以外の再取得専用）。

import { NextResponse } from "next/server";

import { deleteProduct, fetchAdminProduct, updateProduct } from "@/lib/admin/products";
import { apiErrorResponse } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const product = await fetchAdminProduct(token, Number(id));
    return NextResponse.json({ data: product });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  try {
    const product = await updateProduct(token, Number(id), body);
    return NextResponse.json({ data: product });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deleteProduct(token, Number(id));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
