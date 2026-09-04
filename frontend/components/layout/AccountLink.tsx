import Link from "next/link";

/**
 * ヘッダーの ACCOUNT リンク。
 *
 * F1 時点では常に /login へ飛ばすだけの Server Component。
 * F5（認証）で「ログイン中なら /account、未ログインなら /login」に出し分ける
 * Client Component（/bff/me を react-query で見る）に差し替える。
 */
export default function AccountLink() {
  return (
    <Link href="/login" className="transition-opacity hover:opacity-60">
      ACCOUNT
    </Link>
  );
}
