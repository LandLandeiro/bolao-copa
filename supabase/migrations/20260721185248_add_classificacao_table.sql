create table public.classificacao (
  torneio_id    bigint  not null references public.torneios(id) on delete cascade,
  time          text    not null,
  posicao       integer not null,
  pontos        integer not null,
  jogos         integer not null,
  vitorias      integer not null,
  atualizado_em timestamptz not null default now(),
  primary key (torneio_id, time),
  -- Blindagem: se a leitura da tabela oficial vier corrompida, o banco recusa.
  constraint classificacao_valores_coerentes check (
    posicao  between 1 and 20
    and jogos    >= 0
    and vitorias >= 0
    and pontos   >= 0
    and vitorias <= jogos
    and pontos   <= jogos * 3
  )
);

alter table public.classificacao enable row level security;

create policy "classificacao: leitura geral" on public.classificacao
  for select to authenticated using (true);

create policy "classificacao: admin escreve" on public.classificacao
  for all to authenticated using (public.is_admin()) with check (public.is_admin());;
