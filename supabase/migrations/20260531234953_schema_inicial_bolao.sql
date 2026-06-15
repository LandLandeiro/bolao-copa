-- Schema inicial do Bolão da Copa 2026

-- 1) PERFIS
create table if not exists profiles (
  id         uuid primary key references auth.users on delete cascade,
  nome       text not null,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nome)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'nome', ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 2) JOGOS
create table if not exists matches (
  id         bigint generated always as identity primary key,
  time_casa  text not null,
  time_fora  text not null,
  fase       text not null default 'grupos',
  grupo      text,
  estadio    text,
  data_hora  timestamptz not null,
  gols_casa  int,
  gols_fora  int
);

-- 3) PALPITES
create table if not exists predictions (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references profiles(id) on delete cascade,
  match_id     bigint not null references matches(id) on delete cascade,
  palpite_casa int not null check (palpite_casa >= 0 and palpite_casa <= 99),
  palpite_fora int not null check (palpite_fora >= 0 and palpite_fora <= 99),
  created_at   timestamptz not null default now(),
  unique (user_id, match_id)
);

-- RLS
alter table profiles    enable row level security;
alter table matches     enable row level security;
alter table predictions enable row level security;

create policy "perfis: leitura geral"
  on profiles for select to authenticated using (true);

create policy "perfis: edita o proprio"
  on profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "jogos: leitura geral"
  on matches for select to authenticated using (true);

create policy "jogos: admin escreve"
  on matches for all to authenticated
  using ( exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin) )
  with check ( exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin) );

create policy "palpites: leitura"
  on predictions for select to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from matches m where m.id = match_id and now() >= m.data_hora)
  );

create policy "palpites: cria antes do jogo"
  on predictions for insert to authenticated
  with check (
    user_id = auth.uid()
    and (select m.data_hora from matches m where m.id = match_id) > now()
  );

create policy "palpites: edita antes do jogo"
  on predictions for update to authenticated
  using ( user_id = auth.uid() )
  with check (
    user_id = auth.uid()
    and (select m.data_hora from matches m where m.id = match_id) > now()
  );

-- RANKING
create or replace function get_leaderboard()
returns table (user_id uuid, nome text, pontos int, cravadas int)
language sql
security definer set search_path = public
as $$
  select
    pr.id,
    pr.nome,
    coalesce(sum(pts.pontos), 0)::int                     as pontos,
    coalesce(sum((pts.pontos = 5)::int), 0)::int          as cravadas
  from profiles pr
  left join predictions pal on pal.user_id = pr.id
  left join matches m
    on m.id = pal.match_id
    and m.gols_casa is not null
    and m.gols_fora is not null
  left join lateral (
    select case
      when pal.palpite_casa = m.gols_casa and pal.palpite_fora = m.gols_fora then 5
      when (pal.palpite_casa - pal.palpite_fora) = (m.gols_casa - m.gols_fora) then 3
      when sign(pal.palpite_casa - pal.palpite_fora) = sign(m.gols_casa - m.gols_fora) then 1
      else 0
    end as pontos
  ) pts on true
  group by pr.id, pr.nome
  order by pontos desc, cravadas desc, pr.nome asc;
$$;

grant execute on function get_leaderboard() to authenticated;;
