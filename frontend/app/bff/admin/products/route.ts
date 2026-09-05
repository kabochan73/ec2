// ブラウザ → POST /bff/admin/products → Laravel /api/admin/products。

import { NextResponse } from "next/server";

import { createProduct } from "@/lib/admin/products";
import { apiErrorResponse } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";

export async function POST(request: Request) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const body = await request.json();

  try {
    const product = await createProduct(token, body);
    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
