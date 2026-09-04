// ─────────────────────────────────────────────────────────────
// Laravel API を呼ぶための共通ヘルパー（サーバー側専用）。
//
// BFF 構成なので、このファイルの関数は必ず「サーバー側」
// （Server Component / Route Handler / Server Action）から呼ぶこと。
// ブラウザから import して使うと API_URL が undefined になる
// （NEXT_PUBLIC_ が付いていない環境変数はクライアントに渡らない）。
//
// キャッシュ制御・認証トークンの付与は、実際にその機能を作る Step で足していく。
// ─────────────────────────────────────────────────────────────

// Laravel のベース URL。
// ローカル: http://backend:8080（compose ネットワーク内のコンテナ名。docker-compose.yml で注入）
// 本番:     http://backend.railway.internal:8080（Railway 内部ネットワーク）
const API_URL = process.env.API_URL;

/**
 * Laravel が非 2xx を返したときに投げる例外。
 * - status … 呼び出し側が「404 だけ notFound() にしたい」等の分岐に使う
 * - body … Laravel が返した JSON をパースしたもの（422 の { message, errors } 等）。
 *   BFF Route Handler がこれをそのままブラウザに中継すれば、フォーム側で
 *   フィールドごとのエラーメッセージを表示できる（F5 以降）
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Laravel API を叩いて JSON を返す。
 *
 * @param path  "/api/health" のような先頭スラッシュ付きのパス
 * @param init  fetch の追加オプション（method / headers / body など）
 */
export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  if (!API_URL) {
    // 環境変数の設定漏れを早期に検知する
    throw new Error("API_URL が未設定です（docker-compose.yml / .env を確認）");
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
    // 個人化データやヘルスチェックは毎回最新。
    // カタログの ISR（next: { tags }）は管理画面フェーズで足す。
    cache: "no-store",
  });

  if (!res.ok) {
    // Laravel のエラーレスポンスは基本 JSON なのでパースを試み、失敗したら生テキスト
    const text = await res.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      // JSON でなければ生テキストのまま
    }
    throw new ApiError(
      res.status,
      `API ${path} が ${res.status} を返しました: ${text.slice(0, 200)}`,
      body,
    );
  }

  // 204 No Content は本文が空なので res.json() するとパースエラーになる
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
