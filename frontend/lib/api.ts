// ─────────────────────────────────────────────────────────────
// Laravel API を呼ぶための共通ヘルパー（サーバー側専用）。
//
// BFF 構成なので、このファイルの関数は必ず「サーバー側」
// （Server Component / Route Handler / Server Action）から呼ぶこと。
// ブラウザから import して使うと API_URL が undefined になる
// （NEXT_PUBLIC_ が付いていない環境変数はクライアントに渡らない）。
//
// いまは疎通確認用の最小実装。キャッシュ制御・エラー型（ApiError）・
// 認証トークンの付与などは、実際にその機能を作る Step で足していく。
// ─────────────────────────────────────────────────────────────

// Laravel のベース URL。
// ローカル: http://backend:8080（compose ネットワーク内のコンテナ名。docker-compose.yml で注入）
// 本番:     http://backend.railway.internal:8080（Railway 内部ネットワーク）
const API_URL = process.env.API_URL;

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
    // 個人化データやヘルスチェックは毎回最新を取りに行く。
    // キャッシュに乗せたい読み取り（商品一覧など）は後の Step でオプションを足す。
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `API ${path} が ${res.status} を返しました: ${text.slice(0, 200)}`,
    );
  }

  // 204 No Content は本文が空なので res.json() するとパースエラーになる
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
