
CREATE TYPE public.activity_kind AS ENUM ('instant', 'timed');

CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Baby',
  color TEXT NOT NULL DEFAULT '#60a5fa',
  kind public.activity_kind NOT NULL DEFAULT 'instant',
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own activities" ON public.activities FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activities ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  values JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.logs TO authenticated;
GRANT ALL ON public.logs TO service_role;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own logs" ON public.logs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX logs_user_started_idx ON public.logs (user_id, started_at DESC);
CREATE INDEX logs_activity_idx ON public.logs (activity_id);

CREATE TABLE public.insight_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  activity_id UUID REFERENCES public.activities ON DELETE CASCADE,
  metric TEXT NOT NULL,
  field_key TEXT,
  timeframe_days INTEGER NOT NULL DEFAULT 14,
  chart_type TEXT NOT NULL DEFAULT 'bar',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insight_charts TO authenticated;
GRANT ALL ON public.insight_charts TO service_role;
ALTER TABLE public.insight_charts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own charts" ON public.insight_charts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
