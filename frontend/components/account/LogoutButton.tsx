"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * /bff/logout を叩いて Cookie を消し、トップに戻る。
 * AccountLink の ["session"] キャッシュも「未ログイン（null）」に更新する
 * （LoginForm と同じ理由で invalidateQueries ではなく setQueryData を使う）。
 */
export default function LogoutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/bff/logout", { method: "POST" });
    queryClient.setQueryData(["session"], null);
    // replace: 戻るボタンで保護ページ（/account）に戻れないように
    router.replace("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="text-left text-xs tracking-widest text-graphite uppercase underline underline-offset-2 hover:text-ink disabled:opacity-50"
    >
      {loading ? "..." : "Logout"}
    </button>
  );
}
