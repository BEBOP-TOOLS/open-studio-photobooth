-- 관리자 숨기기: 삭제하지 않고 아카이브에서만 감춤 (언제든 다시 보이기 가능)
-- Supabase SQL Editor → New query 에 붙여넣고 Run (migrate-02 실행 후)

alter table public.photos add column if not exists hidden boolean not null default false;

-- 방문자: 아카이브에 추가됐고 숨기지 않은 사진만
drop policy if exists "photos public read archived" on public.photos;
create policy "photos public read archived" on public.photos
  for select to anon, authenticated using (archived and not hidden);

-- 관리자: 숨긴 사진까지 모두 조회
drop policy if exists "photos admin read" on public.photos;
create policy "photos admin read" on public.photos
  for select to authenticated using (public.is_admin());

-- 관리자만 숨김 상태 변경
create or replace function public.set_photo_hidden(p_id uuid, p_hidden boolean)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  update public.photos set hidden = p_hidden where id = p_id;
end $$;

revoke all on function public.set_photo_hidden(uuid, boolean) from public;
grant execute on function public.set_photo_hidden(uuid, boolean) to authenticated;
