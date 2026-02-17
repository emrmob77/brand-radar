"use client";

import { Menu, Plus } from "lucide-react";
import Link from "next/link";

type HeaderProps = {
  title: string;
  onOpenSidebar: () => void;
};

export function Header({ title, onOpenSidebar }: HeaderProps) {
  return (
    <header className="glass-header sticky top-0 z-20 flex h-16 items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded border border-surface-border text-text-secondary hover:text-white md:hidden"
          onClick={onOpenSidebar}
          type="button"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div>
          <p className="text-xs uppercase tracking-widest text-text-secondary">Overview</p>
          <h1 className="text-sm font-medium text-white md:text-base">{title}</h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          className="inline-flex items-center gap-2 rounded bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-dark md:text-sm"
          href="/clients/new"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </Link>
      </div>
    </header>
  );
}
