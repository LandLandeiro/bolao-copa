ALTER TABLE public.matches
  ALTER COLUMN fase SET NOT NULL;

ALTER TABLE public.matches
  ADD CONSTRAINT matches_fase_check
  CHECK (fase IN ('grupos','16avos','oitavas','quartas','semis','terceiro','final'));;
