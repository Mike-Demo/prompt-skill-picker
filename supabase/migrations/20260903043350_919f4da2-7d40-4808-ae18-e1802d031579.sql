CREATE TABLE public.rate_limit_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  action TEXT NOT NULL,
  outcome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX rate_limit_events_lookup_idx
  ON public.rate_limit_events (ip_hash, action, created_at DESC);
CREATE INDEX rate_limit_events_created_at_idx
  ON public.rate_limit_events (created_at);

GRANT ALL ON public.rate_limit_events TO service_role;
ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ip_blocks (
  ip_hash TEXT NOT NULL PRIMARY KEY,
  reason TEXT NOT NULL,
  blocked_until TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX ip_blocks_blocked_until_idx ON public.ip_blocks (blocked_until);

GRANT ALL ON public.ip_blocks TO service_role;
ALTER TABLE public.ip_blocks ENABLE ROW LEVEL SECURITY;