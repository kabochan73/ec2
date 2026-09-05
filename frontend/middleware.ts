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

// /admin は role=admin の確認も要るが、/account と同じく Cookie 有無だけの軽量チェックに留め、
// 実際の権限確認は requireAdmin()（Server Component 側）で行う（docs/05-admin.md からの変更点）。
export const config = {
  matcher: ["/checkout/:path*", "/account/:path*", "/admin/:path*"],
};
