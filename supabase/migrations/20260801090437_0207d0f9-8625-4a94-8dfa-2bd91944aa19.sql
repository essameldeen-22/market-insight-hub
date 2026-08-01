
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_seen_onboarding boolean NOT NULL DEFAULT false;

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE TABLE public.saas_alternatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_tool text NOT NULL,
  to_tool text NOT NULL,
  save_pct numeric NOT NULL CHECK (save_pct > 0 AND save_pct <= 1),
  difficulty text NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
  category text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.saas_alternatives TO anon, authenticated;
GRANT ALL ON public.saas_alternatives TO service_role;
ALTER TABLE public.saas_alternatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read alternatives" ON public.saas_alternatives FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage alternatives" ON public.saas_alternatives FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.pending_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_tool text NOT NULL,
  to_tool text NOT NULL,
  save_pct numeric NOT NULL CHECK (save_pct > 0 AND save_pct <= 1),
  difficulty text NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
  category text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  review_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.pending_suggestions TO authenticated;
GRANT UPDATE, DELETE ON public.pending_suggestions TO authenticated;
GRANT ALL ON public.pending_suggestions TO service_role;
ALTER TABLE public.pending_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own suggestions" ON public.pending_suggestions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own suggestions" ON public.pending_suggestions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins read all suggestions" ON public.pending_suggestions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update suggestions" ON public.pending_suggestions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER update_saas_alternatives_updated_at BEFORE UPDATE ON public.saas_alternatives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pending_suggestions_updated_at BEFORE UPDATE ON public.pending_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
