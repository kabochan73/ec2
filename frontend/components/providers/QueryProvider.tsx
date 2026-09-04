"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * TanStack Query のプロバイダ。「クライアント主体の読み書き」で使う（docs/08 §3.2）:
 * カートの在庫再検証（F4）、ログイン状態の AccountLink（F5）、/account の CRUD（F6）、
 * 後の /admin テーブル。
 *
 * QueryClient は再レンダーを跨いで同じインスタンスを保ちたいので useState の初期値で1回だけ作る。
 * Server Component（Header 等）を children として渡しても、その部分がクライアント化される
 * わけではない（React の children 合成パターン）。
 */
export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
