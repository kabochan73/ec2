// ブラウザ → POST /bff/addresses/{id}/default → Laravel /api/addresses/{id}/default。

import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api";
import { setDefaultAddress } from "@/lib/addresses";
import { getSessionToken } from "@/lib/auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const address = await setDefaultAddress(token, Number(id));
    return NextResponse.json({ data: address });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
