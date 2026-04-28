"use client";

import { useActionState } from "react";
import { saveBudget } from "./actions";

export function ButceForm({
  initialBudget,
  initialNote,
}: {
  initialBudget: number;
  initialNote: string;
}) {
  const [state, formAction, pending] = useActionState(saveBudget, null);

  return (
    <form action={formAction} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {state?.message ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 sm:col-span-2">
          {state.message}
        </p>
      ) : null}
      {state?.success ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 sm:col-span-2">
          Bütçe kaydedildi.
        </p>
      ) : null}

      <input
        name="allocated_budget"
        type="number"
        step="0.01"
        min="0"
        required
        defaultValue={Number.isFinite(initialBudget) ? initialBudget : 0}
        placeholder="Ayrılan bütçe (TL)"
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
      />
      <input
        name="note"
        defaultValue={initialNote}
        placeholder="Not (opsiyonel)"
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
      />

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 sm:col-span-2"
      >
        {pending ? "Kaydediliyor..." : "Bütçeyi kaydet"}
      </button>
    </form>
  );
}
