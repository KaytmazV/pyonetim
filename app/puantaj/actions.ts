"use server";

import { revalidatePath } from "next/cache";
import { getAppSession } from "@/lib/app-auth-session";
import { createAdminClient } from "@/lib/supabase/admin";

export type PuantajState = { success?: boolean; message?: string } | null;

export async function submitPuantaj(
  _prev: PuantajState,
  formData: FormData
): Promise<PuantajState> {
  const session = await getAppSession();
  if (!session || session.role !== "yonetici") {
    return { message: "Bu işlem için yonetici yetkisi gerekir." };
  }

  const entryDate = String(formData.get("entry_date") ?? "").trim();
  const ekipAdi = String(formData.get("ekip_adi") ?? "").trim();
  const taseron = String(formData.get("taseron") ?? "").trim();
  const grupKodu = String(formData.get("grup_kodu") ?? "").trim();
  const bolge = String(formData.get("bolge") ?? "").trim();
  const vardiya = String(formData.get("vardiya") ?? "gunduz");
  const kisiSayisi = Number(formData.get("kisi_sayisi"));
  const saat = Number(formData.get("saat"));
  const saatlikMaliyet = Number(formData.get("saatlik_maliyet"));
  const notlar = String(formData.get("notlar") ?? "").trim();

  if (!entryDate || !ekipAdi) {
    return { message: "Tarih ve ekip adı zorunlu." };
  }
  if (!["gunduz", "gece"].includes(vardiya)) {
    return { message: "Vardiya geçersiz." };
  }
  if (!Number.isFinite(kisiSayisi) || kisiSayisi <= 0) {
    return { message: "Kişi sayısı 0'dan büyük olmalı." };
  }
  if (!Number.isFinite(saat) || saat <= 0) {
    return { message: "Saat 0'dan büyük olmalı." };
  }
  if (!Number.isFinite(saatlikMaliyet) || saatlikMaliyet < 0) {
    return { message: "Saatlik maliyet 0 veya daha büyük olmalı." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("labor_entries").insert({
    entry_date: entryDate,
    ekip_adi: ekipAdi,
    taseron: taseron || null,
    grup_kodu: grupKodu || null,
    bolge: bolge || null,
    vardiya,
    kisi_sayisi: kisiSayisi,
    saat,
    saatlik_maliyet: saatlikMaliyet,
    notlar: notlar || null,
    created_by_username: session.username,
  });
  if (error) return { message: error.message };

  revalidatePath("/puantaj");
  return { success: true };
}

export async function deletePuantaj(formData: FormData) {
  const session = await getAppSession();
  if (!session || session.role !== "yonetici") return;

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const admin = createAdminClient();
  const { error } = await admin.from("labor_entries").delete().eq("id", id);
  if (!error) revalidatePath("/puantaj");
}
