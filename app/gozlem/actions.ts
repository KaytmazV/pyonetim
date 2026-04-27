"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createGozlemSessionToken,
  GOZLEM_COOKIE,
} from "@/lib/gozlem-session";

export async function unlockGozlem(formData: FormData) {
  const sifre = (formData.get("sifre") as string | null) ?? "";
  const expected = process.env.GOZLEM_SIFRESI;
  const secret = process.env.GOZLEM_SESSION_SECRET;

  if (!expected || !secret) {
    redirect("/gozlem?err=config");
  }
  if (sifre !== expected) {
    redirect("/gozlem?err=1");
  }

  const token = createGozlemSessionToken(secret);
  const store = await cookies();
  store.set(GOZLEM_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/gozlem",
  });
  redirect("/gozlem");
}

export async function lockGozlem() {
  const store = await cookies();
  store.delete({ name: GOZLEM_COOKIE, path: "/gozlem" });
  redirect("/gozlem");
}
