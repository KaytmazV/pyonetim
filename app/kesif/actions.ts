"use server";

import { revalidatePath } from "next/cache";
import { getAppSession } from "@/lib/app-auth-session";
import { createAdminClient } from "@/lib/supabase/admin";

export type KesifFormState = { success?: boolean; message?: string } | null;

export async function submitKesifItem(
  _prev: KesifFormState,
  formData: FormData
): Promise<KesifFormState> {
  const session = await getAppSession();
  if (!session || session.role !== "yonetici") {
    return { message: "Bu işlem için yonetici yetkisi gerekir." };
  }

  const pozNo = String(formData.get("poz_no") ?? "").trim();
  const grupKodu = String(formData.get("grup_kodu") ?? "").trim();
  const itemName = String(formData.get("item_name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const quantity = Number(formData.get("quantity"));
  const malzemeBirimFiyat = Number(formData.get("malzeme_birim_fiyat"));
  const montajBirimFiyat = Number(formData.get("montaj_birim_fiyat"));
  const kesifTuru = String(formData.get("kesif_turu") ?? "on_kesif");
  const durum = String(formData.get("durum") ?? "taslak");

  if (!itemName || !unit) {
    return { message: "Kalem adı ve birim zorunlu." };
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { message: "Miktar 0'dan büyük olmalı." };
  }
  if (!Number.isFinite(malzemeBirimFiyat) || malzemeBirimFiyat < 0) {
    return { message: "Malzeme birim fiyat 0 veya daha büyük olmalı." };
  }
  if (!Number.isFinite(montajBirimFiyat) || montajBirimFiyat < 0) {
    return { message: "Montaj birim fiyat 0 veya daha büyük olmalı." };
  }
  if (!["on_kesif", "kesin_kesif"].includes(kesifTuru)) {
    return { message: "Keşif türü geçersiz." };
  }
  if (!["taslak", "onayli"].includes(durum)) {
    return { message: "Durum geçersiz." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("discovery_items").insert({
    poz_no: pozNo || null,
    grup_kodu: grupKodu || null,
    item_name: itemName,
    unit,
    quantity,
    unit_price: malzemeBirimFiyat + montajBirimFiyat,
    malzeme_birim_fiyat: malzemeBirimFiyat,
    montaj_birim_fiyat: montajBirimFiyat,
    kesif_turu: kesifTuru,
    durum,
    created_by_username: session.username,
  });

  if (error) {
    return { message: error.message };
  }

  revalidatePath("/kesif");
  return { success: true };
}

export async function deleteKesifItem(formData: FormData) {
  const session = await getAppSession();
  if (!session || session.role !== "yonetici") {
    return;
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const admin = createAdminClient();
  const { error } = await admin.from("discovery_items").delete().eq("id", id);
  if (!error) {
    revalidatePath("/kesif");
  }
}
