// ─────────────────────────────────────────────────────────────
// 認証まわりのサーバー側専用ヘルパー（Route Handler から使う）。
// - Cookie 管理: トークンは httpOnly Cookie に入れ、ブラウザの JS からは触れないようにする
// - Laravel 呼び出し: app/bff/**\/route.ts を薄く保てるよう、実処理はここに置く
// ─────────────────────────────────────────────────────────────

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import { apiFetch } from "@/lib/api";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import type { ApiResource, LoginPayload, RegisterPayload, User } from "@/lib/types";

const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

type AuthResult = { user: User; token: string };

/** Server Component / Route Handler から、ログイン中のトークンを読む */
export async function getSessionToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value;
}

/**
 * ログイン / 会員登録成功時に呼ぶ。httpOnly / secure(本番のみ) / sameSite=lax / 30日
 * （docs/03-api.md・docs/08 §4 の Cookie 仕様）。
 */
export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS_SECONDS,
  });
}

/** ログアウト時に呼ぶ */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE_NAME);
}

/** POST /api/register（app/bff/register/route.ts から） */
export async function registerUser(payload: RegisterPayload): Promise<AuthResult> {
  const result = await apiFetch<ApiResource<User> & { token: string }>("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { user: result.data, token: result.token };
}

/** POST /api/login（app/bff/login/route.ts から） */
export async function loginUser(payload: LoginPayload): Promise<AuthResult> {
  const result = await apiFetch<ApiResource<User> & { token: string }>("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { user: result.data, token: result.token };
}

/** POST /api/logout（app/bff/logout/route.ts から）。現在のトークンだけ失効 */
export async function logoutUser(token: string): Promise<void> {
  await apiFetch("/api/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

/** GET /api/me（app/bff/me/route.ts から） */
export async function fetchCurrentUser(token: string): Promise<User> {
  const result = await apiFetch<ApiResource<User>>("/api/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return result.data;
}
