
-- 1. Remove Nursing activity for all users (and its logs cascade via FK).
DELETE FROM public.activities WHERE name = 'Nursing';

-- 2. Update Feeding: expand the "type" field into "How fed" with bottle + nursing options,
--    and repaint with jungle moss.
UPDATE public.activities
SET
  color = '#7a9560',
  fields = '[
    {"key":"amount","label":"Amount","type":"number","unit":"oz"},
    {"key":"method","label":"How fed","type":"select","options":["Bottle - Formula","Bottle - Breastmilk","Nursing - Left","Nursing - Right","Nursing - Both"]},
    {"key":"notes","label":"Notes","type":"textarea"}
  ]'::jsonb
WHERE name = 'Feeding';

-- 3. Repaint the remaining standard activities with the jungle palette.
UPDATE public.activities SET color = '#4a6b3a' WHERE name = 'Sleep';
UPDATE public.activities SET color = '#b8863f' WHERE name = 'Diaper';
UPDATE public.activities SET color = '#9db08a' WHERE name = 'Pumping';
UPDATE public.activities SET color = '#c47b52' WHERE name = 'Tummy time';
UPDATE public.activities SET color = '#a55a3f' WHERE name = 'Medicine';
UPDATE public.activities SET color = '#6b4f3a' WHERE name = 'Growth';
