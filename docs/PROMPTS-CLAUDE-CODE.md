# Prompts pro Claude Code — Bolão da Copa 2026

Construção em **5 módulos**. Cada um depende do anterior — mande na ordem e **revise o resultado antes** de ir pro próximo.

### Antes de começar
1. Crie uma pasta vazia e abra o Claude Code dentro dela.
2. Coloque **`CLAUDE.md`** e **`DESIGN.md`** na raiz da pasta (o Claude Code lê os dois como contexto).
3. Mande os prompts abaixo, um de cada vez.

> Dica: depois de cada módulo, peça `rode npm run build e me mostre se passou` antes de seguir.

---

## Módulo 1 — Scaffold + design tokens

```
Você é um dev frontend sênior. Leia o CLAUDE.md e o DESIGN.md desta pasta — eles são a fonte da verdade de stack, convenções e design.

Crie o scaffold de um projeto Vite + React 18 + JavaScript (JSX, sem TypeScript) + Tailwind CSS v3, configurado para um app de bolão da Copa 2026.

Inclua:
- package.json com: react, react-dom, react-router-dom, @supabase/supabase-js; devDeps: vite, @vitejs/plugin-react, tailwindcss@3, postcss, autoprefixer.
- vite.config.js, postcss.config.js.
- tailwind.config.js com TODOS os tokens do DESIGN.md (cores da paleta da Copa, fontFamily display=Anton e sans=Hanken Grotesk, borderRadius, boxShadow soft/hard, animação fade-up). Adicione no safelist as classes de cor de grupo montadas em runtime (bg-teal, bg-verde, bg-amarelo, bg-laranja, bg-vermelho, bg-vinho, bg-roxo, bg-azul).
- index.html com os <link> do Google Fonts (Anton + Hanken Grotesk pesos 400-800).
- src/index.css com as diretivas do Tailwind, body em bg-paper/text-ink/font-sans, utilitário .tnum (tabular-nums) e a classe .sunburst (raios concêntricos via repeating-conic-gradient nas cores da Copa).
- src/main.jsx renderizando <App/> (que pode ser um placeholder por enquanto).
- src/lib/supabase.js: cria o client com import.meta.env.VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY, com um console.error claro se faltarem.
- .env.example (as duas vars) e .gitignore (node_modules, dist, .env).

Restrições: idioma PT nos comentários; nada de hex solto (use tokens); sem localStorage.
Ao final, rode npm install e npm run build pra garantir que compila. Se algo estiver ambíguo, pergunte antes de implementar.
```

---

## Módulo 2 — Banco de dados (Supabase) + README

```
Agora o banco no Supabase (Postgres). Crie supabase/schema.sql para rodar UMA vez no SQL Editor. Siga o modelo de dados e as REGRAS INEGOCIÁVEIS do CLAUDE.md.

O schema.sql deve conter:
1. Tabela profiles (id uuid PK → auth.users on delete cascade, nome text, is_admin bool default false, created_at).
2. Trigger handle_new_user (security definer) que cria o profile no primeiro login, usando o nome de raw_user_meta_data->>'nome' ou, se vazio, a parte do e-mail antes do @.
3. Tabela matches (id identity, time_casa, time_fora, fase default 'grupos', grupo, estadio, data_hora timestamptz, gols_casa int null, gols_fora int null).
4. Tabela predictions (id identity, user_id→profiles, match_id→matches, palpite_casa/palpite_fora int com check 0..99, created_at, unique(user_id, match_id)).
5. RLS habilitado nas 3 tabelas, com policies:
   - profiles: leitura geral (authenticated); update só do próprio.
   - matches: leitura geral; escrita (all) só se o usuário for is_admin.
   - predictions: SELECT do próprio sempre, e dos outros só DEPOIS de now() >= data_hora do jogo; INSERT e UPDATE só do próprio E só enquanto (select data_hora from matches where id=match_id) > now(). Essa trava server-side é obrigatória.
6. Função get_leaderboard() (language sql, security definer, expõe só agregados): retorna user_id, nome, pontos, cravadas, somando pontos por jogo encerrado com a regra placar exato=5 / mesmo saldo=3 / mesmo resultado(sign)=1 / senão 0, agrupando por usuário (todos os profiles aparecem, mesmo com 0) e ordenando por pontos desc, cravadas desc, nome asc. grant execute para authenticated.

Crie também o README.md com o setup do Supabase passo a passo (criar projeto, rodar schema.sql e seed.sql, ligar Email provider + Redirect URL http://localhost:5173, preencher .env, virar admin via UPDATE) e a seção "anti-trapaça" explicando que a trava é por RLS.

Se algo estiver ambíguo, pergunte antes.
```

---

## Módulo 3 — Autenticação + casca do app

```
Implemente a autenticação por magic link (Supabase Auth) e a estrutura de navegação.

- src/context/AuthContext.jsx: provider com session, user, profile (nome, is_admin), loading. Usa supabase.auth.getSession() e onAuthStateChange. Carrega o profile quando a sessão muda. Expõe entrar(email, nome) → signInWithOtp com options.data.nome e emailRedirectTo = window.location.origin; e sair(). Hook useAuth().
- src/components/ProtectedRoute.jsx: mostra "carregando…" enquanto loading; redireciona pra /login se não houver sessão.
- src/components/Header.jsx: barra sticky com um wordmark ORIGINAL (ex.: bloco "26" em Anton + "BOLÃO DA COPA") — nunca o emblema da FIFA. Abas Jogos e Ranking (NavLink, ativa sublinhada em verde). Nome do usuário + botão "sair".
- src/pages/Login.jsx: hero com a classe .sunburst (texto sempre num bloco sólido por cima), formulário com "Seu nome" + "E-mail" e botão "enviar link de acesso"; depois de enviar, tela de "verifique seu e-mail". Trata erro. Se já logado, redireciona pra /.
- src/App.jsx: BrowserRouter com rotas /login (pública), / (Jogos) e /ranking (Ranking), as duas últimas dentro de ProtectedRoute + Header. (Jogos e Ranking podem ser placeholders aqui.)

Siga o DESIGN.md (botões verde com shadow-hard, raios, etc.). PT em tudo. Rode o build ao final. Pergunte se faltar algo.
```

---

## Módulo 4 — Jogos e palpites (o coração)

```
Implemente os jogos e o palpite.

- src/lib/grupos.js: corDoGrupo(letra) ciclando pelas 8 cores da Copa (teal, verde, amarelo, laranja, vermelho, vinho, roxo, azul); classeDoGrupo(letra) retornando { bg, text } com texto escuro nos fundos claros (amarelo/teal); bandeira(time) com um mapa emoji das seleções (degrada pra string vazia se não achar).
- src/lib/pontos.js: calcularPontos(pc, pf, gc, gf) espelhando EXATAMENTE a regra do banco (5/3/1/0, null se sem resultado); chipDePontos(pontos) retornando { label, className } com strings de classe COMPLETAS (não dinâmicas).
- src/components/MatchCard.jsx: recebe match, palpite (do usuário) e onSaved. Calcula trancado = data_hora <= agora e encerrado = gols não nulos. Mostra badge do grupo + data/hora em horário de Brasília (Intl com timeZone America/Sao_Paulo). 
  - Aberto: dois inputs de placar (numéricos, 0-99) + botão "salvar/atualizar palpite" que faz upsert em predictions (onConflict user_id,match_id). Se o banco recusar (jogo começou), mostra erro amigável.
  - Trancado: inputs desabilitados; se encerrado, mostra o placar real grande + "seu palpite: x × y" + chip de pontos.
- src/pages/Jogos.jsx: busca matches (order data_hora asc) e os palpites do próprio usuário (mapa por match_id). Separa em "PALPITE AÍ" (abertos, asc) e "JÁ ROLARAM" (trancados, desc). Grid responsivo, fade-up escalonado. onSaved recarrega os palpites.

PT em tudo, tokens do DESIGN.md. Rode o build. Pergunte se algo estiver ambíguo.
```

---

## Módulo 5 — Ranking + seed + acabamento

```
Finalize com o ranking, o seed e o polimento.

- src/pages/Ranking.jsx: chama supabase.rpc('get_leaderboard'). Lista ordenada: posição (Anton, medalha 🥇🥈🥉 no top 3), nome (marca "(você)" na própria linha), nº de cravadas, e pontos em destaque. 1º lugar com borda/realce dourado (token ouro); a linha do próprio usuário com ring verde. Rodapé com a legenda da pontuação. Estado vazio amigável.
- supabase/seed.sql: insere SÓ os jogos confirmados (data/hora em Brasília, fonte oficial) — abertura México×África do Sul (11/06 16h, Azteca) e os 3 do Brasil no Grupo C: ×Marrocos (13/06 19h, MetLife), ×Haiti (19/06 22h, Lincoln Financial), Escócia×Brasil (24/06 19h, Hard Rock). Deixe um INSERT template comentado e, como comentário, a lista dos 12 grupos finais pra cadastrar o resto.
- Passe o olho geral: loading/erro em todas as telas, responsivo no mobile, alvos de toque ≥44px, foco visível. Rode npm run build.

Não invente os outros 68 jogos nem horários que não tem certeza — horário errado quebra a trava do palpite. Pergunte se faltar contexto.
```

---

## Depois de construir

- Rode o `schema.sql` e o `seed.sql` no Supabase, preencha o `.env`, `npm run dev`.
- Resultados entram pelo Table Editor do Supabase (colunas `gols_casa`/`gols_fora`) — o ranking recalcula sozinho.
- Os 12 grupos finais e o calendário oficial: complete a tabela `matches` quando quiser (ou peça o seed completo dos 72 jogos).
