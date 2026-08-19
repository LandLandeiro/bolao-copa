-- 1) data_hora passa a aceitar nulo = "CBF ainda não marcou"
alter table public.matches alter column data_hora drop not null;

-- 2) ...mas SÓ pro Brasileirão. Jogo de Copa sem data continua proibido (invariante preservada).
alter table public.matches add constraint matches_data_hora_null_so_returno
  check (data_hora is not null or fase = 'rodada');

-- 3) Palpite liberado quando a data é nula (jogo ainda não marcado => ainda não aconteceu).
--    A forma EXISTS também garante que o jogo existe.
alter policy "palpites: cria antes do jogo" on public.predictions
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = predictions.match_id
        and (m.data_hora is null or m.data_hora > now())
    )
  );

alter policy "palpites: edita antes do jogo" on public.predictions
  using (user_id = auth.uid() and not travado)
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = predictions.match_id
        and (m.data_hora is null or m.data_hora > now())
    )
  );

-- 4) Os 4 jogos que a CBF ainda não marcou (21ª rodada), sem data inventada.
insert into public.matches (torneio_id, fase, rodada, time_casa, time_fora, estadio, data_hora)
select (select id from public.torneios where slug='brasileirao-2026'),
       'rodada', 21, v.casa, v.fora, v.estadio, null
from (values
  ('Botafogo','Grêmio','Nilton Santos'),
  ('São Paulo','Santos','A definir'),
  ('Atlético-MG','Bragantino','Arena MRV'),
  ('Chapecoense','Vasco','Arena Condá')
) as v(casa, fora, estadio);;
