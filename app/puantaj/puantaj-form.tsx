"use client";

import { useActionState } from "react";
import { submitPuantaj } from "./actions";

export function PuantajForm() {
  const [state, formAction, pending] = useActionState(submitPuantaj, null);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {state?.message ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 sm:col-span-2">
          {state.message}
        </p>
      ) : null}
      {state?.success ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 sm:col-span-2">
          Puantaj kaydı eklendi.
        </p>
      ) : null}

      <input
        type="date"
        name="entry_date"
        required
        defaultValue={today}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
      />
      <input
        name="ekip_adi"
        required
        placeholder="Ekip adı"
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
      />
      <input
        name="calisan_adi"
        required
        placeholder="Çalışan adı soyadı"
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
      />
      <input
        name="gorev"
        required
        placeholder="Görevi (örn: Kalıpçı, Usta)"
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
      />
      <input
        name="taseron"
        placeholder="Taşeron (opsiyonel)"
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
      />
      <input
        name="grup_kodu"
        placeholder="Grup kodu (100/200...)"
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
      />
      <input
        name="bolge"
        placeholder="Bölge / blok / kat"
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
      />
      <select
        name="vardiya"
        defaultValue="gunduz"
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
      >
        <option value="gunduz">Gündüz</option>
        <option value="gece">Gece</option>
      </select>
      <input
        type="number"
        min="1"
        name="kisi_sayisi"
        required
        placeholder="Kişi sayısı"
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
      />
      <input
        type="number"
        min="0.5"
        step="0.5"
        name="saat"
        required
        placeholder="Saat"
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
      />
      <input
        type="number"
        min="0"
        step="0.01"
        name="saatlik_maliyet"
        required
        placeholder="Saatlik maliyet (TL)"
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
      />
      <input
        name="notlar"
        placeholder="Not (opsiyonel)"
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
      />

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 sm:col-span-2"
      >
        {pending ? "Kaydediliyor..." : "Puantaj ekle"}
      </button>
    </form>
  );
}
