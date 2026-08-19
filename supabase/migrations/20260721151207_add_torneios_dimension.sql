-- 1) Tabela de torneios
create table public.torneios (
  id bigint generated always as identity primary key,
  slug text not null unique,
  nome text not null,
  encerrado boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.torneios (slug, nome, encerrado) values
  ('copa-2026',        'Copa do Mundo 2026',          true),
  ('brasileirao-2026', 'Brasileirão 2026 · Returno',  false);

alter table public.torneios enable row level security;
create policy "torneios: leitura geral" on public.torneios
  for select to authenticated using (true);
create policy "torneios: admin escreve" on public.torneios
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 2) matches ganha torneio + rodada (backfill: tudo que existe hoje é Copa)
alter table public.matches
  add column torneio_id bigint references public.torneios(id),
  add column rodada integer;

update public.matches
   set torneio_id = (select id from public.torneios where slug = 'copa-2026');

alter table public.matches alter column torneio_id set not null;

create index matches_torneio_rodada_idx on public.matches (torneio_id, rodada);
create index matches_torneio_data_idx   on public.matches (torneio_id, data_hora);

-- 3) Blindagem: 'rodada' entra como fase válida, mas amarrada ao número da rodada.
--    Copa  => fase de mata-mata E rodada nula.
--    Brasa => fase='rodada'    E rodada entre 20 e 38 (returno).
alter table public.matches drop constraint matches_fase_check;
alter table public.matches add constraint matches_fase_check
  check (fase = any (array['grupos','16avos','oitavas','quartas','semis','terceiro','final','rodada']));

alter table public.matches add constraint matches_rodada_coerente check (
     (fase <> 'rodada' and rodada is null)
  or (fase =  'rodada' and rodada between 20 and 38)
);;
