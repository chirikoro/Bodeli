-- Add PFC balance goal (phase-based presets)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS goal_phase TEXT DEFAULT 'maintain'
    CHECK (goal_phase IN ('bulk', 'cut', 'maintain')),
  ADD COLUMN IF NOT EXISTS fat_target_pct INTEGER DEFAULT 25,
  ADD COLUMN IF NOT EXISTS carbs_target_pct INTEGER DEFAULT 50;
-- protein_target_per_kg already exists, protein % is derived from that
