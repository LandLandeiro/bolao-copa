-- Ranking: só quem está logado pode chamar (mantém o grant a authenticated, remove anon/public)
revoke execute on function public.get_leaderboard() from public, anon;

-- Função de trigger: não deve ser chamável via API. O trigger continua disparando normal.
revoke execute on function public.handle_new_user() from public, anon, authenticated;;
