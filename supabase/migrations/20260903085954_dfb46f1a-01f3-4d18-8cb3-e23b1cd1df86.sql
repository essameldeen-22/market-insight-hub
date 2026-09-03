CREATE TABLE public.daily_ai_usage (
  day date NOT NULL PRIMARY KEY,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.daily_ai_usage TO service_role;
ALTER TABLE public.daily_ai_usage ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.bump_daily_ai_usage(_day date)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_count integer;
BEGIN
  INSERT INTO public.daily_ai_usage (day, count, updated_at)
  VALUES (_day, 1, now())
  ON CONFLICT (day) DO UPDATE SET count = public.daily_ai_usage.count + 1, updated_at = now()
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$;
REVOKE ALL ON FUNCTION public.bump_daily_ai_usage(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bump_daily_ai_usage(date) TO service_role;