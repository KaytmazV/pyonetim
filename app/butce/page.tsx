import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-auth-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { ButceForm } from "./butce-form";

export const dynamic = "force-dynamic";

function formatTry(value: number) {
  return value.toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  });
}

export default async function ButcePage() {
  const session = await getAppSession();
  if (!session) redirect("/login");

  const admin = createAdminClient();
  const [{ data: budget }, { data: discoveryItems }] = await Promise.all([
    admin
      .from("project_budgets")
      .select("id, allocated_budget, note")
      .eq("scope", "global")
      .maybeSingle(),
    admin
      .from("discovery_items")
      .select("item_name, quantity, malzeme_birim_fiyat, montaj_birim_fiyat")
      .limit(2000),
  ]);

  const allocated = Number(budget?.allocated_budget ?? 0);
  const note = budget?.note ?? "";
  const totalCost = (discoveryItems ?? []).reduce(
    (sum, row) =>
      sum +
      Number(row.quantity) *
        (Number(row.malzeme_birim_fiyat) + Number(row.montaj_birim_fiyat)),
    0
  );
  const remaining = allocated - totalCost;
  const usagePct = allocated > 0 ? (totalCost / allocated) * 100 : 0;
  const levelClass =
    usagePct > 100
      ? "text-red-700"
      : usagePct > 90
      ? "text-amber-700"
      : "text-emerald-700";

  const topLines = (discoveryItems ?? [])
    .map((row) => ({
      item_name: row.item_name,
      line_total:
        Number(row.quantity) *
        (Number(row.malzeme_birim_fiyat) + Number(row.montaj_birim_fiyat)),
    }))
    .sort((a, b) => b.line_total - a.line_total)
    .slice(0, 10);

  return (
    <div className="min-h-full bg-zinc-50 px-4 py-10 text-zinc-900">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Bütçe Planı</h1>
              <p className="mt-1 text-sm text-zinc-600">
                Ayrılan bütçeyi keşif toplamı ile karşılaştır.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/kesif"
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100"
              >
                Keşif
              </Link>
              <Link
                href="/analiz"
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100"
              >
                Analiz
              </Link>
            </div>
          </div>
          <div className="mt-3 text-xs text-zinc-600">
            {session.username} • Rol: <b className="font-semibold">{session.role}</b>
          </div>
        </header>

        {session.role === "yonetici" ? (
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-medium text-zinc-700">Ayrılan bütçe girişi</h2>
            <ButceForm initialBudget={allocated} initialNote={note} />
          </section>
        ) : (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Gözlemci rolü bütçe güncelleyemez; sadece görüntüler.
          </p>
        )}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-zinc-500">Ayrılan Bütçe</p>
            <p className="mt-2 text-xl font-semibold">{formatTry(allocated)}</p>
          </article>
          <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-zinc-500">Keşif Toplamı</p>
            <p className="mt-2 text-xl font-semibold">{formatTry(totalCost)}</p>
          </article>
          <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-zinc-500">Kalan Bütçe</p>
            <p className={`mt-2 text-xl font-semibold ${remaining < 0 ? "text-red-700" : ""}`}>
              {formatTry(remaining)}
            </p>
          </article>
          <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-zinc-500">Kullanım Oranı</p>
            <p className={`mt-2 text-xl font-semibold ${levelClass}`}>
              %{Number.isFinite(usagePct) ? usagePct.toFixed(1) : "0.0"}
            </p>
          </article>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-medium text-zinc-700">En Yüksek Maliyetli Kalemler</h2>
          <ul className="mt-3 space-y-2">
            {topLines.length === 0 ? (
              <li className="text-sm text-zinc-500">Henüz keşif kalemi yok.</li>
            ) : (
              topLines.map((line, idx) => {
                const pct = totalCost > 0 ? (line.line_total / totalCost) * 100 : 0;
                return (
                  <li
                    key={`${line.item_name}-${idx}`}
                    className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2"
                  >
                    <span className="text-sm text-zinc-700">{line.item_name}</span>
                    <span className="text-xs text-zinc-600">
                      {formatTry(line.line_total)} • %{pct.toFixed(1)}
                    </span>
                  </li>
                );
              })
            )}
          </ul>
        </section>
      </main>
    </div>
  );
}
