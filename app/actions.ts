"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearAppSession, getAppSession } from "@/lib/app-auth-session";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionResult = { ok: true } | { ok: false; message: string };

export type SiteLogFormState = { success?: boolean; message?: string } | null;

export async function addSiteLog(formData: FormData): Promise<ActionResult> {
  const note = (formData.get("note") as string | null)?.trim();
  if (!note) {
    return { ok: false, message: "Not boş olamaz." };
  }

  try {
    const session = await getAppSession();
    if (!session) {
      return { ok: false, message: "Oturum bulunamadı. Lütfen tekrar giriş yapın." };
    }
    if (session.role !== "yonetici") {
      return {
        ok: false,
        message: "Yalnızca yonetici rolü kayıt ekleyebilir.",
      };
    }

    const admin = createAdminClient();
    const { error } = await admin.from("site_logs").insert({ note });
    if (error) {
      return { ok: false, message: error.message };
    }
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Bilinmeyen hata";
    return { ok: false, message };
  }
}

export async function submitSiteLog(
  _prev: SiteLogFormState,
  formData: FormData
): Promise<SiteLogFormState> {
  const result = await addSiteLog(formData);
  if (result.ok) {
    return { success: true };
  }
  return { message: result.message };
}

export async function signOutAction() {
  await clearAppSession();
  redirect("/login");
}

export async function deleteSiteLog(formData: FormData) {
  const id = (formData.get("id") as string | null)?.trim();
  if (!id) {
    return;
  }

  const session = await getAppSession();
  if (!session) {
    redirect("/login");
  }

  if (session.role !== "yonetici") {
    return;
  }

  const admin = createAdminClient();
  const { error } = await admin.from("site_logs").delete().eq("id", id);
  if (!error) {
    revalidatePath("/");
  }
}
