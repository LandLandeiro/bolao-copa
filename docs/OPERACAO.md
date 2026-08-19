# Operação

Runbook do Cravada: montar um projeto do zero, mexer no schema e o que nunca rodar contra produção. Se você só quer rodar o app localmente, o [README](../README.md) basta.

---

## 1. Criar o projeto no Supabase

1. Conta em [supabase.com](https://supabase.com) (free tier serve).
2. **New project** → nome, senha do banco, região mais perto (ex.: `South America (São Paulo)`).
3. Espera o provisionamento (~1 min).

## 2. Aplicar schema e seed

O schema vive em `supabase/migrations/`. Não há mais `schema.sql`.

- **Banco local de dev:** `supabase db reset` aplica migrations + seed de uma vez. **Sem `--linked`.**
- **Cópia remota nova:** no **SQL Editor**, cole o conteúdo de `supabase/migrations/` em ordem cronológica e depois rode `supabase/seed.sql`.

## 3. Ligar autenticação por e-mail

1. **Authentication → Providers → Email**: liga. Pode deixar "Confirm email" desligado — o magic link já valida.
2. **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:5173`
   - **Redirect URLs**: adiciona `http://localhost:5173`. Ao subir em produção, adiciona a URL de prod aqui também.

## 4. Variáveis de ambiente

```bash
cp .env.example .env
```

Em **Project Settings → API**, copia **Project URL** → `VITE_SUPABASE_URL` e a chave **anon public** → `VITE_SUPABASE_ANON_KEY`. Reinicia o `npm run dev`.

Só essas duas variáveis no front. **Nunca** `service_role` key, connection string ou senha de banco no código React.

## 5. Virar admin

`is_admin` não é editável pela API — um grant por coluna impede isso de propósito. A promoção é feita fora do app, no **SQL Editor**:

```sql
update profiles
set is_admin = true
where id = (select id from auth.users where email = 'seu@email.com');
```

Operações de admin (cadastrar jogo, lançar placar, travar palpite) ficam na área `/admin` do próprio site.

---

## Governança de migrations

O schema — tabelas, RLS, constraints, funções, triggers — é versionado em `supabase/migrations/`, junto do `supabase/config.toml`. O `supabase/seed.sql` é só dado de referência; não cria estrutura.

**A regra que mantém o git como espelho fiel do remoto:**

1. Mudança de schema é aplicada no remoto **via MCP**, com revisão.
2. **Logo depois**, rode `supabase migration fetch --linked` e commite. Ninguém precisa dar push de migration local em produção.

```bash
# Setup único (o CLI não vem instalado):
brew install supabase/tap/supabase
supabase login
supabase init                                       # cria config.toml + supabase/.gitignore
supabase link --project-ref <seu-project-ref>       # pede a DB password

# Depois de cada migration aplicada via MCP:
supabase migration fetch --linked                   # READ-ONLY: baixa as migrations do histórico remoto
git add supabase/migrations && git commit -m "espelha schema: <o que mudou>"

# Conferir divergência entre local e remoto:
supabase migration list --linked

# Recriar um banco LOCAL do zero (dev) — aplica migrations + seed:
supabase db reset                                   # SEM --linked (só o banco local)
```

> `supabase migration fetch` não aparece no índice de subcomandos do `--help`, mas existe e funciona.

⚠️ Use `migration fetch`, **não** `supabase db pull`. Com as migrations já registradas no histórico do remoto, o `db pull` reclama de *"migration history does not match local files"* e sugere `supabase migration repair --status reverted <versão>`. **Não rode o `repair`** — ele *escreve* na tabela de histórico do remoto.

### Migrations que existem só localmente

Duas migrations aparecem como "só local" no `migration list`, **de propósito**:

| Migration | Por quê |
|---|---|
| `20260721151220_backfill_score_helper_functions` | `score_base` / `score_peso` foram criadas fora do histórico. A migration seguinte (`…151221`) cria `get_match_points`, cujo corpo as chama — sem elas, um rebuild do zero falha. Daí o timestamp encravado um segundo antes. |
| `20260819180733_backfill_mural` | A tabela `mural` também nasceu fora do histórico. Nada depende dela, então o timestamp é o de hoje. |

As duas descrevem objetos que **já existem** em produção. Servem para que aplicar `supabase/migrations/` num banco vazio reproduza o schema real. Não aplique nenhuma delas no remoto.

---

## 🚫 Nunca contra produção

```
supabase db reset --linked      # apaga o banco
supabase db push                # empurra schema local pro remoto
supabase migration repair       # reescreve o histórico
```

O caminho de schema em produção é **só MCP → `migration fetch` → commit**.

Cuidado extra com o `db push`: as duas migrations de backfill acima ficariam elegíveis para aplicação.

---

## Checklist antes de mexer no schema em produção

Tem gente com palpite em aberto e campeonato em andamento. Antes de qualquer escrita:

1. **Salve o estado atual do objeto** que vai mudar (`pg_get_functiondef`, `pg_policies`) num arquivo de rollback.
2. **Simule o impacto como `SELECT`** antes de aplicar. Para mudanças em `palpite_aberto()`, compare o estado aberto/fechado dos jogos antes e depois — nenhum jogo aberto deve fechar sem você saber.
3. **Teste com RLS de verdade**, não só introspecção. O MCP roda como service role e pula RLS, então não testa nada. Dentro de `BEGIN … ROLLBACK`:

   ```sql
   begin;
   select set_config('request.jwt.claims','{"sub":"<uuid-nao-admin>","role":"authenticated"}', true);
   set local role authenticated;
   -- ... tente o INSERT que deve passar e os que devem falhar ...
   rollback;
   ```

   Recusa de policy volta como `sqlstate 42501`.
4. **Confira as contagens** depois do rollback e compare com as de antes.
5. **Registre no histórico** via MCP `apply_migration`, e traga o arquivo com `migration fetch --linked`. Se o timestamp gerado diferir do seu arquivo local, renomeie o local para casar.
