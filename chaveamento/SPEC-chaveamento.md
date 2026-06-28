# Chaveamento (Bracket) — Bolão Copa 2026

Especificação visual para desenvolvimento. **Referência de design, não de implementação.**
As bandeiras nas imagens são emoji — no dev, substituir por assets reais de bandeira.

## Imagens (pasta `images/`)
| Arquivo | Conteúdo |
|---|---|
| `01-desktop-arvore-completa.png` | Desktop — árvore completa (16-avos → Final), janela cobrindo todas as fases |
| `02-mobile-janela-estreita.png` | Mobile — janela estreita (1 rodada): cards grandes com rodapé de palpite |
| `03-mobile-janela-larga.png` | Mobile — janela larga (16-avos → Semis): siglas + bolinha de palpite |
| `04-seletor-estados.png` | Seletor de fases em 3 estados (padrão, expandido, alça em destaque) |
| `05-estados-card.png` | Estados do card: encerrado, ao vivo, agendado, a definir + card compacto |

---

## 1. Cores (hex)

### Base
| Uso | Hex |
|---|---|
| Fundo da tela | `#F4EEE1` |
| Barra superior / superfícies claras | `#FBF8F0` |
| Card | `#FFFFFF` |
| Borda do card | `#E7E0CE` |
| Linhas de conector da árvore | `#D5CEBE` |
| Caixa de placar (neutra) | `#ECE5D5` |
| Caixa de placar (vencedor) | bg `#E4F2E8` · texto `#1C8A48` |

### Texto
| Uso | Hex |
|---|---|
| Texto principal (quase-preto quente) | `#16140F` |
| Texto secundário | `#8C8475` |
| Placeholder / perdedor esmaecido | `#B7AE99` |
| Labels de seção (uppercase) | `#A89F8B` |

### Marca / ações
| Uso | Hex |
|---|---|
| Verde primário (botão, “Chaveamento” ativo) | `#1C8A48` |
| Verde escuro (sombra do botão / fase ativa) | `#15703A` |
| Pill de rodada / toggle ativo (fundo) | `#16140F` (texto `#FFFFFF`) |
| Trilha do toggle / seletor | `#EAE2D0` / `#FBF8F0` |

### Palpite (resultado) — borda, texto e fundo do chip
| Resultado | Pontos | Borda/Texto | Fundo do chip |
|---|---|---|---|
| Cravada | **5** | `#1C8A48` | `#E4F2E8` |
| Saldo + vencedor | **3** | `#C0852E` (texto `#9A6A1E`) | `#F7EDD9` |
| Só o vencedor | **1** | `#5B5648` | `#ECE7DA` |
| Errou | **0** | `#C0392B` (texto `#B23A2E`) | `#F8E5E2` |
| Ao vivo (parcial) | — | `#D8453B` | `#F8E5E2` |
| Aguardando (agendado) | — | `#8C8475` | `#EFEAD9` |

---

## 2. Tipografia

**Família:** Hanken Grotesk (fallback: sans-serif). Pesos usados: 400 / 700 / 800 / 900.

| Elemento | Tamanho | Peso |
|---|---|---|
| Título da tela (“Mata-mata” / “BOLÃO DA COPA”) | 20–21px | 900 |
| Label de seção / coluna (uppercase, ls ~1px) | 11px | 900 |
| Pill de rodada (uppercase, ls ~0.7px) | 10–11px | 800 |
| Status (data/hora · ENCERRADO · AO VIVO) | 11px | 800 |
| Nome do time — card grande | 12.5px | 700 (vencedor 800) |
| Placar — card grande | 26px | 800 |
| Sigla (3 letras) — card compacto | 12.5px | 700 (vencedor 800) |
| Placar — card compacto | 13px | 800 |
| Rodapé palpite — label | 11px | 700 |
| Rodapé palpite — valor (ex. “2–1”) | 13–14px | 800 |
| Chip de pontos / bolinha | 10–11px | 800–900 |
| Botão “atualizar palpite” | 14px | 800 |

Perdedor de jogo encerrado: nome e placar em `#B7AE99` com `opacity: 0.5`.

---

## 3. Espaçamentos, raios e dimensões

### Raios
- Card grande: **18px** · card compacto: **9px**
- Caixa de placar: **12px** · pills e chips: **999px**
- Trilha do seletor e janela: **14px** · alças: **9px**
- Toggle (container 12–13px / segmentos 9–10px)

### Card grande (modo expandido)
- Padding **15px**, gap interno vertical **12–13px**
- Caixa de placar **46 × 52px**
- Sombra: `0 2px 6px rgba(20,18,12,0.05)`
- Largura de coluna ~**286px** (desktop) · altura ~150px (slot vertical 168px, gap 12px)
- Rodapé de palpite separado por linha tracejada `1px dashed #E7E0CE`

### Card compacto (modo siglas)
- Padding **7–8px**, altura **~58px** (slot 66px, gap 16px)
- **Borda esquerda 4px** colorida (= indicador de palpite)
- Bolinha de pontos no canto superior direito (offset `top:-7px; right:-6px`)
- Largura = **fit-to-width**: `(largura_disponível − padding − gaps) / nº_rodadas`
  - Mobile: base de ~322px de área útil.

### Conectores
- Linhas ortogonais (cotovelo no meio) ligando cada jogo ao próximo; os dois jogos que alimentam o mesmo confronto são “abraçados” pela chave. Stroke `#D5CEBE`, 1.6px.

---

## 4. Seletor de fases (inspirado no Apple Sports)

**Trilha:** 5 fases, **sem Grupos** (a árvore é só mata-mata):
`16-avos · Oitavas · Quartas · Semis · Final`
Cada fase tem um ícone de “densidade” (nº de barrinhas decrescente: 5→1) + rótulo. No mobile os rótulos encurtam: `16av · 8av · 4tas · SF · F`.

**Janela (pílula destacada sobre a trilha):**
- Seleciona um **intervalo contíguo** de rodadas.
- **Alça esquerda (‹):** move o início. **Alça direita (›):** move o fim. **Corpo da pílula:** arrasta o intervalo inteiro.
- **Snap por fase:** a janela sempre trava em limites de rodada (nunca para “no meio”).
- **Atalho:** tocar numa fase foca nela (janela de 1 rodada).

**Padrão ao abrir:** **2 rodadas** = rodada ativa + a próxima (ex.: *16-avos → Oitavas*), centrada nos jogos mais próximos de hoje.

**Resultado:** a árvore embaixo mostra **exatamente** as rodadas selecionadas, ajustada à largura da tela.

---

## 5. Regra de adaptação (grande ⇄ siglas)

A densidade do card depende da **largura por coluna** resultante da janela:

- **Card grande (com rodapé de palpite):** quando a janela tem **≤ 2 rodadas** *e* a coluna fica com **≥ 250px**.
- **Card compacto (siglas de 3 letras + bandeira):** a partir de **3 rodadas selecionadas**, *ou* sempre que a coluna ficar **< 250px**.

Consequência prática por dispositivo:
- **Desktop:** o nome vira **sigla a partir de 3 rodadas**. Com 1–2 rodadas, cards grandes.
- **Mobile:** com 1 rodada → card grande (coluna ~294px). Com **2+ rodadas → já vira sigla** (não cabe o card grande em duas colunas). É o comportamento esperado — o palpite não some, **degrada** para o indicador compacto.

No modo compacto somem: data/hora, nomes completos e o rodapé de palpite. Fica só placar + quem avança + o indicador.

---

## 6. Indicador de palpite no card compacto

Quando não há espaço para o rodapé, o palpite é sinalizado por:

1. **Borda esquerda colorida (4px)** = resultado do palpite:
   - verde `#1C8A48` = cravada · âmbar `#C0852E` = saldo · grafite `#5B5648` = só vencedor · vermelho `#C0392B` = errou
   - vermelho `#D8453B` (pulsante) = ao vivo · neutro `#C6BDA9`/`#E3DCCB` = agendado / a definir
2. **Bolinha de pontos** no canto superior direito: `+5 / +3 / +1 / +0`, com fundo na cor do resultado.

---

## 7. Estados do card (ver `05-estados-card.png`)

| Estado | O que mostra |
|---|---|
| **Encerrado** | Placar final, vencedor destacado (verde), perdedor esmaecido; rodapé `Seu palpite 2–1` + chip `Cravada · +5`. |
| **Ao vivo** | Pill `● AO VIVO 67’` (vermelho pulsante), placar parcial; rodapé `Palpite parcial 2–1` + chip `Em jogo`. |
| **Agendado** | Times definidos, `30/06 · 18:00`, sem placar; rodapé `Seu palpite 2–0` + chip `Aguardando`. (Em rodada futura sem palpite: botão `atualizar palpite`.) |
| **A definir** | `A definir × A definir` — confronto ainda não preenchido pela árvore (caixas de placar vazias). |

---

## 8. Pontuação (regras do bolão)

| Acerto | Pontos |
|---|---|
| Cravar o placar exato | **5** |
| Acertar saldo de gols + vencedor | **3** |
| Acertar só o vencedor | **1** |
| Errar o resultado | **0** |

---

## 9. Notas de implementação (não-código)
- A Lista continua existindo; o **toggle Lista ⇄ Chaveamento** permanece no topo. O seletor de fases pertence só à visão Chaveamento.
- Todas as rodadas/jogos já vêm da tabela `matches`; nada muda no back-end.
- A árvore é single-direction (esquerda → direita): 16-avos (16) → Oitavas (8) → Quartas (4) → Semis (2) → Final (1), com a disputa de 3º lugar adjacente à Final.
