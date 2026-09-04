// ─────────────────────────────────────────────────────────────
// 認証まわりのサーバー側専用ヘルパー（Route Handler から使う）。
// - Cookie 管理: トークンは httpOnly Cookie に入れ、ブラウザの JS からは触れないようにする
// - Laravel 呼び出し: app/bff/**\/route.ts を薄く保てるよう、実処理はここに置く
// ─────────────────────────────────────────────────────────────

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextResponse } from "next/server";

import { ApiError, apiFetch } from "@/lib/api";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import type {
  ApiResource,
  LoginPayload,
  RegisterPayload,
  UpdatePasswordPayload,
  UpdateProfilePayload,
  User,
} from "@/lib/types";

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

/** PUT /api/me（app/bff/me/route.ts から。氏名・メール変更） */
export async function updateProfile(
  token: string,
  payload: UpdateProfilePayload,
): Promise<User> {
  const result = await apiFetch<ApiResource<User>>("/api/me", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return result.data;
}

/** PUT /api/me/password（app/bff/me/password/route.ts から）。成功時 204、本文なし */
export async function updatePassword(
  token: string,
  payload: UpdatePasswordPayload,
): Promise<void> {
  await apiFetch<void>("/api/me/password", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * 要ログインの Server Component（/account 系）の先頭で呼ぶ。
 * middleware は Cookie の有無しか見ていないので、ここでトークンの有効性まで確認し、
 * 無い/失効していれば `/login?redirect=<戻り先>` へ飛ばす。
 */
export async function requireAuth(
  redirectTo: string,
): Promise<{ user: User; token: string }> {
  const loginPath = `/login?redirect=${encodeURIComponent(redirectTo)}`;
  const token = await getSessionToken();
  if (!token) {
    redirect(loginPath);
  }

  try {
    const user = await fetchCurrentUser(token);
    return { user, token };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect(loginPath);
    }
    throw error;
  }
}
