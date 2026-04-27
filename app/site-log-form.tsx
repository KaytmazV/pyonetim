"use client";

import { useActionState } from "react";
import { submitSiteLog } from "./actions";

export function SiteLogForm() {
  const [state, formAction, pending] = useActionState(submitSiteLog, null);

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-3">
      {state?.message ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.message}
        </p>
      ) : null}
      {state?.success ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Kayıt eklendi.
        </p>
      ) : null}
      <textarea
        name="note"
        required
        rows={4}
        placeholder="Bugün yapılan iş, aksaklık, ziyaret…"
        className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
        disabled={pending}
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {pending ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </form>
  );
}
