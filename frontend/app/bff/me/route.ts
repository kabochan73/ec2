// ブラウザ → GET /bff/me → Laravel GET /api/me。
// AccountLink（クライアント側）がログイン状態を確認するために叩く。
// PUT /bff/me（プロフィール更新）は F6 で追加する。

import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api";
import { fetchCurrentUser, getSessionToken } from "@/lib/auth";

export async function GET() {
  const token = await getSessionToken();

  if (!token) {
    // Cookie 自体が無いので Laravel に聞くまでもなく未ログイン確定
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  try {
    const user = await fetchCurrentUser(token);
    return NextResponse.json({ data: user });
  } catch (error) {
    // トークンが失効済み等。401 をそのまま返す
    return apiErrorResponse(error);
  }
}
