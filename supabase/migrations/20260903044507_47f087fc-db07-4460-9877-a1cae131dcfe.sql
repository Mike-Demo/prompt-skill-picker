-- Collapses the per-request rate-limit work (block lookup, window counts,
-- attempt record, retention trim) into one round trip.
create or replace function public.check_rate_limit(
  _ip_hash text,
  _action text,
  _windows jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_blocked_until timestamptz;
  v_window jsonb;
  v_used int;
  v_retry int;
  v_captcha_failures int;
  v_limit_rejections int;
  v_reason text;
begin
  select blocked_until into v_blocked_until from public.ip_blocks where ip_hash = _ip_hash;
  if v_blocked_until is not null and v_blocked_until > now() then
    return jsonb_build_object(
      'allowed', false, 'blocked', true,
      'retry_after_seconds', ceil(extract(epoch from (v_blocked_until - now())))::int
    );
  end if;

  for v_window in select value from jsonb_array_elements(_windows) loop
    select count(*) into v_used
      from public.rate_limit_events
     where ip_hash = _ip_hash
       and action = _action
       and outcome = 'allowed'
       and created_at >= now() - (((v_window->>'seconds')::int) * interval '1 second');

    if v_used >= (v_window->>'max')::int then
      insert into public.rate_limit_events (ip_hash, action, outcome)
      values (_ip_hash, _action, 'limited');

      select count(*) into v_captcha_failures
        from public.rate_limit_events
       where ip_hash = _ip_hash and outcome = 'captcha_failed'
         and created_at >= now() - interval '10 minutes';
      select count(*) into v_limit_rejections
        from public.rate_limit_events
       where ip_hash = _ip_hash and outcome = 'limited'
         and created_at >= now() - interval '10 minutes';

      v_reason := case
        when v_captcha_failures >= 5 then 'repeated captcha failures'
        when v_limit_rejections >= 20 then 'repeated rate limit breaches'
        else null
      end;

      if v_reason is not null then
        insert into public.ip_blocks (ip_hash, reason, blocked_until)
        values (_ip_hash, v_reason, now() + interval '1 hour')
        on conflict (ip_hash) do update
          set reason = excluded.reason, blocked_until = excluded.blocked_until;
        return jsonb_build_object('allowed', false, 'blocked', true, 'retry_after_seconds', 3600);
      end if;

      v_retry := case when (v_window->>'seconds')::int <= 60
                      then (v_window->>'seconds')::int else 3600 end;
      return jsonb_build_object('allowed', false, 'blocked', false, 'retry_after_seconds', v_retry);
    end if;
  end loop;

  insert into public.rate_limit_events (ip_hash, action, outcome)
  values (_ip_hash, _action, 'allowed');

  if exists (
    select 1 from public.rate_limit_events where created_at < now() - interval '24 hours' limit 1
  ) then
    delete from public.rate_limit_events where created_at < now() - interval '24 hours';
    delete from public.ip_blocks where blocked_until < now();
  end if;

  return jsonb_build_object('allowed', true, 'blocked', false, 'retry_after_seconds', 0);
end;
$$;

-- Records a captcha failure and blocks the caller once failures pile up.
create or replace function public.record_captcha_failure(_ip_hash text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_failures int;
begin
  insert into public.rate_limit_events (ip_hash, action, outcome)
  values (_ip_hash, 'search', 'captcha_failed');

  select count(*) into v_failures
    from public.rate_limit_events
   where ip_hash = _ip_hash and outcome = 'captcha_failed'
     and created_at >= now() - interval '10 minutes';

  if v_failures >= 5 then
    insert into public.ip_blocks (ip_hash, reason, blocked_until)
    values (_ip_hash, 'repeated captcha failures', now() + interval '1 hour')
    on conflict (ip_hash) do update
      set reason = excluded.reason, blocked_until = excluded.blocked_until;
  end if;
end;
$$;

revoke all on function public.check_rate_limit(text, text, jsonb) from public;
revoke all on function public.record_captcha_failure(text) from public;
grant execute on function public.check_rate_limit(text, text, jsonb) to service_role;
grant execute on function public.record_captcha_failure(text) to service_role;