-- Endurece palpite_aberto() com DUAS travas independentes. A regra de sempre
-- ("fecha no apito inicial") continua idêntica; o que muda são as duas bordas.
--
--   TRAVA 1 — jogo já pontuado: se QUALQUER um dos dois placares já foi lançado
--             (gols_casa OU gols_fora), o palpite está fechado, não importa a data.
--             Mata a classe inteira de "palpitar em jogo cujo placar já é público".
--             get_match_points() conta todo palpite de jogo com placar, então esta é
--             a trava que corresponde ao que de fato pontua.
--             Testar as DUAS colunas é de propósito: hoje elas andam sempre juntas
--             (140 e 140, 0 assimétricos), porque o admin grava as duas de uma vez
--             (AdminMatchCard.jsx) — mas nada no banco obriga isso. Checar só uma
--             seria uma aposta implícita no comportamento da UI.
--
--   TRAVA 2 — data irresolúvel: quando o jogo não tem data E a rodada inteira também
--             não tem, fecha em vez de cair em 'infinity' (que deixava aberto para
--             sempre). O coalesce passa a envolver a COMPARAÇÃO, não o timestamp:
--               antes:  coalesce(min(data_hora), 'infinity') > now()   => TRUE
--               agora:  coalesce(min(data_hora) > now(), false)        => FALSE
--
-- Ordem importa: a trava do placar é avaliada primeiro, então um jogo pontuado fecha
-- mesmo que a data esteja no futuro (data remarcada, placar lançado adiantado, etc.).
--
-- IMPACTO VERIFICADO por simulação (SELECT) contra os 154 jogos de produção,
-- 19/08/2026: 0 mudam de estado · 0 fecham · 0 abrem · 10 abertos antes e depois
-- (rodada 24) · nenhum NULL. Também conferido: 0 jogos com placar assimétrico,
-- 0 jogos abertos com placar, 0 jogos abertos com data no passado.

create or replace function public.palpite_aberto(p_match_id bigint)
returns boolean
language sql
stable
set search_path = public
as $$
  select case
    -- TRAVA 1: placar lançado => fechado, independente de data.
    when m.gols_casa is not null or m.gols_fora is not null then false
    -- Regra normal: fecha no apito inicial.
    when m.data_hora is not null then m.data_hora > now()
    -- Sem data própria: vale o primeiro jogo marcado da mesma rodada.
    -- TRAVA 2: se a rodada inteira também não tem data, fecha (era 'infinity').
    else coalesce(
           (select min(m2.data_hora) from public.matches m2
             where m2.torneio_id = m.torneio_id and m2.rodada = m.rodada) > now(),
           false)
  end
  from public.matches m
  where m.id = p_match_id;
$$;
