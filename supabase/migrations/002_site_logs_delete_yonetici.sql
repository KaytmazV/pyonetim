-- Mevcut projede sadece silme politikasini eklemek icin SQL Editor'da calistirin.
drop policy if exists "site_logs_delete_yonetici" on public.site_logs;

create policy "site_logs_delete_yonetici"
  on public.site_logs for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'yonetici'
    )
  );
