# Bolão da Copa 2026

Site simples pra galera dar palpite nos jogos da Copa 2026 e brigar pelo topo do ranking. Stack: React + Vite + Tailwind no front, Supabase (Postgres + Auth + RLS) no back. Sem servidor próprio.

Pro contexto completo, ver [CLAUDE.md](./CLAUDE.md) (stack e convenções) e [DESIGN.md](./DESIGN.md) (sistema visual).

---

## Rodar local

```bash
npm install
npm run dev          # http://localhost:5173
```

Sem o `.env` (próxima seção) a página carrega mas não autentica.

---

## Setup do Supabase

### 1. Criar o projeto

1. Conta em [supabase.com](https://supabase.com) (free tier serve).
2. **New project** → escolhe nome, gera senha do banco, região mais perto (ex.: `South America (São Paulo)`).
3. Espera o provisionamento (~1 min).

### 2. Rodar schema e seed

No painel, **SQL Editor** → **New query**:

1. Cola o conteúdo de `supabase/schema.sql` e roda. Cria as tabelas (`profiles`, `matches`, `predictions`), o trigger `handle_new_user`, todas as policies de RLS, a função `get_leaderboard` e os `revoke` que tiram execute do `public`/`anon`/`authenticated` onde apropriado.
2. **New query** de novo, cola `supabase/seed.sql` e roda. Insere os jogos confirmados (abertura + 3 do Brasil).
3. Pra cadastrar o resto dos jogos: **Table Editor** → `matches`, ou via SQL Editor usando o template comentado no `seed.sql`. Cuidado com fuso — o `seed.sql` usa BRT explícito com sufixo `-03`.

### 3. Ligar autenticação por e-mail

1. **Authentication** → **Providers** → **Email**. Liga. Pode deixar "Confirm email" desligado (o magic link já valida).
2. **Authentication** → **URL Configuration**:
   - **Site URL**: `http://localhost:5173`
   - **Redirect URLs**: adiciona `http://localhost:5173`. Quando subir em produção, adiciona a URL de prod aqui também.

### 4. Variáveis de ambiente

```bash
cp .env.example .env
```

No painel, **Project Settings** → **API**, copia:

- **Project URL** → `VITE_SUPABASE_URL`
- **anon public** → `VITE_SUPABASE_ANON_KEY`

Cola no `.env`. Reinicia `npm run dev` pra pegar as variáveis.

**Importante:** só essas duas variáveis no front. *Nunca* colocar `service_role` key, connection string ou senha do banco no código React (ver "Anti-trapaça" abaixo).

### 5. Virar admin

Depois de logar uma vez com o seu e-mail (o trigger cria a linha em `profiles`), abre o **SQL Editor** e roda:

```sql
update profiles
set is_admin = true
where id = (select id from auth.users where email = 'seu@email.com');
```

O `is_admin` ainda não muda a UI no v1 — operações de admin (cadastrar jogo, lançar placar) são feitas direto no **Table Editor** do Supabase.

---

## Fluxo do palpite

1. Usuário entra com magic link (sem senha).
2. Em `/`, vê os jogos abertos. Põe placar e salva.
3. Quando `now() >= matches.data_hora`, a RLS recusa novas inserções/atualizações. O palpite congela.
4. Admin lança o placar real (`gols_casa`, `gols_fora`) pelo Table Editor.
5. `/ranking` recalcula sozinho — `get_leaderboard` faz o cálculo na hora a partir das tabelas.

Regra de pontos (idêntica no front em `src/lib/pontos.js` e no banco):

| Acertou | Pontos |
|---|---|
| Placar exato (cravou) | 5 |
| Saldo de gols (ex.: 2×1 vs 3×2) | 3 |
| Só o resultado (V/E/D) | 1 |
| Nada | 0 |

---

## Anti-trapaça: a trava é no servidor

A regra "*não dá pra mudar o palpite depois do jogo começar*" está implementada como **RLS no Postgres**, **não no front**. Esconder o botão "Salvar" é só UX — quem souber abrir o DevTools consegue mandar um INSERT/UPDATE direto pra API REST do Supabase usando a `anon key` (que é pública de propósito).

A trava real está nas policies de `predictions` no `schema.sql`:

- INSERT e UPDATE só passam se `now() < (select data_hora from matches where id = match_id)`.
- O Postgres recusa com erro de permissão quando o jogo já começou.
- Não importa o cliente (browser, `curl`, script Python, Postman) — a trava é a mesma porque está no banco.

Por isso:

1. **Nunca remova ou afrouxe as policies** das tabelas. Sem elas, qualquer usuário logado pode editar palpite a qualquer hora.
2. **Nunca exponha a `service_role` key no front.** Essa chave pula RLS por design. Se vazar, qualquer um pode mudar qualquer palpite e qualquer placar.
3. **A `anon key` no `.env` é pública de propósito.** Pode ir pro bundle JS, pode ir pro repo. A segurança não vem de esconder a chave; vem da RLS recusar o que não pode.
4. **Sem dinheiro/aposta na plataforma.** O site só rastreia palpite e ranking. Grana (se rolar) é por fora, entre os amigos.

---

## Estrutura

```
.
├─ src/
│  ├─ lib/             supabase.js, grupos.js, pontos.js
│  ├─ context/         AuthContext.jsx
│  ├─ components/      Header, MatchCard, ProtectedRoute
│  └─ pages/           Login, Jogos, Ranking
├─ supabase/
│  ├─ schema.sql       tabelas + RLS + trigger + get_leaderboard
│  └─ seed.sql         jogos confirmados + template
├─ CLAUDE.md           contexto pro Claude Code
├─ DESIGN.md           sistema de design
└─ README.md           você está aqui
```

---

## Subir em produção

Não está coberto aqui. Quando for:

1. Adicionar a URL de produção em **Redirect URLs** (e atualizar **Site URL**) no painel do Supabase.
2. Configurar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no host (Vercel/Netlify/etc.).
3. `npm run build` gera os assets em `dist/`.
