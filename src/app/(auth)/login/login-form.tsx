"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { signInWithPassword } from "@/app/(auth)/login/actions";
import { type LoginFormValues, loginSchema } from "@/app/(auth)/login/schema";

export function LoginForm() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    setAuthError(null);
    const parsed = loginSchema.safeParse(values);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "email" || field === "password") {
          setError(field, {
            type: "manual",
            message: issue.message
          });
        }
      }
      return;
    }

    const result = await signInWithPassword(parsed.data);
    if (!result.ok) {
      setAuthError(result.error ?? "Sign in failed.");
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  });

  return (
    <form className="mt-6 space-y-4" noValidate onSubmit={onSubmit}>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-ink">Email</span>
        <input
          className="focus-ring w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-sm"
          placeholder="name@company.com"
          type="email"
          {...register("email")}
        />
        {errors.email ? <span className="mt-1 block text-xs text-critical">{errors.email.message}</span> : null}
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-ink">Password</span>
        <input
          className="focus-ring w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-sm"
          placeholder="••••••••"
          type="password"
          {...register("password")}
        />
        {errors.password ? <span className="mt-1 block text-xs text-critical">{errors.password.message}</span> : null}
      </label>

      {authError ? (
        <p aria-live="polite" className="rounded-xl border border-critical/30 bg-critical/10 px-3 py-2 text-xs text-critical">
          {authError}
        </p>
      ) : null}

      <button
        className="focus-ring w-full rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Signing in..." : "Continue"}
      </button>

      <p className="text-center text-xs text-text-secondary">
        No account yet?{" "}
        <Link className="font-semibold text-ink underline underline-offset-2" href="/register">
          Register
        </Link>
      </p>
    </form>
  );
}
