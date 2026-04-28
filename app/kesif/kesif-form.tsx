"use client";

import { useActionState } from "react";
import { submitKesifItem } from "./actions";

export function KesifForm() {
  const [state, formAction, pending] = useActionState(submitKesifItem, null);

  return (
    <form action={formAction} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {state?.message ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 sm:col-span-2">
          {state.message}
        </p>
      ) : null}
      {state?.success ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 sm:col-span-2">
          Kalem eklendi.
        </p>
      ) : null}

      <input
        name="grup_kodu"
        placeholder="Grup kodu (ör. 100)"
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
      />
      <input
        name="poz_no"
        placeholder="Poz No (ör. ÖBF.101)"
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
      />
      <input
        name="item_name"
        required
        placeholder="Tanım (ör. C25 beton dökümü)"
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2 sm:col-span-2"
      />
      <select
        name="unit"
        required
        defaultValue="adet"
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
      >
        <option value="adet">adet</option>
        <option value="m">m</option>
        <option value="m2">m2</option>
        <option value="m3">m3</option>
        <option value="kg">kg</option>
        <option value="ton">ton</option>
      </select>
      <input
        name="quantity"
        type="number"
        step="0.01"
        min="0.01"
        required
        placeholder="Miktar"
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
      />
      <select
        name="kesif_turu"
        defaultValue="on_kesif"
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
      >
        <option value="on_kesif">Ön keşif</option>
        <option value="kesin_kesif">Kesin keşif</option>
      </select>
      <select
        name="durum"
        defaultValue="taslak"
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
      >
        <option value="taslak">Taslak</option>
        <option value="onayli">Onaylı</option>
      </select>
      <input
        name="malzeme_birim_fiyat"
        type="number"
        step="0.01"
        min="0"
        required
        placeholder="Malzeme birim fiyat (TL)"
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
      />
      <input
        name="montaj_birim_fiyat"
        type="number"
        step="0.01"
        min="0"
        required
        placeholder="Montaj birim fiyat (TL)"
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
      />

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 sm:col-span-2"
      >
        {pending ? "Ekleniyor..." : "Kalem ekle"}
      </button>
    </form>
  );
}
