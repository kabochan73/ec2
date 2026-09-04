"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import type { ApiResource, User } from "@/lib/types";

/**
 * ヘッダーの ACCOUNT リンク。ログイン状態を /bff/me で確認し、遷移先を出し分ける
 * （未ログイン: /login、ログイン中: /account。docs/01-sitemap-pages.md）。
 *
 * Server Component（Header）で cookies() を読んでこれをやると、そのページ全体が
 * 動的レンダリングになる（ISR が効かなくなる）ため、あえてクライアント側で判定する。
 * マウント直後は一瞬「未ログイン扱い」になるが許容。ログイン/ログアウトのフォームが
 * invalidateQueries(['session']) を呼ぶので、そのタイミングで貼り直される。
 */
export default function AccountLink() {
  const { data } = useQuery({
    queryKey: ["session"],
    queryFn: async (): Promise<ApiResource<User> | null> => {
      const res = await fetch("/bff/me");
      if (!res.ok) {
        return null;
      }
      return res.json();
    },
    staleTime: 60_000, // 1分はキャッシュを使い、ページ遷移のたびに叩き直さない
  });

  return (
    <Link
      href={data ? "/account" : "/login"}
      className="transition-opacity hover:opacity-60"
    >
      ACCOUNT
    </Link>
  );
}
