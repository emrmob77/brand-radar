"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

type ToastMessage = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastInput = Omit<ToastMessage, "id">;

type ToastContextValue = {
  notify: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function toastStyle(variant: ToastVariant) {
  if (variant === "success") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (variant === "error") return "border-red-200 bg-red-50 text-red-900";
  return "border-sky-200 bg-sky-50 text-sky-900";
}

type ToastProviderProps = {
  children: React.ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    (input: ToastInput) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, ...input }]);

      window.setTimeout(() => {
        dismiss(id);
      }, 4200);
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed right-3 top-3 z-[120] flex w-full max-w-sm flex-col gap-2 sm:right-5 sm:top-5">
        {toasts.map((toast) => (
          <section
            className={cn("pointer-events-auto rounded-xl border p-3 shadow-[0_10px_26px_rgba(17,19,24,0.14)]", toastStyle(toast.variant))}
            key={toast.id}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description ? <p className="mt-1 text-xs">{toast.description}</p> : null}
              </div>
              <button
                aria-label="Dismiss notification"
                className="focus-ring inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg border border-current/20 bg-white/50 text-current"
                onClick={() => dismiss(toast.id)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </section>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
}
