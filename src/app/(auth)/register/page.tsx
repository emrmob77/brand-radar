import { RegisterForm } from "@/app/(auth)/register/register-form";

export default function RegisterPage() {
  return (
    <section className="surface-panel p-6 md:p-7">
      <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-text-secondary">Brand Radar</p>
      <h1 className="mt-2 text-2xl font-extrabold text-ink">Create Account</h1>
      <p className="mt-1 text-sm text-text-secondary">Start your enterprise GEO workspace.</p>
      <RegisterForm />
    </section>
  );
}

