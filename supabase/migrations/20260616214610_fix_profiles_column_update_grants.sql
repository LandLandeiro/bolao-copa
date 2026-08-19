-- O UPDATE no nível da TABELA cobria todas as colunas (inclusive is_admin), por isso o
-- revoke de coluna anterior não bastou. Remove o update de tabela e concede só as colunas
-- legítimas que o usuário (e o admin) realmente editam.
revoke update on public.profiles from authenticated, anon;
grant update (nome, nome_escolhido) on public.profiles to authenticated;;
