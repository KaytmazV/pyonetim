import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-auth-session";
import { loginWithCredentials } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const session = await getAppSession();
  const params = await searchParams;
  if (session) {
    redirect("/");
  }

  return (
    <div className="min-h-full bg-zinc-50 px-4 py-10 text-zinc-900">
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">PYönetim</h1>
          <p className="mt-1 text-sm text-zinc-600">Belirlenen ID ve şifre ile giriş yap.</p>
        </header>
        {params.err === "1" ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            ID veya şifre hatalı.
          </p>
        ) : null}
        <form action={loginWithCredentials} className="flex flex-col gap-3">
          <label className="text-sm font-medium text-zinc-700" htmlFor="username">
            Kullanıcı ID
          </label>
          <input
            id="username"
            name="username"
            required
            autoComplete="username"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
          />
          <label className="text-sm font-medium text-zinc-700" htmlFor="password">
            Şifre
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Giriş yap
          </button>
        </form>
        <p className="text-center text-sm text-zinc-500">
          Hızlı salt-okunur ekran:{" "}
          <a href="/gozlem" className="text-zinc-700 underline">
            Gözlemci (tek şifre)
          </a>
        </p>
      </main>
    </div>
  );
}
