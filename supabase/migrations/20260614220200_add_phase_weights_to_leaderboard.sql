CREATE OR REPLACE FUNCTION public.get_leaderboard()
 RETURNS TABLE(user_id uuid, nome text, pontos integer, cravadas integer)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    pr.id,
    pr.nome,
    coalesce(sum(calc.base * calc.peso), 0)::int   as pontos,
    coalesce(sum((calc.base = 5)::int), 0)::int    as cravadas
  from profiles pr
  left join predictions pal on pal.user_id = pr.id
  left join matches m
    on m.id = pal.match_id
    and m.gols_casa is not null
    and m.gols_fora is not null
  left join lateral (
    select
      case
        when pal.palpite_casa = m.gols_casa and pal.palpite_fora = m.gols_fora then 5
        when (pal.palpite_casa - pal.palpite_fora) = (m.gols_casa - m.gols_fora) then 3
        when sign(pal.palpite_casa - pal.palpite_fora) = sign(m.gols_casa - m.gols_fora) then 1
        else 0
      end as base,
      case m.fase
        when 'grupos'   then 1
        when '16avos'   then 2
        when 'oitavas'  then 3
        when 'quartas'  then 5
        when 'semis'    then 8
        when 'terceiro' then 5
        when 'final'    then 13
        else 1
      end as peso
  ) calc on true
  group by pr.id, pr.nome
  order by pontos desc, cravadas desc, pr.nome asc;
$function$;;
