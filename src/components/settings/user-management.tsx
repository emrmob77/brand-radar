"use client";

import { format } from "date-fns";
import { useFormState, useFormStatus } from "react-dom";
import {
  initialInviteUserFormState,
  inviteUserAction
} from "@/app/(dashboard)/settings/users/actions";

type UserSummary = {
  id: string;
  fullName: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  lastLogin: string | null;
};

type ClientPermissionOption = {
  id: string;
  name: string;
};

type UserManagementProps = {
  clients: ClientPermissionOption[];
  users: UserSummary[];
};

function roleBadgeClass(role: UserSummary["role"]) {
  if (role === "admin") return "bg-red-100 text-red-700";
  if (role === "editor") return "bg-amber-100 text-amber-700";
  return "bg-sky-100 text-sky-700";
}

function SubmitInviteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      className="focus-ring inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Sending..." : "Send Invite"}
    </button>
  );
}

export function UserManagement({ clients, users }: UserManagementProps) {
  const [state, formAction] = useFormState(inviteUserAction, initialInviteUserFormState);

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
      <article className="surface-panel p-5 xl:col-span-3">
        <h2 className="text-lg font-bold text-ink">Agency Users</h2>
        <p className="mt-1 text-sm text-text-secondary">Email, role, and last login details for all team members.</p>

        <div className="mt-4 space-y-3">
          {users.length === 0 ? (
            <p className="rounded-xl border border-surface-border bg-slate-50 px-4 py-3 text-sm text-text-secondary">No users found in this agency yet.</p>
          ) : (
            users.map((user) => (
              <article className="rounded-xl border border-surface-border bg-white p-3" key={user.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-ink">{user.fullName}</p>
                    <p className="text-xs text-text-secondary">{user.email}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] ${roleBadgeClass(user.role)}`}>
                    {user.role}
                  </span>
                </div>
                <p className="mt-2 text-xs text-text-secondary">
                  Last login: {user.lastLogin ? format(new Date(user.lastLogin), "yyyy-MM-dd HH:mm") : "No login yet"}
                </p>
              </article>
            ))
          )}
        </div>
      </article>

      <article className="surface-panel p-5 xl:col-span-2">
        <h2 className="text-lg font-bold text-ink">Invite User</h2>
        <p className="mt-1 text-sm text-text-secondary">Send team invitations with role and client access permissions.</p>

        <form action={formAction} className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold text-text-secondary">Email</span>
            <input
              className="focus-ring w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-sm text-ink"
              name="email"
              placeholder="member@agency.com"
              required
              type="email"
            />
            {state.fieldErrors?.email ? <span className="mt-1 block text-xs text-critical">{state.fieldErrors.email}</span> : null}
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold text-text-secondary">Role</span>
            <select className="focus-ring w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-sm text-ink" defaultValue="viewer" name="role">
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            {state.fieldErrors?.role ? <span className="mt-1 block text-xs text-critical">{state.fieldErrors.role}</span> : null}
          </label>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-text-secondary">Client Access Permissions</legend>
            <div className="grid grid-cols-1 gap-2">
              {clients.length === 0 ? (
                <p className="rounded-lg border border-surface-border bg-slate-50 px-3 py-2 text-xs text-text-secondary">
                  Add clients first to define access permissions.
                </p>
              ) : (
                clients.map((client) => (
                  <label className="flex min-h-11 items-center gap-2 rounded-lg border border-surface-border bg-white px-3 py-2 text-sm text-ink" key={client.id}>
                    <input className="h-4 w-4 rounded border-surface-border" defaultChecked type="checkbox" name="clientIds" value={client.id} />
                    <span>{client.name}</span>
                  </label>
                ))
              )}
            </div>
            {state.fieldErrors?.clientIds ? <span className="mt-2 block text-xs text-critical">{state.fieldErrors.clientIds}</span> : null}
          </fieldset>

          {state.error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{state.error}</p>
          ) : null}
          {state.success ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{state.success}</p>
          ) : null}

          <SubmitInviteButton />
        </form>
      </article>
    </section>
  );
}
