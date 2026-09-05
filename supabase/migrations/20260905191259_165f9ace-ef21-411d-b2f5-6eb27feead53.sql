CREATE OR REPLACE FUNCTION public.freeze_profile_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.plan IS DISTINCT FROM OLD.plan
     AND current_setting('request.jwt.claims', true) IS NOT NULL
     AND coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role', '') <> 'service_role' THEN
    NEW.plan := OLD.plan;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_freeze_plan ON public.profiles;
CREATE TRIGGER profiles_freeze_plan
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.freeze_profile_plan();