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
-- FASE DE GRUPOS — 72 jogos (12 grupos A–L), sincronizado da produção.
-- Ordem cronológica (data_hora). Sem id (a identity gera) e sem placar:
-- gols_casa/gols_fora entram ao vivo pelo admin. fase='grupos' → peso 1.
-- =====================================================================
insert into matches (time_casa, time_fora, fase, grupo, estadio, data_hora) values
  ('México', 'África do Sul', 'grupos', 'A', 'Cidade do México', '2026-06-11 16:00:00-03'::timestamptz),
  ('Coreia do Sul', 'República Tcheca', 'grupos', 'A', 'Guadalajara', '2026-06-11 23:00:00-03'::timestamptz),
  ('Canadá', 'Bósnia e Herzegovina', 'grupos', 'B', 'Toronto', '2026-06-12 16:00:00-03'::timestamptz),
  ('Estados Unidos', 'Paraguai', 'grupos', 'D', 'Los Angeles', '2026-06-12 22:00:00-03'::timestamptz),
  ('Austrália', 'Turquia', 'grupos', 'D', 'Vancouver', '2026-06-13 01:00:00-03'::timestamptz),
  ('Catar', 'Suíça', 'grupos', 'B', 'San Francisco', '2026-06-13 16:00:00-03'::timestamptz),
  ('Brasil', 'Marrocos', 'grupos', 'C', 'Nova York/Nova Jersey', '2026-06-13 19:00:00-03'::timestamptz),
  ('Haiti', 'Escócia', 'grupos', 'C', 'Boston', '2026-06-13 22:00:00-03'::timestamptz),
  ('Alemanha', 'Curaçao', 'grupos', 'E', 'Houston', '2026-06-14 14:00:00-03'::timestamptz),
  ('Holanda', 'Japão', 'grupos', 'F', 'Dallas', '2026-06-14 17:00:00-03'::timestamptz),
  ('Costa do Marfim', 'Equador', 'grupos', 'E', 'Filadélfia', '2026-06-14 20:00:00-03'::timestamptz),
  ('Suécia', 'Tunísia', 'grupos', 'F', 'Monterrey', '2026-06-14 23:00:00-03'::timestamptz),
  ('Espanha', 'Cabo Verde', 'grupos', 'H', 'Atlanta', '2026-06-15 13:00:00-03'::timestamptz),
  ('Bélgica', 'Egito', 'grupos', 'G', 'Seattle', '2026-06-15 16:00:00-03'::timestamptz),
  ('Arábia Saudita', 'Uruguai', 'grupos', 'H', 'Miami', '2026-06-15 19:00:00-03'::timestamptz),
  ('Irã', 'Nova Zelândia', 'grupos', 'G', 'Los Angeles', '2026-06-15 22:00:00-03'::timestamptz),
  ('Argentina', 'Argélia', 'grupos', 'J', 'Kansas City', '2026-06-16 14:00:00-03'::timestamptz),
  ('França', 'Senegal', 'grupos', 'I', 'Nova York/Nova Jersey', '2026-06-16 16:00:00-03'::timestamptz),
  ('Iraque', 'Noruega', 'grupos', 'I', 'Boston', '2026-06-16 19:00:00-03'::timestamptz),
  ('Áustria', 'Jordânia', 'grupos', 'J', 'San Francisco', '2026-06-17 01:00:00-03'::timestamptz),
  ('Portugal', 'RD Congo', 'grupos', 'K', 'Houston', '2026-06-17 14:00:00-03'::timestamptz),
  ('Inglaterra', 'Croácia', 'grupos', 'L', 'Dallas', '2026-06-17 17:00:00-03'::timestamptz),
  ('Gana', 'Panamá', 'grupos', 'L', 'Toronto', '2026-06-17 20:00:00-03'::timestamptz),
  ('Uzbequistão', 'Colômbia', 'grupos', 'K', 'Cidade do México', '2026-06-17 23:00:00-03'::timestamptz),
  ('República Tcheca', 'África do Sul', 'grupos', 'A', 'Atlanta', '2026-06-18 13:00:00-03'::timestamptz),
  ('Suíça', 'Bósnia e Herzegovina', 'grupos', 'B', 'Los Angeles', '2026-06-18 16:00:00-03'::timestamptz),
  ('Canadá', 'Catar', 'grupos', 'B', 'Vancouver', '2026-06-18 19:00:00-03'::timestamptz),
  ('México', 'Coreia do Sul', 'grupos', 'A', 'Guadalajara', '2026-06-18 22:00:00-03'::timestamptz),
  ('Turquia', 'Paraguai', 'grupos', 'D', 'San Francisco', '2026-06-19 01:00:00-03'::timestamptz),
  ('Estados Unidos', 'Austrália', 'grupos', 'D', 'Seattle', '2026-06-19 16:00:00-03'::timestamptz),
  ('Escócia', 'Marrocos', 'grupos', 'C', 'Boston', '2026-06-19 19:00:00-03'::timestamptz),
  ('Brasil', 'Haiti', 'grupos', 'C', 'Filadélfia', '2026-06-19 22:00:00-03'::timestamptz),
  ('Holanda', 'Suécia', 'grupos', 'F', 'Houston', '2026-06-20 14:00:00-03'::timestamptz),
  ('Alemanha', 'Costa do Marfim', 'grupos', 'E', 'Toronto', '2026-06-20 17:00:00-03'::timestamptz),
  ('Equador', 'Curaçao', 'grupos', 'E', 'Kansas City', '2026-06-20 21:00:00-03'::timestamptz),
  ('Tunísia', 'Japão', 'grupos', 'F', 'Monterrey', '2026-06-21 01:00:00-03'::timestamptz),
  ('Espanha', 'Arábia Saudita', 'grupos', 'H', 'Atlanta', '2026-06-21 13:00:00-03'::timestamptz),
  ('Bélgica', 'Irã', 'grupos', 'G', 'Los Angeles', '2026-06-21 16:00:00-03'::timestamptz),
  ('Uruguai', 'Cabo Verde', 'grupos', 'H', 'Miami', '2026-06-21 19:00:00-03'::timestamptz),
  ('Nova Zelândia', 'Egito', 'grupos', 'G', 'Vancouver', '2026-06-21 22:00:00-03'::timestamptz),
  ('Argentina', 'Áustria', 'grupos', 'J', 'Dallas', '2026-06-22 14:00:00-03'::timestamptz),
  ('França', 'Iraque', 'grupos', 'I', 'Filadélfia', '2026-06-22 18:00:00-03'::timestamptz),
  ('Noruega', 'Senegal', 'grupos', 'I', 'Nova York/Nova Jersey', '2026-06-22 21:00:00-03'::timestamptz),
  ('Jordânia', 'Argélia', 'grupos', 'J', 'San Francisco', '2026-06-23 00:00:00-03'::timestamptz),
  ('Portugal', 'Uzbequistão', 'grupos', 'K', 'Houston', '2026-06-23 14:00:00-03'::timestamptz),
  ('Inglaterra', 'Gana', 'grupos', 'L', 'Boston', '2026-06-23 17:00:00-03'::timestamptz),
  ('Panamá', 'Croácia', 'grupos', 'L', 'Toronto', '2026-06-23 20:00:00-03'::timestamptz),
  ('Colômbia', 'RD Congo', 'grupos', 'K', 'Guadalajara', '2026-06-23 23:00:00-03'::timestamptz),
  ('Suíça', 'Canadá', 'grupos', 'B', 'Vancouver', '2026-06-24 16:00:00-03'::timestamptz),
  ('Bósnia e Herzegovina', 'Catar', 'grupos', 'B', 'Seattle', '2026-06-24 16:00:00-03'::timestamptz),
  ('Escócia', 'Brasil', 'grupos', 'C', 'Miami', '2026-06-24 19:00:00-03'::timestamptz),
  ('Marrocos', 'Haiti', 'grupos', 'C', 'Atlanta', '2026-06-24 19:00:00-03'::timestamptz),
  ('República Tcheca', 'México', 'grupos', 'A', 'Cidade do México', '2026-06-24 22:00:00-03'::timestamptz),
  ('África do Sul', 'Coreia do Sul', 'grupos', 'A', 'Monterrey', '2026-06-24 22:00:00-03'::timestamptz),
  ('Equador', 'Alemanha', 'grupos', 'E', 'Nova York/Nova Jersey', '2026-06-25 17:00:00-03'::timestamptz),
  ('Curaçao', 'Costa do Marfim', 'grupos', 'E', 'Filadélfia', '2026-06-25 17:00:00-03'::timestamptz),
  ('Japão', 'Suécia', 'grupos', 'F', 'Dallas', '2026-06-25 20:00:00-03'::timestamptz),
  ('Tunísia', 'Holanda', 'grupos', 'F', 'Kansas City', '2026-06-25 20:00:00-03'::timestamptz),
  ('Turquia', 'Estados Unidos', 'grupos', 'D', 'Los Angeles', '2026-06-25 23:00:00-03'::timestamptz),
  ('Paraguai', 'Austrália', 'grupos', 'D', 'San Francisco', '2026-06-25 23:00:00-03'::timestamptz),
  ('Noruega', 'França', 'grupos', 'I', 'Boston', '2026-06-26 16:00:00-03'::timestamptz),
  ('Senegal', 'Iraque', 'grupos', 'I', 'Toronto', '2026-06-26 16:00:00-03'::timestamptz),
  ('Cabo Verde', 'Arábia Saudita', 'grupos', 'H', 'Houston', '2026-06-26 21:00:00-03'::timestamptz),
  ('Uruguai', 'Espanha', 'grupos', 'H', 'Guadalajara', '2026-06-26 21:00:00-03'::timestamptz),
  ('Egito', 'Irã', 'grupos', 'G', 'Seattle', '2026-06-27 00:00:00-03'::timestamptz),
  ('Nova Zelândia', 'Bélgica', 'grupos', 'G', 'Vancouver', '2026-06-27 00:00:00-03'::timestamptz),
  ('Panamá', 'Inglaterra', 'grupos', 'L', 'Nova York/Nova Jersey', '2026-06-27 18:00:00-03'::timestamptz),
  ('Croácia', 'Gana', 'grupos', 'L', 'Filadélfia', '2026-06-27 18:00:00-03'::timestamptz),
  ('Colômbia', 'Portugal', 'grupos', 'K', 'Miami', '2026-06-27 20:30:00-03'::timestamptz),
  ('RD Congo', 'Uzbequistão', 'grupos', 'K', 'Atlanta', '2026-06-27 20:30:00-03'::timestamptz),
  ('Argélia', 'Áustria', 'grupos', 'J', 'Kansas City', '2026-06-27 23:00:00-03'::timestamptz),
  ('Jordânia', 'Argentina', 'grupos', 'J', 'Dallas', '2026-06-27 23:00:00-03'::timestamptz);


-- =====================================================================
-- TEMPLATE — descomente, copie e ajuste pra cadastrar mais jogos.
-- Mantenha o horário em BRT com sufixo -03.
-- =====================================================================
--
-- -- Jogo de grupo (peso 1): grupo = letra A–L.
-- insert into matches (time_casa, time_fora, fase, grupo, estadio, data_hora) values
--   ('Time A', 'Time B', 'grupos', 'X',
--    'Nome do Estádio (Cidade)',
--    '2026-06-DD HH:MM:00-03'::timestamptz);
--
-- -- Mata-mata: grupo = null e ajuste a fase. Use a STRING EXATA — ela bate com o
-- -- CASE de peso em get_leaderboard(); fase fora da lista viola matches_fase_check.
-- insert into matches (time_casa, time_fora, fase, grupo, estadio, data_hora) values
--   ('Time A', 'Time B', '16avos',    null, '…', '2026-06-DD HH:MM:00-03'::timestamptz),  -- peso 2
--   ('Time A', 'Time B', 'oitavas',   null, '…', '2026-07-DD HH:MM:00-03'::timestamptz),  -- peso 3
--   ('Time A', 'Time B', 'quartas',   null, '…', '2026-07-DD HH:MM:00-03'::timestamptz),  -- peso 5
--   ('Time A', 'Time B', 'semis',     null, '…', '2026-07-DD HH:MM:00-03'::timestamptz),  -- peso 8
--   ('Time A', 'Time B', 'terceiro',  null, '…', '2026-07-DD HH:MM:00-03'::timestamptz),  -- peso 5 (disputa de 3º)
--   ('Time A', 'Time B', 'final',     null,    -- peso 13
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
