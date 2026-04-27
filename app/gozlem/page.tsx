import Link from "next/link";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { GOZLEM_COOKIE, verifyGozlemSessionToken } from "@/lib/gozlem-session";
import { lockGozlem, unlockGozlem } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = { err?: string };

export default async function GozlemPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const err = params.err;

  const sessionSecret = process.env.GOZLEM_SESSION_SECRET;
  const cookieStore = await cookies();
  const token = cookieStore.get(GOZLEM_COOKIE)?.value;
  const sessionOk =
    Boolean(sessionSecret) &&
    Boolean(token) &&
    verifyGozlemSessionToken(token!, sessionSecret!);

  if (!sessionOk) {
    return (
      <div className="min-h-full bg-zinc-50 px-4 py-10 text-zinc-900">
        <main className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <header>
            <h1 className="text-2xl font-semibold tracking-tight">Gözlemci</h1>
            <p className="mt-1 text-sm text-zinc-600">
              E-posta gerekmez. Paylaşılan şifre ile notları salt okunur
              görüntülersiniz.
            </p>
          </header>
          {err === "1" ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              Şifre hatalı.
            </p>
          ) : null}
          {err === "config" ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Sunucu yapılandırması eksik: <code>GOZLEM_SIFRESI</code> ve{" "}
              <code>GOZLEM_SESSION_SECRET</code> tanımlı olmalı (Vercel /{" "}
              <code>.env.local</code>).
            </p>
          ) : null}
          <form action={unlockGozlem} className="flex flex-col gap-3">
            <label className="text-sm font-medium text-zinc-700" htmlFor="sifre">
              Şifre
            </label>
            <input
              id="sifre"
              name="sifre"
              type="password"
              required
              autoComplete="off"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
            />
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Notları göster
            </button>
          </form>
          <p className="text-center text-sm text-zinc-500">
            <Link href="/login" className="text-zinc-700 underline">
              Yönetici girişi (e-posta)
            </Link>
          </p>
        </main>
      </div>
    );
  }

  let rows: { id: string; created_at: string; note: string }[] = [];
  let fetchError: string | null = null;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("site_logs")
      .select("id, created_at, note")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) fetchError = error.message;
    else rows = data ?? [];
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "Veri alınamadı";
  }

  return (
    <div className="min-h-full bg-zinc-50 px-4 py-10 text-zinc-900">
      <main className="mx-auto flex max-w-lg flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Gözlemci görünümü
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Salt okunur. Not ekleyemez veya silemezsiniz.
            </p>
          </div>
          <form action={lockGozlem}>
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100"
            >
              Şifre oturumunu kapat
            </button>
          </form>
        </header>

        {fetchError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {fetchError}
            <span className="mt-2 block text-xs text-red-700">
              <code>SUPABASE_SERVICE_ROLE_KEY</code> sunucuda tanımlı mı kontrol
              edin (Vercel Environment Variables).
            </span>
          </p>
        ) : null}

        {!fetchError ? (
          <section>
            <h2 className="text-sm font-medium text-zinc-700">Son kayıtlar</h2>
            <ul className="mt-3 space-y-2">
              {rows.length === 0 ? (
                <li className="text-sm text-zinc-500">Henüz kayıt yok.</li>
              ) : (
                rows.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm"
                  >
                    <time className="text-xs text-zinc-500">
                      {new Date(r.created_at).toLocaleString("tr-TR")}
                    </time>
                    <p className="mt-1 whitespace-pre-wrap text-zinc-800">
                      {r.note}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </section>
        ) : null}

        <p className="text-center text-sm text-zinc-500">
          <Link href="/login" className="text-zinc-700 underline">
            Yönetici girişi
          </Link>
        </p>
      </main>
    </div>
  );
}
