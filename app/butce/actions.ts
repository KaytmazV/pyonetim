"use server";

import { revalidatePath } from "next/cache";
import { getAppSession } from "@/lib/app-auth-session";
import { createAdminClient } from "@/lib/supabase/admin";

export type ButceState = { success?: boolean; message?: string } | null;

export async function saveBudget(
  _prev: ButceState,
  formData: FormData
): Promise<ButceState> {
  const session = await getAppSession();
  if (!session || session.role !== "yonetici") {
    return { message: "Bu işlem için yonetici yetkisi gerekir." };
  }

  const allocatedBudget = Number(formData.get("allocated_budget"));
  const note = String(formData.get("note") ?? "").trim();

  if (!Number.isFinite(allocatedBudget) || allocatedBudget < 0) {
    return { message: "Ayrılan bütçe 0 veya daha büyük olmalı." };
  }

  const admin = createAdminClient();
  const { data: current } = await admin
    .from("project_budgets")
    .select("id")
    .eq("scope", "global")
    .maybeSingle();

  if (current?.id) {
    const { error } = await admin
      .from("project_budgets")
      .update({
        allocated_budget: allocatedBudget,
        note: note || null,
        updated_at: new Date().toISOString(),
        updated_by_username: session.username,
      })
      .eq("id", current.id);
    if (error) return { message: error.message };
  } else {
    const { error } = await admin.from("project_budgets").insert({
      scope: "global",
      allocated_budget: allocatedBudget,
      note: note || null,
      created_by_username: session.username,
      updated_by_username: session.username,
    });
    if (error) return { message: error.message };
  }

  revalidatePath("/butce");
  revalidatePath("/analiz");
  return { success: true };
}
