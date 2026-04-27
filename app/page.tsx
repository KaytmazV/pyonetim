import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SiteLogForm } from "./site-log-form";
import { deleteSiteLog, signOutAction } from "./actions";

export const dynamic = "force-dynamic";

type UserRole = "yonetici" | "gozlemci";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  let role: UserRole = "gozlemci";
  if (!existingProfile) {
    await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email ?? "",
          role: "gozlemci",
        },
        { onConflict: "id" }
      );
  } else if (existingProfile.role === "yonetici") {
    role = "yonetici";
  }

  let rows: { id: string; created_at: string; note: string }[] = [];
  let fetchError: string | null = null;

  try {
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

  return (
    <div className="min-h-full bg-zinc-50 px-4 py-10 text-zinc-900">
      <main className="mx-auto flex max-w-lg flex-col gap-8">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">PYönetim</h1>
          <p className="mt-1 text-sm text-zinc-600">Saha notları ve günlük kayıtlar.</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600">
            <span>
              {user.email} • Rol:{" "}
              <b className="font-semibold text-zinc-800">{role}</b>
            </span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-md border border-zinc-300 px-2 py-1 text-zinc-700 hover:bg-zinc-100"
              >
                Çıkış
              </button>
            </form>
          </div>
        </header>

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

        {role === "yonetici" ? (
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-medium text-zinc-700">Yeni not</h2>
            <SiteLogForm />
          </section>
        ) : (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Hesabınız <b>gozlemci</b> rolünde. Kayıt eklemek için rolünüzün{" "}
            <b>yonetici</b> olarak güncellenmesi gerekir.
          </p>
        )}

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
                    <div className="flex items-start justify-between gap-2">
                      <time className="text-xs text-zinc-500">
                        {new Date(r.created_at).toLocaleString("tr-TR")}
                      </time>
                      {role === "yonetici" ? (
                        <form action={deleteSiteLog}>
                          <input type="hidden" name="id" value={r.id} />
                          <button
                            type="submit"
                            className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-800 hover:bg-red-100"
                          >
                            Sil
                          </button>
                        </form>
                      ) : null}
                    </div>
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
