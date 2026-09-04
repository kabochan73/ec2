// ブラウザ → PUT /bff/me/password → Laravel PUT /api/me/password。
// current_password:sanctum の不一致は Laravel 側で 422（errors.current_password）。

import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api";
import { getSessionToken, updatePassword } from "@/lib/auth";

export async function PUT(request: Request) {
  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const body = await request.json();

  try {
    await updatePassword(token, body);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
