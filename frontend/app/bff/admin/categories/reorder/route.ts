// ブラウザ → PUT /bff/admin/categories/reorder → Laravel /api/admin/categories/reorder。

import { NextResponse } from "next/server";

import { reorderCategories } from "@/lib/admin/categories";
import { apiErrorResponse } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";

export async function PUT(request: Request) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const body = await request.json();

  try {
    await reorderCategories(token, body.order);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
