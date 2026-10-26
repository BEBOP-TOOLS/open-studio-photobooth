-- 관리자 삭제: admins 테이블에 등록된 이메일로 로그인한 계정만 삭제 가능
-- Supabase SQL Editor → New query 에 붙여넣고, 맨 아래 이메일을 바꾼 뒤 Run

create table if not exists public.admins (email text primary key);
alter table public.admins enable row level security; -- 정책 없음 = API로 조회 불가

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admins where email = auth.jwt() ->> 'email'); $$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "photos admin delete" on public.photos;
create policy "photos admin delete" on public.photos
  for delete to authenticated using (public.is_admin());

drop policy if exists "photos bucket admin delete" on storage.objects;
create policy "photos bucket admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'photos' and public.is_admin());

-- 관리자 이메일 등록 (여러 명이면 줄을 추가)
insert into public.admins (email) values ('ADMIN_EMAIL@example.com') on conflict do nothing;
