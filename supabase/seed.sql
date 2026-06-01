-- Seed do bolão da Copa do Mundo 2026.
--
-- ⚠️  Cadastre AQUI somente jogos com data, horário e local CONFIRMADOS.
--     A trava do palpite no servidor compara now() com matches.data_hora —
--     horário errado = trava abre/fecha na hora errada e enche o saco.
--
-- Fuso: todos os horários estão em America/Sao_Paulo (UTC-3, sem DST).
--       Postgres armazena como timestamptz; o sufixo "-03" deixa explícito.
--       O front (MatchCard) já formata via Intl em America/Sao_Paulo.

-- =====================================================================
-- JOGOS CONFIRMADOS (4 — abertura + 3 do Brasil na fase de grupos)
-- =====================================================================
insert into matches (time_casa, time_fora, fase, grupo, estadio, data_hora) values
  -- Abertura: anfitrião abre o torneio (convenção FIFA: Grupo A).
  ('México',  'África do Sul', 'Fase de grupos', 'A',
   'Estádio Azteca (Cidade do México)',
   '2026-06-11 16:00:00-03'::timestamptz),

  -- Brasil — Grupo C
  ('Brasil',  'Marrocos',      'Fase de grupos', 'C',
   'MetLife Stadium (Nova Jersey)',
   '2026-06-13 19:00:00-03'::timestamptz),

  ('Brasil',  'Haiti',         'Fase de grupos', 'C',
   'Lincoln Financial Field (Filadélfia)',
   '2026-06-19 22:00:00-03'::timestamptz),

  ('Escócia', 'Brasil',        'Fase de grupos', 'C',
   'Hard Rock Stadium (Miami)',
   '2026-06-24 19:00:00-03'::timestamptz);


-- =====================================================================
-- TEMPLATE — descomente, copie e ajuste pra cadastrar mais jogos.
-- Mantenha o horário em BRT com sufixo -03.
-- =====================================================================
--
-- insert into matches (time_casa, time_fora, fase, grupo, estadio, data_hora) values
--   ('Time A', 'Time B', 'Fase de grupos', 'X',
--    'Nome do Estádio (Cidade)',
--    '2026-06-DD HH:MM:00-03'::timestamptz);
--
-- -- Mata-mata: grupo = null e ajuste a fase.
-- insert into matches (time_casa, time_fora, fase, grupo, estadio, data_hora) values
--   ('Time A', 'Time B', 'Oitavas',   null, '…', '2026-06-DD HH:MM:00-03'::timestamptz),
--   ('Time A', 'Time B', 'Quartas',   null, '…', '2026-07-DD HH:MM:00-03'::timestamptz),
--   ('Time A', 'Time B', 'Semifinal', null, '…', '2026-07-DD HH:MM:00-03'::timestamptz),
--   ('Time A', 'Time B', 'Final',     null,
--    'MetLife Stadium (Nova Jersey)',
--    '2026-07-19 16:00:00-03'::timestamptz);


-- =====================================================================
-- GRUPOS DA COPA 2026 — 12 grupos (A–L), 4 seleções por grupo.
-- Preencha aqui como referência conforme cadastrar os jogos.
-- ---------------------------------------------------------------------
-- Grupo A: México, África do Sul, …, …       ← confirmado pelo jogo de abertura
-- Grupo B: …, …, …, …
-- Grupo C: Brasil, Escócia, Haiti, Marrocos   ← cadastrado acima
-- Grupo D: …, …, …, …
-- Grupo E: …, …, …, …
-- Grupo F: …, …, …, …
-- Grupo G: …, …, …, …
-- Grupo H: …, …, …, …
-- Grupo I: …, …, …, …
-- Grupo J: …, …, …, …
-- Grupo K: …, …, …, …
-- Grupo L: …, …, …, …
--
-- Lembrete: o helper corDoGrupo(letra) em src/lib/grupos.js cicla 8 cores
-- (teal → verde → amarelo → laranja → vermelho → vinho → roxo → azul).
-- Grupos I–L repetem teal/verde/amarelo/laranja.
