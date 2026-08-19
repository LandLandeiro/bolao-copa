-- Regra única de "palpite ainda aberto?", pra não duplicar lógica nas duas policies.
--   Jogo COM data  -> regra normal: fecha no apito inicial.
--   Jogo SEM data  -> fecha quando a RODADA começa (1o jogo marcado daquela rodada).
--                     Se a rodada inteira ainda não tem data, segue aberto ('infinity').
create or replace function public.palpite_aberto(p_match_id bigint)
returns boolean
language sql
stable
set search_path = public
as $$
  select case
    when m.data_hora is not null then m.data_hora > now()
    else coalesce(
           (select min(m2.data_hora) from public.matches m2
             where m2.torneio_id = m.torneio_id and m2.rodada = m.rodada),
           'infinity'::timestamptz) > now()
  end
  from public.matches m
  where m.id = p_match_id;
$$;

revoke all on function public.palpite_aberto(bigint) from public, anon;
grant execute on function public.palpite_aberto(bigint) to authenticated;

alter policy "palpites: cria antes do jogo" on public.predictions
  with check (user_id = auth.uid() and public.palpite_aberto(match_id));

alter policy "palpites: edita antes do jogo" on public.predictions
  using (user_id = auth.uid() and not travado)
  with check (user_id = auth.uid() and public.palpite_aberto(match_id));;
