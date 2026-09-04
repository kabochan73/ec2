// ブラウザ → PUT/DELETE /bff/addresses/{id} → Laravel /api/addresses/{id}。

import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api";
import { deleteAddress, updateAddress } from "@/lib/addresses";
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
    const address = await updateAddress(token, Number(id), body);
    return NextResponse.json({ data: address });
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
    await deleteAddress(token, Number(id));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
