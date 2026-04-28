import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-auth-session";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type DiscoveryItem = {
  id: string;
  item_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  malzeme_birim_fiyat: number;
  montaj_birim_fiyat: number;
  kesif_turu: "on_kesif" | "kesin_kesif";
  created_at: string;
};
type BudgetRow = { allocated_budget: number; note: string | null };

type GroupStat = { label: string; total: number };
type Segment = { label: string; total: number; color: string };

function formatTry(value: number) {
  return value.toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  });
}

function buildDonutStyle(segments: Segment[]) {
  if (segments.length === 0) {
    return "conic-gradient(#e4e4e7 0deg 360deg)";
  }

  const total = segments.reduce((sum, s) => sum + s.total, 0);
  let cursor = 0;
  const parts = segments.map((segment) => {
    const slice = (segment.total / total) * 360;
    const start = cursor;
    const end = cursor + slice;
    cursor = end;
    return `${segment.color} ${start}deg ${end}deg`;
  });
  return `conic-gradient(${parts.join(",")})`;
}

export default async function AnalizPage() {
  const session = await getAppSession();
  if (!session) redirect("/login");

  let items: DiscoveryItem[] = [];
  let budget: BudgetRow | null = null;
  let fetchError: string | null = null;

  try {
    const admin = createAdminClient();
    const [{ data, error }, { data: budgetData }] = await Promise.all([
      admin
        .from("discovery_items")
        .select(
          "id, item_name, unit, quantity, unit_price, malzeme_birim_fiyat, montaj_birim_fiyat, kesif_turu, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(1000),
      admin
        .from("project_budgets")
        .select("allocated_budget, note")
        .eq("scope", "global")
        .maybeSingle(),
    ]);
    if (error) fetchError = error.message;
    else items = data ?? [];
    budget = budgetData ?? null;
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "Bağlantı hatası";
  }

  const lines = items.map((item) => ({
    ...item,
    lineTotal:
      Number(item.quantity) *
      (Number(item.malzeme_birim_fiyat) + Number(item.montaj_birim_fiyat)),
  }));

  const totalAmount = lines.reduce((sum, item) => sum + item.lineTotal, 0);
  const onKesifTotal = lines
    .filter((item) => item.kesif_turu === "on_kesif")
    .reduce((sum, item) => sum + item.lineTotal, 0);
  const kesinKesifTotal = lines
    .filter((item) => item.kesif_turu === "kesin_kesif")
    .reduce((sum, item) => sum + item.lineTotal, 0);
  const allocatedBudget = Number(budget?.allocated_budget ?? 0);
  const remainingBudget = allocatedBudget - kesinKesifTotal;
  const budgetUsagePct =
    allocatedBudget > 0 ? (kesinKesifTotal / allocatedBudget) * 100 : 0;
  const projectedUsagePct =
    allocatedBudget > 0 ? ((kesinKesifTotal + onKesifTotal) / allocatedBudget) * 100 : 0;
  const projectedRemaining = allocatedBudget - (kesinKesifTotal + onKesifTotal);
  const totalCount = lines.length;
  const avgUnitPrice =
    totalCount === 0
      ? 0
      : lines.reduce((sum, item) => sum + Number(item.unit_price), 0) / totalCount;

  const topItems = [...lines]
    .sort((a, b) => b.lineTotal - a.lineTotal)
    .slice(0, 10);

  const byUnitMap = new Map<string, number>();
  for (const row of lines) {
    const unit = row.unit || "Belirsiz";
    byUnitMap.set(unit, (byUnitMap.get(unit) ?? 0) + row.lineTotal);
  }
  const byUnit: GroupStat[] = [...byUnitMap.entries()]
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => b.total - a.total);

  const top5Share = (() => {
    if (totalAmount <= 0) return 0;
    const top5 = [...topItems].slice(0, 5).reduce((sum, r) => sum + r.lineTotal, 0);
    return (top5 / totalAmount) * 100;
  })();

  const mukayeseliFark = kesinKesifTotal - onKesifTotal;
  const mukayeseliFarkPct =
    onKesifTotal > 0 ? (mukayeseliFark / onKesifTotal) * 100 : 0;
  const mukayeseliState =
    mukayeseliFarkPct > 20
      ? "ciddi_artis"
      : mukayeseliFarkPct > 0
      ? "artis"
      : mukayeseliFarkPct < 0
      ? "azalis"
      : "esit";

  const byDateMap = new Map<string, number>();
  for (const row of lines) {
    const date = new Date(row.created_at).toISOString().slice(0, 10);
    byDateMap.set(date, (byDateMap.get(date) ?? 0) + row.lineTotal);
  }
  const trend = [...byDateMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, total]) => ({ date, total }));

  const maxTrend = Math.max(1, ...trend.map((x) => x.total));
  const colors = ["#2563eb", "#0ea5e9", "#f59e0b", "#22c55e", "#ec4899", "#a855f7"];
  const byUnitTop = byUnit.slice(0, 4);
  const byUnitOtherTotal = byUnit.slice(4).reduce((sum, row) => sum + row.total, 0);
  const byUnitSegments: Segment[] = byUnitTop.map((row, idx) => ({
    label: row.label,
    total: row.total,
    color: colors[idx % colors.length],
  }));
  if (byUnitOtherTotal > 0) {
    byUnitSegments.push({
      label: "Diğer",
      total: byUnitOtherTotal,
      color: "#71717a",
    });
  }
  const donutBg = buildDonutStyle(byUnitSegments);

  return (
    <div className="min-h-full bg-gradient-to-b from-zinc-100 via-zinc-50 to-white px-4 py-10 text-zinc-900">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Analiz Paneli</h1>
              <p className="mt-1 text-sm text-zinc-600">
                Keşif maliyetini tek bakışta gör, yoğunluğu ve trendi takip et.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/kesif"
                className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100"
              >
                Keşif
              </Link>
              <Link
                href="/"
                className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100"
              >
                Ana sayfa
              </Link>
            </div>
          </div>
          <p className="mt-3 text-xs text-zinc-600">
            {session.username} • Rol:{" "}
            <b className="font-semibold text-zinc-800">{session.role}</b>
          </p>
        </header>

        {fetchError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {fetchError}
          </p>
        ) : null}

        {!fetchError ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <article className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-500 to-indigo-600 p-4 text-white shadow-sm">
                <p className="text-xs text-blue-100">Toplam Keşif Tutarı</p>
                <p className="mt-2 text-2xl font-semibold">{formatTry(totalAmount)}</p>
              </article>
              <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <p className="text-xs text-zinc-500">Toplam Kalem</p>
                <p className="mt-2 text-2xl font-semibold">
                  {totalCount.toLocaleString("tr-TR")}
                </p>
              </article>
              <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <p className="text-xs text-zinc-500">Ortalama Birim Fiyat</p>
                <p className="mt-2 text-2xl font-semibold">{formatTry(avgUnitPrice)}</p>
              </article>
              <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <p className="text-xs text-zinc-500">İlk 5 Kalem Yoğunluğu</p>
                <p className="mt-2 text-2xl font-semibold">%{top5Share.toFixed(1)}</p>
              </article>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-medium text-zinc-700">Bütçe Karşılaştırma</h2>
                <Link href="/butce" className="text-xs text-zinc-600 underline">
                  Bütçeyi düzenle
                </Link>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <p className="text-xs text-zinc-500">Ayrılan Bütçe</p>
                  <p className="mt-1 text-lg font-semibold">{formatTry(allocatedBudget)}</p>
                </div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <p className="text-xs text-zinc-500">Kesin Keşif (Düşen)</p>
                  <p className="mt-1 text-lg font-semibold">{formatTry(kesinKesifTotal)}</p>
                </div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <p className="text-xs text-zinc-500">Kalan Bütçe</p>
                  <p
                    className={`mt-1 text-lg font-semibold ${
                      remainingBudget < 0 ? "text-red-700" : "text-zinc-900"
                    }`}
                  >
                    {formatTry(remainingBudget)}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <p className="text-xs text-zinc-500">Kullanım</p>
                  <p
                    className={`mt-1 text-lg font-semibold ${
                      budgetUsagePct > 100
                        ? "text-red-700"
                        : budgetUsagePct > 90
                        ? "text-amber-700"
                        : "text-emerald-700"
                    }`}
                  >
                    %{Number.isFinite(budgetUsagePct) ? budgetUsagePct.toFixed(1) : "0.0"}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <p className="text-xs text-zinc-500">Ön Keşif (Tahmini)</p>
                  <p className="mt-1 text-lg font-semibold">{formatTry(onKesifTotal)}</p>
                </div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <p className="text-xs text-zinc-500">Tahmini Kalan</p>
                  <p
                    className={`mt-1 text-lg font-semibold ${
                      projectedRemaining < 0 ? "text-red-700" : "text-zinc-900"
                    }`}
                  >
                    {formatTry(projectedRemaining)}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <p className="text-xs text-zinc-500">Tahmini Kullanım</p>
                  <p
                    className={`mt-1 text-lg font-semibold ${
                      projectedUsagePct > 100
                        ? "text-red-700"
                        : projectedUsagePct > 90
                        ? "text-amber-700"
                        : "text-emerald-700"
                    }`}
                  >
                    %{Number.isFinite(projectedUsagePct) ? projectedUsagePct.toFixed(1) : "0.0"}
                  </p>
                </div>
              </div>
              {budget?.note ? (
                <p className="mt-2 text-xs text-zinc-500">Not: {budget.note}</p>
              ) : null}
            </section>

            <section
              className={`rounded-2xl border p-5 shadow-sm ${
                mukayeseliState === "ciddi_artis"
                  ? "border-red-200 bg-red-50"
                  : mukayeseliState === "artis"
                  ? "border-amber-200 bg-amber-50"
                  : mukayeseliState === "azalis"
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-zinc-200 bg-white"
              }`}
            >
              <h2 className="text-sm font-medium text-zinc-700">Mukayeseli Keşif</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-white/70 p-3">
                  <p className="text-xs text-zinc-500">Ön Keşif</p>
                  <p className="mt-1 text-lg font-semibold">{formatTry(onKesifTotal)}</p>
                </div>
                <div className="rounded-xl bg-white/70 p-3">
                  <p className="text-xs text-zinc-500">Kesin Keşif</p>
                  <p className="mt-1 text-lg font-semibold">{formatTry(kesinKesifTotal)}</p>
                </div>
                <div className="rounded-xl bg-white/70 p-3">
                  <p className="text-xs text-zinc-500">Fark</p>
                  <p className="mt-1 text-lg font-semibold">{formatTry(mukayeseliFark)}</p>
                </div>
                <div className="rounded-xl bg-white/70 p-3">
                  <p className="text-xs text-zinc-500">Değişim</p>
                  <p className="mt-1 text-lg font-semibold">
                    %{Number.isFinite(mukayeseliFarkPct) ? mukayeseliFarkPct.toFixed(1) : "0.0"}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-zinc-600">
                {mukayeseliState === "ciddi_artis"
                  ? "Uyarı: Kesin keşif ön keşife göre %20 üzerinde arttı."
                  : mukayeseliState === "artis"
                  ? "Kesin keşifte artış var; revizyon ve iş artışı kalemlerini kontrol edin."
                  : mukayeseliState === "azalis"
                  ? "Kesin keşif ön keşife göre azalmış görünüyor."
                  : "Ön keşif ve kesin keşif aynı seviyede."}
              </p>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-medium text-zinc-700">Birim Bazlı Dağılım</h2>
                <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                  <div
                    className="relative h-44 w-44 rounded-full"
                    style={{ backgroundImage: donutBg }}
                  >
                    <div className="absolute inset-[28px] rounded-full bg-white" />
                    <div className="absolute inset-0 flex items-center justify-center text-center">
                      <div>
                        <p className="text-[11px] text-zinc-500">Toplam</p>
                        <p className="text-sm font-semibold">{formatTry(totalAmount)}</p>
                      </div>
                    </div>
                  </div>
                  <ul className="w-full space-y-2">
                    {byUnitSegments.length === 0 ? (
                      <li className="text-sm text-zinc-500">Veri yok.</li>
                    ) : (
                      byUnitSegments.map((row) => {
                        const ratio = totalAmount > 0 ? (row.total / totalAmount) * 100 : 0;
                        return (
                          <li
                            key={row.label}
                            className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: row.color }}
                              />
                              <span className="text-sm text-zinc-700">{row.label}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-zinc-500">%{ratio.toFixed(1)}</p>
                              <p className="text-xs font-medium text-zinc-700">
                                {formatTry(row.total)}
                              </p>
                            </div>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </div>
              </article>

              <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-medium text-zinc-700">Son 14 Gün Trend</h2>
                <ul className="mt-4 space-y-3">
                  {trend.length === 0 ? (
                    <li className="text-sm text-zinc-500">Veri yok.</li>
                  ) : (
                    trend.map((row) => {
                      const width = Math.max(4, (row.total / maxTrend) * 100);
                      return (
                        <li key={row.date}>
                          <div className="mb-1 flex justify-between text-xs text-zinc-600">
                            <span>{new Date(row.date).toLocaleDateString("tr-TR")}</span>
                            <span>{formatTry(row.total)}</span>
                          </div>
                          <div className="h-2 w-full rounded bg-zinc-100">
                            <div
                              className="h-2 rounded bg-gradient-to-r from-emerald-500 to-cyan-500"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </li>
                      );
                    })
                  )}
                </ul>
              </article>
            </section>

            <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="border-b border-zinc-100 px-4 py-3">
                <h2 className="text-sm font-medium text-zinc-700">En Yüksek Maliyetli 10 Kalem</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-zinc-100 text-left text-zinc-700">
                  <tr>
                    <th className="px-3 py-2">Kalem</th>
                    <th className="px-3 py-2">Birim</th>
                    <th className="px-3 py-2 text-right">Miktar</th>
                    <th className="px-3 py-2 text-right">Birim Fiyat</th>
                    <th className="px-3 py-2 text-right">Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {topItems.length === 0 ? (
                    <tr>
                      <td className="px-3 py-4 text-zinc-500" colSpan={5}>
                        Henüz veri yok.
                      </td>
                    </tr>
                  ) : (
                    topItems.map((item) => (
                      <tr key={item.id} className="border-t border-zinc-100">
                        <td className="px-3 py-2">{item.item_name}</td>
                        <td className="px-3 py-2">{item.unit}</td>
                        <td className="px-3 py-2 text-right">
                          {item.quantity.toLocaleString("tr-TR")}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatTry(item.unit_price)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {formatTry(item.lineTotal)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
