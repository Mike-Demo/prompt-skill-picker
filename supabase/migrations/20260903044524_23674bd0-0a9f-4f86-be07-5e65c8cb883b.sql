revoke all on function public.check_rate_limit(text, text, jsonb) from anon, authenticated;
revoke all on function public.record_captcha_failure(text) from anon, authenticated;
grant execute on function public.check_rate_limit(text, text, jsonb) to service_role;
grant execute on function public.record_captcha_failure(text) to service_role;