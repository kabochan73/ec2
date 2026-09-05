// ブラウザ → PUT /bff/admin/products/{id}/images/reorder → Laravel の同パス。

import { NextResponse } from "next/server";

import { reorderProductImages } from "@/lib/admin/images";
import { apiErrorResponse } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  try {
    await reorderProductImages(token, Number(id), body.order);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
