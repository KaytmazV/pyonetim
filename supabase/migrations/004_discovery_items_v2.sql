-- Discovery items tablosunu metraj/kesif v2 alanlariyla genisletir.
alter table public.discovery_items
  add column if not exists poz_no text,
  add column if not exists grup_kodu text,
  add column if not exists kesif_turu text not null default 'on_kesif'
    check (kesif_turu in ('on_kesif', 'kesin_kesif')),
  add column if not exists durum text not null default 'taslak'
    check (durum in ('taslak', 'onayli')),
  add column if not exists malzeme_birim_fiyat numeric(14,2),
  add column if not exists montaj_birim_fiyat numeric(14,2);

-- Eski unit_price kolonundan malzeme fiyatina geri doldur.
update public.discovery_items
set malzeme_birim_fiyat = coalesce(malzeme_birim_fiyat, unit_price),
    montaj_birim_fiyat = coalesce(montaj_birim_fiyat, 0)
where malzeme_birim_fiyat is null
   or montaj_birim_fiyat is null;

alter table public.discovery_items
  alter column malzeme_birim_fiyat set not null,
  alter column montaj_birim_fiyat set not null;
