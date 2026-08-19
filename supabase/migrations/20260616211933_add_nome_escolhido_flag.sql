ALTER TABLE public.profiles
  ADD COLUMN nome_escolhido boolean NOT NULL DEFAULT false;

-- usuários atuais já têm nome real (renomeados antes): marca como já escolhido
UPDATE public.profiles SET nome_escolhido = true;;
