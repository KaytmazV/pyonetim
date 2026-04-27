"use server";

import { redirect } from "next/navigation";
import { resolveCredential, setAppSession } from "@/lib/app-auth-session";

export async function loginWithCredentials(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) {
    redirect("/login?err=1");
  }

  const role = resolveCredential(username, password);
  if (!role) {
    redirect("/login?err=1");
  }

  await setAppSession(username, role);
  redirect("/");
}
