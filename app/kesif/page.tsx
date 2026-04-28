import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-auth-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteKesifItem } from "./actions";
import { KesifForm } from "./kesif-form";

export const dynamic = "force-dynamic";

type DiscoveryItem = {
  id: string;
  poz_no: string | null;
  grup_kodu: string | null;
  item_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  malzeme_birim_fiyat: number;
  montaj_birim_fiyat: number;
  kesif_turu: "on_kesif" | "kesin_kesif";
  durum: "taslak" | "onayli";
  created_at: string;
};

export default async function KesifPage() {
  const session = await getAppSession();
  if (!session) {
    redirect("/login");
  }

  let items: DiscoveryItem[] = [];
  let fetchError: string | null = null;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("discovery_items")
      .select(
        "id, poz_no, grup_kodu, item_name, unit, quantity, unit_price, malzeme_birim_fiyat, montaj_birim_fiyat, kesif_turu, durum, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      fetchError = error.message;
    } else {
      items = data ?? [];
    }
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "Bağlantı hatası";
  }

  const total = items.reduce(
    (sum, item) =>
      sum + item.quantity * (Number(item.malzeme_birim_fiyat) + Number(item.montaj_birim_fiyat)),
    0
  );

  return (
    <div className="min-h-full bg-zinc-50 px-4 py-10 text-zinc-900">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Keşif Sayfası</h1>
              <p className="mt-1 text-sm text-zinc-600">
                Kalem ekle, toplamı gör, rol bazlı görüntüle.
              </p>
            </div>
            <Link
              href="/"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100"
            >
              Ana sayfa
            </Link>
            <Link
              href="/analiz"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100"
            >
              Analiz
            </Link>
          </div>
          <div className="mt-3 text-xs text-zinc-600">
            {session.username} • Rol:{" "}
            <b className="font-semibold text-zinc-800">{session.role}</b>
          </div>
        </header>

        {session.role === "yonetici" ? (
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-medium text-zinc-700">Yeni keşif kalemi</h2>
            <KesifForm />
          </section>
        ) : (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <b>Gözlemci</b> rolündesiniz. Keşif kalemlerini ve toplamı görebilirsiniz;
            kalem ekleyemez veya silemezsiniz.
          </p>
        )}

        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-medium text-zinc-700">Toplam keşif tutarı</h2>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {total.toLocaleString("tr-TR", {
              style: "currency",
              currency: "TRY",
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Kalem sayısı: {items.length}</p>
        </section>

        {fetchError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {fetchError}
            <span className="mt-2 block text-xs text-red-700">
              Supabase SQL Editor&apos;da{" "}
              <code className="rounded bg-red-100/80 px-1">supabase/schema.sql</code>{" "}
              ve migration dosyasını çalıştırın.
            </span>
          </p>
        ) : null}

        {!fetchError ? (
          <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-zinc-100 text-left text-zinc-700">
                <tr>
                  <th className="px-3 py-2">Poz No</th>
                  <th className="px-3 py-2">Tanım</th>
                  <th className="px-3 py-2">Birim</th>
                  <th className="px-3 py-2 text-right">Miktar</th>
                  <th className="px-3 py-2 text-right">Malzeme B.F.</th>
                  <th className="px-3 py-2 text-right">Montaj B.F.</th>
                  <th className="px-3 py-2 text-right">Malzeme Tutarı</th>
                  <th className="px-3 py-2 text-right">Montaj Tutarı</th>
                  <th className="px-3 py-2 text-right">Toplam</th>
                  <th className="px-3 py-2">Tür</th>
                  <th className="px-3 py-2">Durum</th>
                  <th className="px-3 py-2 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td className="px-3 py-4 text-zinc-500" colSpan={12}>
                      Henüz keşif kalemi yok.
                    </td>
                  </tr>
                ) : (
                  (() => {
                    const sorted = [...items].sort((a, b) => {
                      const ga = a.grup_kodu ?? "ZZZ";
                      const gb = b.grup_kodu ?? "ZZZ";
                      if (ga === gb) {
                        return a.created_at.localeCompare(b.created_at);
                      }
                      return ga.localeCompare(gb, "tr");
                    });
                    const rows: any[] = [];
                    let currentGroup: string | null = null;
                    let groupTotal = 0;

                    for (const item of sorted) {
                      const group = item.grup_kodu ?? "-";
                      const malzemeTutar =
                        item.quantity * Number(item.malzeme_birim_fiyat);
                      const montajTutar =
                        item.quantity * Number(item.montaj_birim_fiyat);
                      const lineTotal = malzemeTutar + montajTutar;

                      if (currentGroup !== null && currentGroup !== group) {
                        rows.push(
                          <tr key={`subtotal-${currentGroup}`} className="border-t-2 border-zinc-200 bg-zinc-50">
                            <td className="px-3 py-2 text-xs font-semibold text-zinc-600" colSpan={9}>
                              Ara Toplam ({currentGroup})
                            </td>
                            <td className="px-3 py-2 text-right text-xs font-semibold text-zinc-800">
                              {groupTotal.toLocaleString("tr-TR", {
                                style: "currency",
                                currency: "TRY",
                              })}
                            </td>
                            <td className="px-3 py-2" colSpan={3} />
                          </tr>
                        );
                        groupTotal = 0;
                      }

                      if (currentGroup !== group) {
                        rows.push(
                          <tr key={`group-${group}`} className="border-t border-zinc-200 bg-zinc-100">
                            <td className="px-3 py-2 text-xs font-semibold text-zinc-700" colSpan={13}>
                              Grup Kodu: {group}
                            </td>
                          </tr>
                        );
                        currentGroup = group;
                      }

                      groupTotal += lineTotal;
                      rows.push(
                        <tr key={item.id} className="border-t border-zinc-100">
                        <td className="px-3 py-2">{item.poz_no ?? "-"}</td>
                        <td className="px-3 py-2">{item.item_name}</td>
                        <td className="px-3 py-2">{item.unit}</td>
                        <td className="px-3 py-2 text-right">
                          {item.quantity.toLocaleString("tr-TR")}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {Number(item.malzeme_birim_fiyat).toLocaleString("tr-TR", {
                            style: "currency",
                            currency: "TRY",
                          })}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {Number(item.montaj_birim_fiyat).toLocaleString("tr-TR", {
                            style: "currency",
                            currency: "TRY",
                          })}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {malzemeTutar.toLocaleString("tr-TR", {
                            style: "currency",
                            currency: "TRY",
                          })}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {montajTutar.toLocaleString("tr-TR", {
                            style: "currency",
                            currency: "TRY",
                          })}
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {lineTotal.toLocaleString("tr-TR", {
                            style: "currency",
                            currency: "TRY",
                          })}
                        </td>
                        <td className="px-3 py-2">
                          {item.kesif_turu === "kesin_kesif" ? "Kesin" : "Ön"}
                        </td>
                        <td className="px-3 py-2">
                          {item.durum === "onayli" ? "Onaylı" : "Taslak"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {session.role === "yonetici" ? (
                            <form action={deleteKesifItem}>
                              <input type="hidden" name="id" value={item.id} />
                              <button
                                type="submit"
                                className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-800 hover:bg-red-100"
                              >
                                Sil
                              </button>
                            </form>
                          ) : (
                            <span className="text-xs text-zinc-400">-</span>
                          )}
                        </td>
                        </tr>
                      );
                    }

                    if (currentGroup !== null) {
                      rows.push(
                        <tr key={`subtotal-${currentGroup}`} className="border-t-2 border-zinc-200 bg-zinc-50">
                          <td className="px-3 py-2 text-xs font-semibold text-zinc-600" colSpan={9}>
                            Ara Toplam ({currentGroup})
                          </td>
                          <td className="px-3 py-2 text-right text-xs font-semibold text-zinc-800">
                            {groupTotal.toLocaleString("tr-TR", {
                              style: "currency",
                              currency: "TRY",
                            })}
                          </td>
                          <td className="px-3 py-2" colSpan={3} />
                        </tr>
                      );
                    }

                    return rows;
                  })()
                )}
              </tbody>
            </table>
          </section>
        ) : null}
      </main>
    </div>
  );
}
