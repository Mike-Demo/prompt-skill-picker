DO $migration$
DECLARE definition text;
BEGIN
  SELECT pg_get_functiondef('public.check_rate_limit(text,text,jsonb)'::regprocedure) INTO definition;
  IF position('pg_advisory_xact_lock' in definition) = 0 THEN
    definition := replace(definition, E'begin\n', E'begin\n  perform pg_advisory_xact_lock(hashtextextended(_ip_hash, 0));\n');
    EXECUTE definition;
  END IF;
  SELECT pg_get_functiondef('public.record_captcha_failure(text)'::regprocedure) INTO definition;
  IF position('pg_advisory_xact_lock' in definition) = 0 THEN
    definition := replace(definition, E'begin\n', E'begin\n  perform pg_advisory_xact_lock(hashtextextended(_ip_hash, 0));\n');
    EXECUTE definition;
  END IF;
END
$migration$;
REVOKE ALL ON FUNCTION public.check_rate_limit(text,text,jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_captcha_failure(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text,text,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_captcha_failure(text) TO service_role;