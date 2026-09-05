// ブラウザ → POST /bff/admin/categories → Laravel /api/admin/categories。
// admin かどうかの最終判定は Laravel の EnsureAdmin ミドルウェアが行う（ここは token 有無だけ見る）。

import { NextResponse } from "next/server";

import { createCategory, fetchAdminCategories } from "@/lib/admin/categories";
import { apiErrorResponse } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";

export async function GET() {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  try {
    return NextResponse.json({ data: await fetchAdminCategories(token) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const body = await request.json();

  try {
    const category = await createCategory(token, body);
    return NextResponse.json({ data: category }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
