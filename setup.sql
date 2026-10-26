-- Supabase 대시보드 → SQL Editor → New query 에 전체 붙여넣고 Run

-- 1) 사진 기록 테이블
create table if not exists public.photos (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(name) between 1 and 40),
  affiliation text check (affiliation is null or char_length(affiliation) <= 60),
  path        text not null check (char_length(path) <= 200)
);

alter table public.photos enable row level security;

-- 누구나 보기 / 새로 올리기만 가능 (수정·삭제는 대시보드에서만)
drop policy if exists "photos public read" on public.photos;
create policy "photos public read" on public.photos
  for select to anon, authenticated using (true);

drop policy if exists "photos public insert" on public.photos;
create policy "photos public insert" on public.photos
  for insert to anon, authenticated with check (true);

-- 2) 사진 파일 스토리지 (공개 버킷, JPEG만, 최대 5MB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/jpeg'])
on conflict (id) do update
  set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg'];

drop policy if exists "photos bucket upload" on storage.objects;
create policy "photos bucket upload" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'photos');

-- 3) 아카이브 실시간 갱신
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'photos'
  ) then
    alter publication supabase_realtime add table public.photos;
  end if;
end $$;

-- 이후 migrate-01-archive-optin.sql 도 이어서 실행하세요
