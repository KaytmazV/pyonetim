import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <div className="min-h-full bg-zinc-50 px-4 py-10 text-zinc-900">
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">PYönetim</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Giriş yapmak için e-posta adresini gir.
          </p>
        </header>
        <LoginForm />
        <p className="text-center text-sm text-zinc-500">
          E-posta istemiyorsanız:{" "}
          <a href="/gozlem" className="text-zinc-700 underline">
            Gözlemci (şifre ile)
          </a>
        </p>
      </main>
    </div>
  );
}
