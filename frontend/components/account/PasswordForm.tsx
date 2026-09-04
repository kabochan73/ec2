"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import Field from "@/components/ui/Field";
import { passwordSchema, type PasswordFormValues } from "@/lib/schemas/password";

export default function PasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema) });

  async function onSubmit(values: PasswordFormValues) {
    setServerError(null);
    setSuccess(false);

    const res = await fetch("/bff/me/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      // current_password:sanctum の不一致もここ（422 の errors.current_password）
      const body = await res.json().catch(() => null);
      const firstFieldError = body?.errors
        ? (Object.values(body.errors)[0] as string[])?.[0]
        : undefined;
      setServerError(firstFieldError ?? body?.message ?? "変更に失敗しました。");
      return;
    }

    reset();
    setSuccess(true);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <Field
        label="Current Password"
        id="current_password"
        type="password"
        autoComplete="current-password"
        error={errors.current_password?.message}
        {...register("current_password")}
      />
      <Field
        label="New Password"
        id="password"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <Field
        label="Confirm New Password"
        id="password_confirmation"
        type="password"
        autoComplete="new-password"
        error={errors.password_confirmation?.message}
        {...register("password_confirmation")}
      />

      {serverError && <p className="text-xs text-graphite">{serverError}</p>}
      {success && !serverError && <p className="text-xs text-graphite">Password updated.</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-ink px-6 py-3 text-xs tracking-widest text-paper uppercase transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        {isSubmitting ? "..." : "Change Password"}
      </button>
    </form>
  );
}
