-- BACKFILL — objeto que existe em produção mas nunca foi versionado.
-- score_base/score_peso foram criados fora do histórico de migrations (execute_sql cru).
-- A migration seguinte (20260721151221) cria get_match_points, cujo corpo chama as duas.
-- Com check_function_bodies=on (padrão), criar aquela função sem estas aqui FALHA.
-- Por isso o timestamp é 151220: um segundo antes, só para o rebuild do zero funcionar.
--
-- Conteúdo reproduzido EXATAMENTE como está em produção hoje (inclusive sem search_path;
-- o endurecimento vai em migration separada, para não misturar espelho com correção).

create or replace function public.score_base(pc integer, pf integer, gc integer, gf integer)
returns integer
language sql
immutable
as $function$
  select case
    when pc = gc and pf = gf then 5
    when (pc - pf) = (gc - gf) then 3
    when sign(pc - pf) = sign(gc - gf) then 1
    else 0 end;
$function$;

create or replace function public.score_peso(fase text)
returns integer
language sql
immutable
as $function$
  select case fase
    when 'grupos' then 1 when '16avos' then 2 when 'oitavas' then 3
    when 'quartas' then 5 when 'semis' then 8 when 'terceiro' then 5
    when 'final' then 13 else 1 end;
$function$;
