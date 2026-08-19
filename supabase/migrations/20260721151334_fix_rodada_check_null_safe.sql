-- Limpa qualquer lixo de teste que tenha escapado pelo furo
delete from public.matches where time_casa='X' and time_fora='Y';

-- A versão anterior sofria de lógica de 3 valores: (false OR NULL) = NULL => CHECK aceita.
-- CASE é NULL-safe: sempre retorna true/false explícito.
alter table public.matches drop constraint matches_rodada_coerente;
alter table public.matches add constraint matches_rodada_coerente check (
  case when fase = 'rodada'
       then rodada is not null and rodada between 20 and 38
       else rodada is null
  end
);;
