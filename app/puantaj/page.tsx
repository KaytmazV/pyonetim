import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-auth-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { deletePuantaj } from "./actions";
import { PuantajForm } from "./puantaj-form";

export const dynamic = "force-dynamic";

type LaborEntry = {
  id: string;
  entry_date: string;
  ekip_adi: string;
  calisan_adi: string | null;
  gorev: string | null;
  taseron: string | null;
  grup_kodu: string | null;
  bolge: string | null;
  vardiya: "gunduz" | "gece";
  kisi_sayisi: number;
  saat: number;
  saatlik_maliyet: number;
};

function formatTry(value: number) {
  return value.toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  });
}

export default async function PuantajPage() {
  const session = await getAppSession();
  if (!session) redirect("/login");

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("labor_entries")
    .select(
      "id, entry_date, ekip_adi, calisan_adi, gorev, taseron, grup_kodu, bolge, vardiya, kisi_sayisi, saat, saatlik_maliyet"
    )
    .order("entry_date", { ascending: false })
    .limit(500);

  const rows: LaborEntry[] = data ?? [];
  const fetchError = error?.message ?? null;

  const totals = rows.reduce(
    (acc, row) => {
      const adamSaat = Number(row.kisi_sayisi) * Number(row.saat);
      const maliyet = adamSaat * Number(row.saatlik_maliyet);
      acc.adamSaat += adamSaat;
      acc.maliyet += maliyet;
      return acc;
    },
    { adamSaat: 0, maliyet: 0 }
  );

  const byGroup = new Map<string, { adamSaat: number; maliyet: number }>();
  rows.forEach((row) => {
    const key = row.grup_kodu || "-";
    const adamSaat = Number(row.kisi_sayisi) * Number(row.saat);
    const maliyet = adamSaat * Number(row.saatlik_maliyet);
    const prev = byGroup.get(key) ?? { adamSaat: 0, maliyet: 0 };
    byGroup.set(key, {
      adamSaat: prev.adamSaat + adamSaat,
      maliyet: prev.maliyet + maliyet,
    });
  });
  const groupStats = [...byGroup.entries()]
    .map(([grup, stat]) => ({ grup, ...stat }))
    .sort((a, b) => b.maliyet - a.maliyet);
  const maxGroupCost = groupStats[0]?.maliyet ?? 0;

  const byDate = new Map<string, { adamSaat: number; maliyet: number }>();
  rows.forEach((row) => {
    const key = row.entry_date;
    const adamSaat = Number(row.kisi_sayisi) * Number(row.saat);
    const maliyet = adamSaat * Number(row.saatlik_maliyet);
    const prev = byDate.get(key) ?? { adamSaat: 0, maliyet: 0 };
    byDate.set(key, {
      adamSaat: prev.adamSaat + adamSaat,
      maliyet: prev.maliyet + maliyet,
    });
  });
  const dateStats = [...byDate.entries()]
    .map(([date, stat]) => ({ date, ...stat }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const latestDay = dateStats[0] ?? null;

  return (
    <div className="min-h-full bg-zinc-50 px-4 py-10 text-zinc-900">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Puantaj</h1>
              <p className="mt-1 text-sm text-zinc-600">
                Günlük ekip kaydı, adam-saat ve işçilik maliyeti.
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/" className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100">
                Ana sayfa
              </Link>
              <Link href="/analiz" className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100">
                Analiz
              </Link>
            </div>
          </div>
          <p className="mt-3 text-xs text-zinc-600">
            {session.username} • Rol: <b className="font-semibold">{session.role}</b>
          </p>
        </header>

        {session.role === "yonetici" ? (
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-medium text-zinc-700">Yeni puantaj kaydı</h2>
            <PuantajForm />
          </section>
        ) : (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Gözlemci rolü kayıt ekleyemez; sadece puantaj raporlarını görür.
          </p>
        )}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Toplam Kayıt</p>
            <p className="mt-2 text-3xl font-semibold">{rows.length}</p>
          </article>
          <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Toplam Adam-Saat
            </p>
            <p className="mt-2 text-3xl font-semibold">{totals.adamSaat.toLocaleString("tr-TR")}</p>
          </article>
          <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Toplam İşçilik Maliyeti
            </p>
            <p className="mt-2 text-3xl font-semibold">{formatTry(totals.maliyet)}</p>
          </article>
          <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Ort. Saatlik Maliyet
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {formatTry(totals.adamSaat > 0 ? totals.maliyet / totals.adamSaat : 0)}
            </p>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-1">
            <h2 className="text-sm font-semibold text-zinc-800">Son Gün Özeti</h2>
            {latestDay ? (
              <div className="mt-3 space-y-2 text-sm">
                <p className="text-zinc-600">
                  Tarih: <b className="text-zinc-900">{new Date(latestDay.date).toLocaleDateString("tr-TR")}</b>
                </p>
                <p className="text-zinc-600">
                  Adam-saat:{" "}
                  <b className="text-zinc-900">{latestDay.adamSaat.toLocaleString("tr-TR")}</b>
                </p>
                <p className="text-zinc-600">
                  İşçilik: <b className="text-zinc-900">{formatTry(latestDay.maliyet)}</b>
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">Henüz günlük veri yok.</p>
            )}
          </article>
          <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="text-sm font-semibold text-zinc-800">Grup Bazlı İşçilik Dağılımı</h2>
            <ul className="mt-4 space-y-3">
              {groupStats.length === 0 ? (
                <li className="text-sm text-zinc-500">Henüz kayıt yok.</li>
              ) : (
                groupStats.slice(0, 8).map((g) => {
                  const ratio = maxGroupCost > 0 ? (g.maliyet / maxGroupCost) * 100 : 0;
                  return (
                    <li key={g.grup}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-zinc-800">Grup {g.grup}</span>
                        <span className="text-zinc-600">
                          {g.adamSaat.toLocaleString("tr-TR")} adam-saat • {formatTry(g.maliyet)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-100">
                        <div className="h-2 rounded-full bg-zinc-800" style={{ width: `${ratio}%` }} />
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </article>
        </section>

        {fetchError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{fetchError}</p>
        ) : null}

        {!fetchError ? (
          <section className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <table className="min-w-[1250px] w-full text-sm">
                <thead className="bg-zinc-100 text-left text-zinc-700">
                  <tr>
                    <th className="px-3 py-2">Tarih</th>
                    <th className="px-3 py-2">Ekip</th>
                    <th className="px-3 py-2">Çalışan</th>
                    <th className="px-3 py-2">Görev</th>
                    <th className="px-3 py-2">Taşeron</th>
                    <th className="px-3 py-2">Grup</th>
                    <th className="px-3 py-2">Bölge</th>
                    <th className="px-3 py-2">Vardiya</th>
                    <th className="px-3 py-2 text-right">Kişi</th>
                    <th className="px-3 py-2 text-right">Saat</th>
                    <th className="px-3 py-2 text-right">Saatlik</th>
                    <th className="px-3 py-2 text-right">Adam-Saat</th>
                    <th className="px-3 py-2 text-right">Maliyet</th>
                    <th className="px-3 py-2 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td className="px-3 py-4 text-zinc-500" colSpan={14}>
                        Henüz puantaj kaydı yok.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => {
                      const adamSaat = Number(row.kisi_sayisi) * Number(row.saat);
                      const maliyet = adamSaat * Number(row.saatlik_maliyet);
                      return (
                        <tr key={row.id} className="border-t border-zinc-100">
                          <td className="px-3 py-2">{new Date(row.entry_date).toLocaleDateString("tr-TR")}</td>
                          <td className="px-3 py-2">{row.ekip_adi}</td>
                          <td className="px-3 py-2">{row.calisan_adi ?? "-"}</td>
                          <td className="px-3 py-2">{row.gorev ?? "-"}</td>
                          <td className="px-3 py-2">{row.taseron ?? "-"}</td>
                          <td className="px-3 py-2">{row.grup_kodu ?? "-"}</td>
                          <td className="px-3 py-2">{row.bolge ?? "-"}</td>
                          <td className="px-3 py-2">{row.vardiya === "gece" ? "Gece" : "Gündüz"}</td>
                          <td className="px-3 py-2 text-right">{row.kisi_sayisi}</td>
                          <td className="px-3 py-2 text-right">{Number(row.saat).toLocaleString("tr-TR")}</td>
                          <td className="px-3 py-2 text-right">{formatTry(Number(row.saatlik_maliyet))}</td>
                          <td className="px-3 py-2 text-right">{adamSaat.toLocaleString("tr-TR")}</td>
                          <td className="px-3 py-2 text-right">{formatTry(maliyet)}</td>
                          <td className="px-3 py-2 text-right">
                            {session.role === "yonetici" ? (
                              <form action={deletePuantaj}>
                                <input type="hidden" name="id" value={row.id} />
                                <button type="submit" className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-800 hover:bg-red-100">
                                  Sil
                                </button>
                              </form>
                            ) : (
                              <span className="text-xs text-zinc-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
            </table>
          </section>
        ) : null}
      </main>
    </div>
  );
}
