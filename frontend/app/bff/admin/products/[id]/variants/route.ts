// ブラウザ → POST /bff/admin/products/{id}/variants → Laravel の同パス。

import { NextResponse } from "next/server";

import { createVariant } from "@/lib/admin/variants";
import { apiErrorResponse } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  try {
    const variant = await createVariant(token, Number(id), body);
    return NextResponse.json({ data: variant }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
