"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { signUpWithPassword } from "@/app/(auth)/register/actions";
import { registerSchema, type RegisterFormValues } from "@/app/(auth)/register/schema";

export function RegisterForm() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormValues>({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: ""
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    setAuthError(null);
    setVerificationNotice(null);

    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "email" || field === "password" || field === "confirmPassword") {
          setError(field, {
            type: "manual",
            message: issue.message
          });
        }
      }
      return;
    }

    const result = await signUpWithPassword(parsed.data);
    if (!result.ok) {
      setAuthError(result.error ?? "Registration failed.");
      return;
    }

    if (result.requiresEmailVerification) {
      setVerificationNotice("Account created. Please verify your email to continue.");
      return;
    }

    router.replace("/");
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
          placeholder="En az 8 karakter"
          type="password"
          {...register("password")}
        />
        {errors.password ? <span className="mt-1 block text-xs text-critical">{errors.password.message}</span> : null}
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-ink">Password (Tekrar)</span>
        <input
          className="focus-ring w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-sm"
          placeholder="Re-enter password"
          type="password"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword ? <span className="mt-1 block text-xs text-critical">{errors.confirmPassword.message}</span> : null}
      </label>

      {authError ? (
        <p aria-live="polite" className="rounded-xl border border-critical/30 bg-critical/10 px-3 py-2 text-xs text-critical">
          {authError}
        </p>
      ) : null}

      {verificationNotice ? (
        <p aria-live="polite" className="rounded-xl border border-brand/30 bg-brand-soft px-3 py-2 text-xs text-ink">
          {verificationNotice}
        </p>
      ) : null}

      <button
        className="focus-ring w-full rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Creating account..." : "Create Account"}
      </button>

      <p className="text-center text-xs text-text-secondary">
        Already have an account?{" "}
        <Link className="font-semibold text-ink underline underline-offset-2" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
