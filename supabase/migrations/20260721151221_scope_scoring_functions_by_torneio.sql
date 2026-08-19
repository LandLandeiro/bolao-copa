-- Ordem importa: get_leaderboard depende de get_match_points.
drop function if exists public.get_leaderboard();
drop function if exists public.get_match_points(uuid);

-- Pontos por jogo, agora escopado por torneio.
-- Default 'copa-2026' = comportamento idêntico ao de hoje enquanto o front não passa o slug.
create function public.get_match_points(p_user uuid, p_torneio text default 'copa-2026')
returns table(match_id bigint, fase text, rodada integer, data_hora timestamptz,
              palpite_casa integer, palpite_fora integer,
              gols_casa integer, gols_fora integer,
              base integer, peso integer, pontos integer)
language sql
stable
set search_path to 'public'
as $function$
  select pal.match_id, m.fase, m.rodada, m.data_hora,
    pal.palpite_casa, pal.palpite_fora, m.gols_casa, m.gols_fora,
    public.score_base(pal.palpite_casa, pal.palpite_fora, m.gols_casa, m.gols_fora),
    public.score_peso(m.fase),
    public.score_base(pal.palpite_casa, pal.palpite_fora, m.gols_casa, m.gols_fora)
      * public.score_peso(m.fase)
  from predictions pal
  join matches m on m.id = pal.match_id
    and m.gols_casa is not null and m.gols_fora is not null
  join torneios t on t.id = m.torneio_id and t.slug = p_torneio
  where pal.user_id = p_user;
$function$;

create function public.get_leaderboard(p_torneio text default 'copa-2026')
returns table(user_id uuid, nome text, pontos integer, cravadas integer)
language sql
security definer
set search_path to 'public'
as $function$
  select pr.id, pr.nome,
    coalesce(sum(mp.pontos),0)::int as pontos,
    coalesce(sum((mp.base=5)::int),0)::int as cravadas
  from profiles pr
  left join lateral public.get_match_points(pr.id, p_torneio) mp on true
  group by pr.id, pr.nome
  order by pontos desc, cravadas desc, pr.nome asc;
$function$;

-- Mantém os grants apertados (mesma postura da migration tighten_function_execute_grants)
revoke all on function public.get_leaderboard(text)       from public, anon;
revoke all on function public.get_match_points(uuid,text) from public, anon;
grant execute on function public.get_leaderboard(text)       to authenticated;
grant execute on function public.get_match_points(uuid,text) to authenticated;;
