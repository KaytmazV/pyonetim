"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; message: string };

export type SiteLogFormState = { success?: boolean; message?: string } | null;

export async function addSiteLog(formData: FormData): Promise<ActionResult> {
  const note = (formData.get("note") as string | null)?.trim();
  if (!note) {
    return { ok: false, message: "Not boş olamaz." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("site_logs").insert({ note });
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
