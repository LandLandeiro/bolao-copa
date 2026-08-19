# Cravada

Bolão de palpites entre amigos: cada um crava o placar dos jogos e disputa um ranking. Hospeda mais de um campeonato ao mesmo tempo — hoje o **Brasileirão 2026 (returno)** em andamento e a **Copa do Mundo 2026** arquivada.

O nome vem da palavra que o próprio bolão usa pro placar exato — a *cravada*, a jogada que vale mais ponto.

---

## Stack

| Peça | Escolha | Por quê |
|---|---|---|
| UI | **React 18 + Vite** | SPA atrás de login: não há conteúdo público pra indexar, então SSR não paga o próprio custo. Vite dá build e HMR rápidos. |
| Linguagem | **JavaScript (JSX)**, não TypeScript | Projeto de alguém aprendendo. Clareza acima de cerimônia — a segurança crítica está no banco, não no sistema de tipos. |
| Rotas | **React Router** | Meia dúzia de telas, navegação client-side. Nada mais pesado se justifica. |
| Estilo | **Tailwind CSS v3** | Tokens centralizados em `tailwind.config.js`. Nada de hex solto no JSX. |
| Back | **Supabase** (Postgres + Auth + RLS) | O back inteiro sem servidor próprio. Decisivo: dá pra pôr a regra de negócio crítica **dentro do banco**, como RLS — ver [Segurança](#segurança). |
| Auth | **Magic link** do Supabase | Sem senha pra guardar, sem fluxo de recuperação pra escrever. |
| Fontes | **Anton** (display) + **Hanken Grotesk** (UI) | Grátis, via Google Fonts. Ver [docs/DESIGN.md](./docs/DESIGN.md). |

Sem servidor próprio, sem API intermediária: o React fala direto com o Postgres via PostgREST, e quem decide o que pode passar é a RLS.

---

## Arquitetura

### Pontuação calculada sob demanda, não persistida

Não existe coluna `pontos` em lugar nenhum. O ranking é calculado na hora, em SQL, a partir de duas tabelas: `predictions` (o que cada um palpitou) e `matches` (como o jogo terminou). Duas funções fazem isso — `get_match_points()` para o detalhe jogo a jogo e `get_leaderboard()` para o agregado do ranking.

A alternativa óbvia seria gravar o ponto no momento em que o admin lança o placar. Foi descartada, e o que a escolha resolve é:

- **Não existe estado derivado pra dessincronizar.** Placar corrigido depois de lançado — acontece — e o ranking já sai certo na próxima leitura. Com pontuação persistida seria preciso um recálculo em cascata, e todo recálculo em cascata que ninguém rodou é um ranking errado que ninguém percebeu.
- **Não existe pontuação pra adulterar.** Um atacante que quisesse inflar a própria pontuação precisaria alterar o palpite ou o placar — e os dois estão trancados pela RLS. Não há linha de "pontos" exposta na API pra escrever por cima.
- **Mudar a regra é uma migration, não um backfill.** Quando o peso por fase entrou (`20260614220200`), o histórico inteiro passou a valer sob a regra nova sem tocar em uma linha de dado.
- **A escala permite.** São dezenas de usuários e centenas de jogos. O custo de recalcular tudo a cada leitura é irrelevante nessa ordem de grandeza — e essa é a premissa que sustenta a decisão. Ela é o primeiro item a revisitar se o projeto crescer muito.

O preço pago: `get_leaderboard()` varre `predictions` inteira a cada abertura do ranking. É consciente e, nesse tamanho, barato.

## Motor de pontuação — a escrever pelo Lucca

> _Seção reservada. A regra vive em `src/lib/pontos.js` (front) e nas funções `score_base` / `score_peso` (banco), e as duas têm que bater._

---

## Modelo de dados

Seis tabelas em `public`. O schema versionado está em `supabase/migrations/`.

| Tabela | Papel |
|---|---|
| **`torneios`** | Os campeonatos que o site hospeda (`copa-2026`, `brasileirao-2026`). A flag `encerrado` marca o que virou arquivo. É a dimensão que torna o app multi-torneio. |
| **`matches`** | Os jogos. Guarda times, `fase`, `estadio`, `data_hora` e o placar oficial (`gols_casa` / `gols_fora`, nulos até o jogo acabar). Duas formas de campeonato convivem aqui: mata-mata usa `fase` (`grupos`, `oitavas`, … `final`) e o Brasileirão usa `fase = 'rodada'` com o número em `rodada`. Constraints garantem que as duas formas não se misturem. |
| **`predictions`** | O palpite: um por usuário por jogo (`unique(user_id, match_id)`). A coluna `travado` deixa o admin fechar um palpite específico à mão. |
| **`profiles`** | Espelho de `auth.users` com o que o app precisa mostrar: `nome` (o nick), `is_admin` e `nome_escolhido` (marca se a pessoa já passou pelo gate de escolher nome no 1º login). Criado por trigger no primeiro acesso. |
| **`classificacao`** | A tabela **oficial** do campeonato (posição, pontos, jogos, vitórias), lançada pelo admin. Não tem relação com o bolão — serve pra exibir a classificação real ao lado do ranking dos amigos. |
| **`mural`** | Recados e zoeira entre os participantes. Texto de 1 a 280 caracteres, sem edição: cria e apaga. |

---

## Segurança

**A trava do palpite é no servidor, não no front.** Esconder o botão "Salvar" é UX. Quem abrir o DevTools consegue mandar um `INSERT` direto na API REST do Supabase com a `anon key` — que é **pública de propósito** e vai no bundle. A segurança não vem de esconder a chave; vem da RLS recusar o que não pode.

RLS está habilitada nas seis tabelas, e **nenhuma policy alcança o papel anônimo**: sem sessão, o banco não devolve nada.

| Tabela | Leitura | Escrita |
|---|---|---|
| `torneios`, `classificacao`, `matches` | qualquer pessoa logada | só admin |
| `profiles` | qualquer pessoa logada | só o próprio dono (ou admin) — e um *grant por coluna* limita o `UPDATE` a `nome` e `nome_escolhido`, então **ninguém se promove a admin pela API** |
| `predictions` | o próprio palpite sempre; o dos outros **só depois que o jogo começa** | só o próprio dono, e só com o palpite aberto |
| `mural` | qualquer pessoa logada | cria e apaga só o próprio recado; não existe `UPDATE` |

### Quando o palpite fecha

A regra vive numa função só, `palpite_aberto(match_id)`, usada pelas policies de `INSERT` e `UPDATE` de `predictions`. São **duas travas independentes**:

1. **Placar lançado.** Se `gols_casa` ou `gols_fora` já foi preenchido, o palpite está fechado — não importa a data. É a trava que corresponde ao que de fato pontua: `get_match_points()` conta todo palpite de jogo com placar.
2. **Prazo.** Jogo com data fecha no apito inicial (`data_hora > now()`). Jogo ainda sem data marcada herda o prazo do primeiro jogo da mesma rodada; se a rodada inteira também não tem data, fecha.

Além disso, `predictions` não tem policy de `DELETE`: palpite não se apaga pela API, nem pelo dono nem pelo admin.

O Postgres recusa o que violar isso independentemente do cliente — browser, `curl`, script Python ou Postman. **Nunca afrouxe essas policies**, e nunca exponha a `service_role key` no front: ela pula RLS por design.

Não há dinheiro nem aposta na plataforma. O site rastreia palpite e ranking; o resto é entre os amigos.

---

## Rodar localmente

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
```

Precisa de um projeto Supabase próprio. Copie `.env.example` para `.env` e preencha:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Os dois valores estão em **Project Settings → API** no painel do Supabase (`Project URL` e a chave `anon public`). Sem eles a página carrega mas não autentica.

Para criar o schema num projeto novo, aplique os arquivos de `supabase/migrations/` em ordem cronológica e depois `supabase/seed.sql`. O passo a passo completo — incluindo autenticação, virar admin e a governança de migrations — está em **[docs/OPERACAO.md](./docs/OPERACAO.md)**.

---

## Estrutura de pastas

```
.
├─ src/
│  ├─ pages/          telas (Jogos, Ranking, Chaveamento, Tabela, Mural, Confronto, Perfil, Login)
│  ├─ components/     UI reutilizável (MatchCard, Header, Loader, bracket/…)
│  ├─ admin/          área /admin (jogos, palpites, usuários, ranking)
│  ├─ context/        AuthContext (sessão + perfil), TorneioContext (torneio ativo)
│  └─ lib/            regra e acesso a dado (supabase, dados, pontos, palpite, bracket, skin…)
├─ supabase/
│  ├─ migrations/     schema versionado — tabelas, RLS, constraints, funções
│  ├─ seed.sql        jogos de referência
│  └─ config.toml     config do CLI
├─ public/            assets servidos (escudos, logos, imagens de hero)
├─ docs/              design, operação e material de processo
├─ scripts/          og-fonte.html (gera a imagem de Open Graph)
├─ chaveamento/       especificação visual do bracket
├─ CLAUDE.md          contexto pro Claude Code
└─ README.md          você está aqui
```

Documentação relacionada: **[docs/DESIGN.md](./docs/DESIGN.md)** (sistema visual), **[docs/OPERACAO.md](./docs/OPERACAO.md)** (runbook), **[CLAUDE.md](./CLAUDE.md)** (convenções do projeto).
