
-- Rate limit counters
CREATE TABLE public.analysis_usage (
  user_id uuid NOT NULL,
  day date NOT NULL,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analysis_usage TO authenticated;
GRANT ALL ON public.analysis_usage TO service_role;
ALTER TABLE public.analysis_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own analysis usage" ON public.analysis_usage FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Cache key on competitor_analyses
ALTER TABLE public.competitor_analyses ADD COLUMN reviews_hash text;
CREATE INDEX competitor_analyses_hash_idx ON public.competitor_analyses(user_id, reviews_hash);
CREATE INDEX competitor_analyses_product_idx ON public.competitor_analyses(user_id, product_name, created_at DESC);

-- Value proposition generator
CREATE TABLE public.value_props (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  product text NOT NULL DEFAULT '',
  target text NOT NULL DEFAULT '',
  pains text NOT NULL DEFAULT '',
  differentiator text NOT NULL DEFAULT '',
  result jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.value_props TO authenticated;
GRANT ALL ON public.value_props TO service_role;
ALTER TABLE public.value_props ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own value props" ON public.value_props FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX value_props_user_idx ON public.value_props(user_id, created_at DESC);
