// 要ログインページのガード。Cookie の有無だけを見る軽量チェックで、
// トークンの有効性そのものは各 Route Handler / Server Component が Laravel 呼び出し時に検証する
// （docs/01-sitemap-pages.md: 「未ログインで要ログインページに来たら /login?redirect=<元パス> に転送」）。
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/constants";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// /admin は role=admin の確認も要る（管理フェーズで別途）ので、ここには含めない。
export const config = {
  matcher: ["/checkout/:path*", "/account/:path*"],
};
