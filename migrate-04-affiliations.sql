-- 방문자가 직접 입력한 소속을 태그 목록에 추가
-- 숨긴 사진의 소속은 목록에서 빠짐 (이상한 입력은 관리자 숨기기로 정리)
-- Supabase SQL Editor → New query 에 붙여넣고 Run

create or replace function public.list_affiliations()
returns table (name text)
language sql stable security definer set search_path = public
as $$
  select affiliation from public.photos
  where affiliation is not null and not hidden
  group by affiliation
  order by max(created_at) desc
  limit 200;
$$;

revoke all on function public.list_affiliations() from public;
grant execute on function public.list_affiliations() to anon, authenticated;
