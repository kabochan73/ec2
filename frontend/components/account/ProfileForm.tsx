"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import Field from "@/components/ui/Field";
import { profileSchema, type ProfileFormValues } from "@/lib/schemas/profile";
import type { ApiResource, User } from "@/lib/types";

export default function ProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, email: user.email },
  });

  async function onSubmit(values: ProfileFormValues) {
    setServerError(null);
    setSuccess(false);

    const res = await fetch("/bff/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const firstFieldError = body?.errors
        ? (Object.values(body.errors)[0] as string[])?.[0]
        : undefined;
      setServerError(firstFieldError ?? body?.message ?? "更新に失敗しました。");
      return;
    }

    // 更新後の user で AccountLink の ["session"] キャッシュを更新（氏名・メールが変わる）
    const body = (await res.json()) as ApiResource<User>;
    queryClient.setQueryData(["session"], body);
    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <Field
        label="Name"
        id="name"
        type="text"
        autoComplete="name"
        error={errors.name?.message}
        {...register("name")}
      />
      <Field
        label="Email"
        id="email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />

      {serverError && <p className="text-xs text-graphite">{serverError}</p>}
      {success && !serverError && <p className="text-xs text-graphite">Profile updated.</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-ink px-6 py-3 text-xs tracking-widest text-paper uppercase transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        {isSubmitting ? "..." : "Save"}
      </button>
    </form>
  );
}
