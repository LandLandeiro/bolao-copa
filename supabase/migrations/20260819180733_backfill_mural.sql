-- BACKFILL — a tabela `mural` existe em produção desde o commit df88ae7 (28/06/2026)
-- mas foi criada fora do histórico de migrations, então nenhum `fetch` a traz.
-- DDL reproduzido a partir da introspecção de produção (pg_attribute/pg_constraint/pg_indexes
-- e pg_policies). Nada depende de mural, então o timestamp de hoje serve.

create table public.mural (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  texto      text not null,
  created_at timestamptz not null default now(),
  constraint mural_texto_check check (
    char_length(trim(both from texto)) >= 1
    and char_length(trim(both from texto)) <= 280
  )
);

create index mural_created_at_idx on public.mural using btree (created_at desc);

alter table public.mural enable row level security;

-- Leitura: qualquer logado vê o mural inteiro.
create policy mural_select on public.mural
  for select to authenticated using (true);

-- Escrita: só em nome próprio.
create policy mural_insert_own on public.mural
  for insert to authenticated with check (auth.uid() = user_id);

create policy mural_delete_own on public.mural
  for delete to authenticated using (auth.uid() = user_id);

-- Sem policy de UPDATE por design: recado é imutável — cria e apaga, não edita.
