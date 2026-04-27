import { createClient } from "@/lib/supabase/server";
import { SiteLogForm } from "./site-log-form";

export const dynamic = "force-dynamic";

function envConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export default async function Home() {
  const configured = envConfigured();
  let rows: { id: string; created_at: string; note: string }[] = [];
  let fetchError: string | null = null;

  if (configured) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("site_logs")
        .select("id, created_at, note")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) {
        fetchError = error.message;
      } else {
        rows = data ?? [];
      }
    } catch (e) {
      fetchError = e instanceof Error ? e.message : "Bağlantı hatası";
    }
  }

  return (
    <div className="min-h-full bg-zinc-50 px-4 py-10 text-zinc-900">
      <main className="mx-auto flex max-w-lg flex-col gap-8">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">PYönetim</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Şantiye / saha notu — veri girişi ve liste (Supabase).
          </p>
        </header>

        {!configured ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <code className="rounded bg-amber-100/80 px-1">web/.env.local</code>{" "}
            dosyasına{" "}
            <code className="rounded bg-amber-100/80 px-1">
              NEXT_PUBLIC_SUPABASE_URL
            </code>{" "}
            ve{" "}
            <code className="rounded bg-amber-100/80 px-1">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>{" "}
            ekleyin. Şablon:{" "}
            <code className="rounded bg-amber-100/80 px-1">.env.example</code>
          </p>
        ) : null}

        {fetchError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {fetchError}
            <span className="mt-2 block text-xs text-red-700">
              Tablo yoksa Supabase SQL Editor&apos;da{" "}
              <code className="rounded bg-red-100/80 px-1">
                supabase/schema.sql
              </code>{" "}
              içeriğini çalıştırın.
            </span>
          </p>
        ) : null}

        {configured ? (
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-medium text-zinc-700">Yeni not</h2>
            <SiteLogForm />
          </section>
        ) : null}

        {configured && !fetchError ? (
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
      </main>
    </div>
  );
}
