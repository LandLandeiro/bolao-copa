-- 1) Helper: o usuário atual é admin? SECURITY DEFINER p/ não recursar na RLS de profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- 2) FECHA O BURACO: ninguém muda is_admin pela API. Só service role (MCP) promove admin.
revoke update (is_admin) on public.profiles from authenticated, anon;

-- 3) Admin pode renomear QUALQUER perfil (continua sem poder mexer em is_admin, ver passo 2).
create policy "perfis: admin edita qualquer um" on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 4) Trava de palpite ("fechar o palpite de alguém"). Default false => nada muda p/ os atuais.
alter table public.predictions
  add column travado boolean not null default false;

-- 5) Dono não edita palpite travado (mantém a regra de "antes do jogo" intacta).
alter policy "palpites: edita antes do jogo" on public.predictions
  using (user_id = auth.uid() and not travado);

-- 6) Admin: vê, edita e cria QUALQUER palpite, sem restrição de horário (override).
create policy "palpites: admin le tudo" on public.predictions
  for select to authenticated using (public.is_admin());
create policy "palpites: admin edita tudo" on public.predictions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "palpites: admin cria pra qualquer um" on public.predictions
  for insert to authenticated with check (public.is_admin());;
