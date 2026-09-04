import type { Metadata } from "next";

import PasswordForm from "@/components/account/PasswordForm";
import ProfileForm from "@/components/account/ProfileForm";
import { requireAuth } from "@/lib/auth";

export const metadata: Metadata = { title: "Profile" };

/** プロフィール（docs/01-sitemap-pages.md の `/account/profile`）。氏名・メール変更 / パスワード変更。 */
export default async function ProfilePage() {
  const { user } = await requireAuth("/account/profile");

  return (
    <div className="mx-auto max-w-sm px-6 py-12">
      <h1 className="mb-10 text-2xl tracking-[0.15em] uppercase">Profile</h1>

      <ProfileForm user={user} />

      <hr className="my-12 border-mist" />

      <h2 className="mb-6 text-[11px] tracking-widest text-graphite uppercase">Password</h2>
      <PasswordForm />
    </div>
  );
}
