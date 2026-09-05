// ブラウザ → PUT/DELETE /bff/admin/variants/{id} → Laravel /api/admin/variants/{id}。

import { NextResponse } from "next/server";

import { deleteVariant, updateVariant } from "@/lib/admin/variants";
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
    const variant = await updateVariant(token, Number(id), body);
    return NextResponse.json({ data: variant });
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
    await deleteVariant(token, Number(id));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
