# Agentes, Skills e MCP pro Claude Code

Recomendação **enxuta** pro seu projeto (React + Supabase). Regra de ouro: poucos e certeiros. Rodar muitos MCP ao mesmo tempo polui o contexto e piora o agente — comece com 2-3.

## Mapa rápido (o que é o quê)

- **CLAUDE.md** — contexto que entra em toda sessão (regras, stack, convenções). Você já tem.
- **Skill** — procedimento sob demanda (`.claude/skills/<nome>/SKILL.md`). O Claude carrega quando a descrição bate com a tarefa. Cada skill vira um `/comando`.
- **Subagente** — trabalhador isolado, com contexto próprio (`.claude/agents/<nome>.md`). Bom pra tarefa "barulhenta" (revisão, varredura) que não precisa sujar a conversa principal.
- **MCP** — conecta o Claude a ferramentas externas (seu banco, docs, etc.).
- **Plugin** — empacota skills/agentes/hooks pra compartilhar. (Não precisa agora.)

---

## 1. MCP — os que valem pra esse projeto

### Supabase MCP (prioridade alta)
Conecta o Claude Code direto ao seu projeto Supabase: criar/inspecionar tabelas, rodar SQL, ver config, consultar dados. Pro seu caso é ouro — ele aplica o `schema.sql`, confere as policies, testa queries sem você sair do terminal.

- Setup: gere a URL de MCP na aba **MCP / Connect** do dashboard do Supabase, ou adicione pelo `claude mcp add`. (O Supabase tem doc de setup oficial.)
- ⚠️ **Segurança (leia):** ligar um LLM no seu banco tem risco de *prompt injection* — um dado malicioso numa tabela pode tentar fazer o agente rodar query que não devia. Mitigações:
  - Use **modo read-only** sempre que possível.
  - Aponte pra um **projeto de dev**, não produção.
  - **Revise cada tool call** antes de aprovar (deixe a confirmação manual ligada).

### Context7 MCP (prioridade alta)
Puxa a documentação **atual** de React, Supabase, Tailwind, etc. direto pro contexto. Mata aquele bug clássico de o modelo usar uma API desatualizada — útil demais pra quem tá aprendendo.

```bash
claude mcp add context7 -- npx -y @upstash/context7-mcp
```
Uso: peça algo como "como faço signInWithOtp no supabase-js, use o context7".

### Depois (só se precisar)
- **GitHub MCP** — se for versionar o projeto num repo (PRs, issues, busca de código).
- **Playwright MCP** — se um dia adicionar testes de navegador (clicar, preencher form, validar fluxo de login).

Não instale agora — só quando a necessidade aparecer.

---

## 2. Subagente — um revisor read-only

O subagente mais útil pra você é um **revisor de código** que roda depois das mudanças e foca no que mais importa nesse projeto: **a trava de segurança (RLS), os segredos e a regra de pontuação**. Read-only (não edita nada), então é seguro.

- Coloque o arquivo `revisor.md` (entregue junto) em **`.claude/agents/revisor.md`** na raiz do projeto.
- Use com `/agents` pra ver, ou simplesmente peça: "revise as últimas mudanças com o revisor".

> Já existe um subagente embutido chamado **claude-code-guide**: quando você pergunta ao Claude Code sobre os próprios recursos ("como escrevo uma skill?", "como adiciono um MCP?"), ele consulta a doc oficial sozinho. Não precisa criar.

---

## 3. Skills

**Duas regras antes de sair instalando:**
- **Tem orçamento.** O Claude Code tem um limite de ~15.000 caracteres pro total das descrições de skills/comandos/agentes no system prompt. Instalar skill demais não é só "desnecessário" — **piora o agente** e estoura o limite. Pra conferir quantas estão ativas, pergunte ao Claude Code: *"quantas skills você vê no seu system prompt?"*.
- **Confiança.** Skill pode executar código no ambiente do Claude. Fique nas **oficiais** (`anthropics/…`, `supabase/…`) ou em repos bem avaliados, e **leia o SKILL.md** antes de instalar.

Por isso a recomendação é em camadas — instale só o Tier 1 agora.

### Tier 1 — instala agora (alto valor pro seu projeto)
- **`frontend-design`** (oficial Anthropic) — foge da estética genérica de "AI slop", tunada pra React + Tailwind. Não vem ativa por padrão; ativa sozinha em tarefas de front depois de instalada.
- **`postgres-best-practices`** (oficial **Supabase**) — regras de boas práticas de Postgres/Supabase (otimização, índices, RLS) em ~8 categorias. Bate em cheio com o seu `schema.sql` e as policies. Mantém o banco saudável e as queries do ranking eficientes.

Instalar (escolha um caminho):
```bash
# Dentro do Claude Code (recomendado):
/plugin            # → Add Marketplace → anthropics/claude-code → instalar frontend-design

# Via CLI (npx skills):
npx skills add https://github.com/anthropics/skills --skill frontend-design

# Supabase postgres-best-practices: adicione o marketplace e instale por lá
/plugin marketplace add anthropics/skills
```

> **Skill vs DESIGN.md (não confundir):** a skill de design dá a *metodologia* genérica; o DESIGN.md dá as *decisões concretas* do seu projeto. Use os dois.

### Tier 2 — quando chegar a hora
- **`webapp-testing`** (oficial Anthropic, Playwright) — testa o fluxo no navegador. Vale quando o MVP estiver de pé, pra **provar que a trava do palpite funciona de verdade** (tentar palpitar com o jogo já começado e confirmar que o banco recusa).
- **Code review de comunidade** (ex.: `code-review-skill`, cobre React 19/TS) — *só se* quiser revisão a nível de linguagem. Pro seu caso, o **subagente `revisor`** que já te entreguei cobre o que mais importa (RLS, segredos, pontuação) e é mais focado. Comece por ele.

### Tier 3 — pula por enquanto (mas bom saber que existe)
- `shadcn-ui`, `tailwind-theme-builder` — você usa Tailwind puro com tokens no DESIGN.md; não precisa.
- `mcp-builder` — só se for criar seu próprio servidor MCP.
- **Skills de segurança Trail of Bits** (CodeQL/Semgrep) — nível auditoria profissional. Overkill pra um bolão; guarde pra um projeto sério de verdade.
- `react-patterns` / performance / `test-driven-development` — boas práticas, mas processo demais pra um MVP divertido.

### Custom do seu projeto (deixa pra depois)
O "como o projeto faz as coisas" já está no CLAUDE.md + DESIGN.md. Skill custom só compensa pra **procedimento repetido**:
- **`novo-jogo`** — cadastra um jogo na `matches` seguindo o padrão (fase, grupo, horário de Brasília, validação).
- **`nova-pagina`** — cria uma página seguindo as convenções (rota protegida, header, tokens, loading/erro).

Quando notar que tá repetindo o mesmo pedido com variações, vira skill. Antes disso, não.

---

## Setup sugerido (resumo)

1. **Skills Tier 1:** `frontend-design` + `postgres-best-practices` (Supabase).
2. `.claude/agents/revisor.md` no projeto.
3. Context7 MCP via `claude mcp add`.
4. Supabase MCP (dev, read-only, confirmação manual).
5. Tier 2 (`webapp-testing`) quando o MVP estiver de pé. Tier 3 e custom: depois.
