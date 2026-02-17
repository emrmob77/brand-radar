export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-background-dark px-4 py-8">
      <div className="grid-pattern absolute inset-0" />
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </main>
  );
}
