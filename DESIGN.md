# DESIGN.md — Sistema de Design do Bolão da Copa 2026

> Identidade visual **original** do nosso bolão, inspirada na energia da Copa 2026 (retrô-pop, cores fortes, raios concêntricos) **sem copiar** o emblema, a fonte ou os logos oficiais da FIFA. Tudo aqui usa fontes grátis e cores próprias. Pareia com a stack do projeto: **Tailwind CSS**.

---

## 1. Princípios

1. **Energia de torcida.** Cor saturada, contraste alto, sensação de festa. Sóbrio é o oposto do que queremos nas áreas de destaque.
2. **Dado primeiro.** Hero e headers podem ser exuberantes; tabelas (jogos, ranking) são limpas e legíveis. **Nunca** colocar padrão decorativo atrás de dado denso.
3. **Mobile-first.** A galera vai palpitar no celular. Alvo de toque ≥ 44px, inputs grandes.
4. **Original por design.** A vibe é da Copa; a marca é nossa. (Ver §9.)

---

## 2. Cores

Paleta da Copa 2026 (versão refinada — bem mais próxima do look oficial multicolor). São as cores de marca; aplicadas com **disciplina** na UI (acentos sobre base calma), não tudo saturado em toda tela.

### Base / neutros
| Token | Hex | Uso |
|---|---|---|
| `ink` | `#161618` | Texto principal, fundos escuros, bordas de "sticker" |
| `paper` | `#FAF6EE` | Fundo da página (off-white quente, cara de pôster) |
| `cloud` | `#FFFFFF` | Fundo de cards |
| `slate` | `#6E6A66` | Texto secundário, estados "0 ponto" |
| `line` | `#E7E1D6` | Bordas e divisores |

### Marca / destaque (8 cores da Copa)
| Token | Hex | Papel |
|---|---|---|
| `verde` | `#00A859` | **Cor primária** — botões, links, acertos |
| `teal` | `#2BD9B0` | acento |
| `amarelo` | `#FFD23F` | acento (ouro da Copa) |
| `laranja` | `#FF7A00` | acento |
| `vermelho` | `#E63329` | acento / perigo |
| `vinho` | `#8B1E2D` | acento (profundidade) |
| `roxo` | `#7B2FBE` | acento |
| `azul` | `#2D5BFF` | acento |

`verde-dark` (`#00824A`) = hover do primário.

### Acentos rotativos (badges de grupo A–L)
Ciclam pelas 8 cores acima na ordem: teal → verde → amarelo → laranja → vermelho → vinho → roxo → azul (repete em I–L).

### Ouro (exclusivo do 1º lugar / campeão)
| Token | Hex | Uso |
|---|---|---|
| `ouro` | `#C28A1E` | Borda/realce do líder do ranking (dourado mais fundo que o `amarelo`, pra não confundir com o chip de 3 pts) |
| `ouro-text` | `#5C3F08` | Texto sobre ouro |

### Semântico (pontuação)
Cada faixa de pontos tem cor fixa — **e sempre acompanha número/label** (nunca só cor):
- **5 pts (cravou):** `verde`
- **3 pts (saldo):** `amarelo` (texto em `ink`)
- **1 pt (resultado):** `azul`
- **0 pt:** `slate`
- **Perigo/excluir:** `vermelho` (uso raro — só ações destrutivas, não pra "errou o palpite")

> **Disciplina de cor (importante):** o pôster/hero pode ir full rainbow (concêntrico/espelhado). A UI de dado (lista de jogos, ranking) usa base `paper` + 1 cor primária + acentos pontuais (badge de grupo, chip de pontos). Cor demais em tabela mata a legibilidade.

---

## 3. Tipografia

Sistema de **2 fontes grátis** (Google Fonts):

- **Display — `Anton`**: sans pesada e condensada. Títulos, números gigantes (placar em destaque, posição no ranking), hero. Captura o peso do wordmark de pôster sem ser a fonte oficial.
- **UI/Texto — `Hanken Grotesk`**: grotesk com mais personalidade que o Inter (e o guia de frontend pede pra fugir do Inter), mas igualmente legível em tabela/formulário. Pesos 400–800.

```html
<!-- no <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

### Escala
| Nível | Tamanho | Fonte | Peso |
|---|---|---|---|
| Display XL (hero / placar gigante) | 64px / `4rem` | Anton | — |
| Display L | 40px / `2.5rem` | Anton | — |
| H1 | 32px / `2rem` | Hanken Grotesk | 700 |
| H2 | 24px / `1.5rem` | Hanken Grotesk | 700 |
| H3 | 20px / `1.25rem` | Hanken Grotesk | 600 |
| Corpo | 16px / `1rem` | Hanken Grotesk | 400 |
| Pequeno | 14px / `0.875rem` | Hanken Grotesk | 500 |
| Caption | 12px / `0.75rem` | Hanken Grotesk | 600 |

**Números em tabela** (pontos, placares na lista): Hanken Grotesk com `font-variant-numeric: tabular-nums` pra alinhar as colunas.

---

## 4. Forma, raio e sombra

A Copa usa muito o **retângulo arredondado** (o "26" dentro de uma forma rounded). Adotamos raios generosos.

| Token | Valor | Uso |
|---|---|---|
| `radius-sm` | 8px | Inputs pequenos, tags |
| `radius-md` | 12px | Botões, inputs de placar |
| `radius-lg` | 16px | Cards de jogo |
| `radius-xl` | 24px | Hero, painéis |
| `radius-pill` | 999px | Badges, chips |

**Sombras:**
- `shadow-soft`: `0 2px 8px rgba(22,22,24,.08)` — cards normais.
- `shadow-hard`: `4px 4px 0 #161618` — efeito "sticker/pôster" em botões-CTA e badges. **É a assinatura retrô do projeto.** Usar com moderação (não em tudo).

---

## 5. Motivo decorativo — raios concêntricos

A "explosão" das imagens da Copa, em versão CSS própria. Só em **hero, header de seção, empty state e banner de campeão**.

```css
.sunburst {
  background:
    repeating-conic-gradient(
      from 0deg,
      var(--vermelho) 0deg 15deg,
      var(--laranja)  15deg 30deg,
      var(--amarelo)  30deg 45deg,
      var(--verde)    45deg 60deg
    );
  /* suavizar pra não brigar com texto por cima: */
  opacity: .9;
}
/* texto sempre dentro de um bloco sólido (ink/cloud) por cima do sunburst */
```

Regra de ouro: se tiver texto importante, ele fica num **bloco sólido** sobreposto — nunca direto no padrão.

---

## 6. Componentes

### Botão
- **Primário:** `bg-relva` · texto `#fff` · `radius-md` · Inter 600 · padding `12px 20px`. Hover: `bg-relva-dark` + `translateY(-1px)`. CTA de destaque pode levar `shadow-hard`.
- **Secundário:** fundo `cloud` · borda 2px `ink` · texto `ink`.
- **Fantasma:** sem fundo/borda · texto `relva`.
- **Desabilitado:** `bg-line` · texto `slate` · sem sombra · `cursor-not-allowed`.

### Card de jogo (o componente mais usado)
```
┌──────────────────────────────────────┐
│ [badge GRUPO C]            13/06 13h   │  ← fase/grupo + data-hora (Brasília)
│                                        │
│  🇧🇷 Brasil   [ 2 ] × [ 1 ]  Marrocos 🇲🇦 │  ← inputs de placar (abertos)
│                                        │
│  [ Salvar palpite ]      ⏱ fecha 12:30 │
└──────────────────────────────────────┘
```
- `bg-cloud` · `radius-lg` · borda `line` · `shadow-soft`.
- **Estado aberto:** inputs editáveis, botão "Salvar palpite".
- **Estado travado/encerrado:** inputs `disabled`, mostra **placar real** + seu palpite, e um chip de pontos (cor semântica). Ex.: `+5 cravou` em verde.

### Input de placar
- Quadrado/retangular grande: 56×56px · `radius-md` · borda `line` · número centralizado · Anton ou Inter 700 · `tabular-nums` · `inputmode="numeric"`. Foco: borda `relva`.

### Badge de grupo
- Pill pequena · letra A–L · `bg` = cor rotativa do grupo · texto branco (ou `ink` no amarelo) · Inter 700.

### Linha de ranking
```
[1]  🟡 Lucca        128 pts   · 9 cravadas
[2]  ⚪ Amigo X       115 pts   · 7 cravadas
[3]  🟤 Amigo Y       110 pts   · 6 cravadas
```
- Posição em Anton grande.
- **1º lugar:** borda esquerda `ouro` 4px + fundo `ouro` 8% + chip dourado. Top 3 com medalha (🥇🥈🥉) opcional.
- Pontos em Inter 700 `tabular-nums`.

### Header / navegação
- Barra `ink` (ou `paper` com borda inferior `line`). Logo à esquerda (ver §9). Abas: **Jogos · Meus palpites · Ranking · [Admin]**. Aba ativa sublinhada em `relva`.

### Chip de pontuação
- Pill colorida por faixa (5/3/1/0) com número + label curto. Sempre com texto, nunca só cor (acessibilidade).

---

## 7. Layout & espaçamento

- **Escala (4px base):** 4, 8, 12, 16, 24, 32, 48, 64.
- **Container:** máx. `720px` no mobile-up pra lista de jogos (coluna única, scan vertical). Ranking pode ir a `880px`.
- **Grid de jogos:** 1 coluna no mobile; 2 colunas ≥ 768px.
- **Respiro:** seção respira com `padding-y: 32–48px`.

---

## 8. Modo escuro (opcional — v2)

A vibe retrô-pop brilha no escuro. Quando for fazer o toggle:
- `paper → #161618`, `cloud → #1F1F23`, `ink (texto) → #FAF6EE`, `line → #2C2C32`.
- Acentos e `relva` ficam iguais (já pop am no escuro). Ouro mantém.

---

## 9. Logo do nosso bolão (direção original)

**Não usar o emblema do "26"+taça da FIFA.** Direção sugerida (escolhe uma quando bater o nome do bolão):

- **Wordmark:** nome em **Anton**, caixa alta, bem apertado. Ex.: `BOLÃO 26`, `[NOME] CUP`.
- **Símbolo (opcional):** um círculo com um mini-sunburst dentro, ou uma bola estilizada com gomos geométricos (quadrado + quarto de círculo) — referência à geometria sem copiar o emblema.
- Cor: wordmark em `ink` sobre `paper`, ou branco sobre bloco `relva`/sunburst.

Isso te dá personalidade própria e zera qualquer risco de marca.

---

## 10. Acessibilidade (não pular)

- **Contraste:** texto sobre `amarelo`/`ciano` deve ser `ink`, nunca branco. Texto branco só sobre `relva`, `vermelho`, `roxo`, `azul`, `magenta`, `ink`.
- **Nunca só cor:** faixa de pontos sempre mostra número + label.
- **Toque ≥ 44px** em botões e inputs (mobile).
- **Foco visível** em todos os interativos (anel `relva`).

---

## 11. Tailwind — config pronta

```js
// tailwind.config.js  → theme.extend
export default {
  theme: {
    extend: {
      colors: {
        ink: '#161618',
        paper: '#FAF6EE',
        cloud: '#FFFFFF',
        slate: '#6E6A66',
        line: '#E7E1D6',
        verde: { DEFAULT: '#00A859', dark: '#00824A' },
        teal: '#2BD9B0',
        amarelo: '#FFD23F',
        laranja: '#FF7A00',
        vermelho: '#E63329',
        vinho: '#8B1E2D',
        roxo: '#7B2FBE',
        azul: '#2D5BFF',
        ouro: { DEFAULT: '#C28A1E', text: '#5C3F08' },
      },
      fontFamily: {
        display: ['Anton', 'sans-serif'],
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px', md: '12px', lg: '16px', xl: '24px', pill: '999px',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(22,22,24,.08)',
        hard: '4px 4px 0 #161618',
      },
    },
  },
}
```

```js
// array de cor por grupo (A–L) — usar nos badges
export const corDoGrupo = (letra) => {
  const cores = ['teal','verde','amarelo','laranja','vermelho','vinho','roxo','azul'];
  const i = letra.toUpperCase().charCodeAt(0) - 65; // A=0
  return cores[i % cores.length];
};
```
