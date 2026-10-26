-- 아카이브 공개 동의(opt-in): '아카이브 추가'를 누른 사진만 아카이브에 보이게
-- Supabase SQL Editor → New query 에 전체 붙여넣고 Run (setup.sql 실행 후 1회)

alter table public.photos add column if not exists archived boolean not null default false;

-- 목록 조회는 아카이브에 추가된 사진만
drop policy if exists "photos public read" on public.photos;
drop policy if exists "photos public read archived" on public.photos;
create policy "photos public read archived" on public.photos
  for select to anon, authenticated using (archived);

-- 새로 올릴 때는 항상 비공개 상태로만
drop policy if exists "photos public insert" on public.photos;
create policy "photos public insert" on public.photos
  for insert to anon, authenticated with check (not archived);

-- QR 링크(고유 id)를 아는 사람만 해당 사진 1장 조회
create or replace function public.get_photo(p_id uuid)
returns setof public.photos
language sql stable security definer set search_path = public
as $$ select * from public.photos where id = p_id; $$;

-- QR 링크(고유 id)를 아는 사람만 해당 사진을 아카이브에 추가
create or replace function public.archive_photo(p_id uuid)
returns void
language sql security definer set search_path = public
as $$ update public.photos set archived = true where id = p_id; $$;

revoke all on function public.get_photo(uuid), public.archive_photo(uuid) from public;
grant execute on function public.get_photo(uuid), public.archive_photo(uuid) to anon, authenticated;
