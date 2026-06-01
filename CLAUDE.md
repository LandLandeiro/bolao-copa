# CLAUDE.md

Contexto do projeto pro Claude Code. Mantenha conciso — isto entra no contexto toda sessão.

## O que é

Site de **bolão da Copa do Mundo 2026**: amigos dão palpite de placar nos jogos e disputam um ranking. Escopo de MVP, sem complexidade desnecessária.

## Stack

- **Front:** React 18 + Vite + JavaScript (JSX, **não** TypeScript) + React Router.
- **Estilo:** Tailwind CSS v3 (tokens em `tailwind.config.js` — ver DESIGN.md).
- **Back:** Supabase (Postgres + Auth + RLS). Sem servidor próprio.
- **Fontes:** Anton (display) + Hanken Grotesk (UI), via Google Fonts.

## Comandos

```bash
npm install
npm run dev      # localhost:5173
npm run build
```

## Estrutura

```
src/
  lib/         supabase.js (cliente), grupos.js (cor/bandeira), pontos.js (regra de pontos)
  context/     AuthContext.jsx (sessão + perfil + login)
  components/  Header, MatchCard, ProtectedRoute
  pages/       Login, Jogos, Ranking
supabase/
  schema.sql   tabelas + RLS + função get_leaderboard (rodar 1x no SQL Editor)
  seed.sql     jogos confirmados + template
```

## Modelo de dados (3 tabelas)

- **profiles** (`id`→auth.users, `nome`, `is_admin`) — criado por trigger no primeiro login.
- **matches** (`time_casa`, `time_fora`, `fase`, `grupo`, `estadio`, `data_hora`, `gols_casa`, `gols_fora`).
- **predictions** (`user_id`, `match_id`, `palpite_casa`, `palpite_fora`) — `unique(user_id, match_id)`.

## Pontuação (regra única — front e banco têm que bater)

placar exato = **5** · acertou o saldo de gols = **3** · acertou o resultado (V/E/D) = **1** · errou = **0**.

## ⚠️ Regras inegociáveis

1. **A trava do palpite é no servidor (RLS), não só no front.** O Postgres recusa insert/update de palpite quando `now() >= matches.data_hora`. Esconder o botão no front é UX; a RLS é a segurança. Nunca remover.
2. **A `anon key` é pública de propósito** — pode ir no front. O controle é por RLS, não por esconder a chave.
3. **Segredos nunca no front:** nada de service-role key, connection string ou senha de banco no código React. Só `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (do `.env`, que está no `.gitignore`).
4. **Sem `localStorage`/`sessionStorage`** pra estado de domínio — a fonte da verdade é o Supabase.
5. **Sem dinheiro/aposta na plataforma.** O site só rastreia palpite e ranking. Grana (se houver) é por fora, entre os amigos.

## Escopo — NÃO fazer no v1

- Sem integração com API de futebol (resultado entra na mão pelo Table Editor / admin).
- Sem sistema de múltiplos bolões/ligas.
- Sem bracket automático do mata-mata (admin cadastra os jogos).
- Auth = magic link do Supabase. Não inventar fluxo de senha.

## Convenções

- **Idioma:** UI e comentários em **português**. Nomes de tabela/coluna em português.
- Componentes pequenos e legíveis (é projeto de alguém aprendendo — clareza > esperteza).
- Cores e fontes **sempre** via tokens do Tailwind (DESIGN.md). Nada de hex solto no JSX.
- Classe de Tailwind montada em runtime (ex.: `bg-${cor}`) precisa estar no `safelist` do config, senão o build remove.

## Design

Sistema completo em **DESIGN.md** (paleta da Copa 2026, tipografia, componentes, motivo dos raios). Resumo: base clara (`paper`) + primária `verde #00A859` + acentos pontuais; display em Anton; sombra `hard` (4px 4px 0) como assinatura retrô. **Disciplina:** cor saturada no hero/badges, base calma na lista/ranking.

## Marca (IP)

Identidade **original** inspirada na vibe da Copa (cores fortes, retrô-pop, raios concêntricos). **Nunca** reproduzir o emblema oficial "26"+taça da FIFA nem a fonte FWC 2026.

## Supabase — setup

Ver README.md. Resumo: criar projeto → rodar `schema.sql` e `seed.sql` no SQL Editor → ligar Email provider + Redirect URL `http://localhost:5173` → preencher `.env`. Admin: `update profiles set is_admin=true where id=(select id from auth.users where email='...')`.
