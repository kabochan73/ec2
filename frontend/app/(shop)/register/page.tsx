import type { Metadata } from "next";
import { Suspense } from "react";

import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Register" };

/**
 * 会員登録画面。RegisterForm は useSearchParams（?redirect=）を使う CC なので Suspense で包む。
 */
export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
