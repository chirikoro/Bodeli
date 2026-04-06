-- Add activity level and age to profiles for TDEE calculation
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS activity_level TEXT DEFAULT 'moderate'
    CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  ADD COLUMN IF NOT EXISTS age INTEGER;
