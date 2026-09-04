CREATE TABLE public.registry_cache (
  cache_key text PRIMARY KEY,
  payload jsonb NOT NULL,
  fetched_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.registry_cache TO service_role;

ALTER TABLE public.registry_cache ENABLE ROW LEVEL SECURITY;

CREATE INDEX registry_cache_fetched_at_idx ON public.registry_cache (fetched_at);