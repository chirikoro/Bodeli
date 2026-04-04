-- Bodeli v1 Database Schema
-- Run this in Supabase SQL Editor

-- User profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  weight_kg DECIMAL(5,1) NOT NULL,
  height_cm DECIMAL(5,1),
  protein_target_per_kg DECIMAL(3,1) DEFAULT 2.0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Meals
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  description TEXT NOT NULL,
  calories DECIMAL(7,1),
  protein_g DECIMAL(6,1),
  fat_g DECIMAL(6,1),
  carbs_g DECIMAL(6,1),
  ai_estimated BOOLEAN DEFAULT true,
  user_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Workout sessions
CREATE TABLE public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  template_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Individual sets within a workout
CREATE TABLE public.workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  weight_kg DECIMAL(6,1) NOT NULL,
  reps INTEGER NOT NULL,
  set_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Workout templates (preset + user-customizable)
CREATE TABLE public.workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  exercises JSONB NOT NULL,
  is_preset BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can CRUD own profiles" ON public.profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can CRUD own meals" ON public.meals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own sessions" ON public.workout_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own sets" ON public.workout_sets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can read presets and own templates" ON public.workout_templates
  FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can CRUD own templates" ON public.workout_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON public.workout_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON public.workout_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_meals_user_date ON public.meals(user_id, date);
CREATE INDEX idx_sessions_user_date ON public.workout_sessions(user_id, date);
CREATE INDEX idx_sets_session ON public.workout_sets(session_id);
CREATE INDEX idx_templates_user ON public.workout_templates(user_id);

-- Seed preset workout templates
INSERT INTO public.workout_templates (name, exercises, is_preset) VALUES
  ('胸の日', '[{"name": "ベンチプレス", "default_sets": 3, "default_reps": 10}, {"name": "インクラインダンベルプレス", "default_sets": 3, "default_reps": 10}, {"name": "ケーブルフライ", "default_sets": 3, "default_reps": 12}]'::jsonb, true),
  ('背中の日', '[{"name": "デッドリフト", "default_sets": 3, "default_reps": 5}, {"name": "ラットプルダウン", "default_sets": 3, "default_reps": 10}, {"name": "シーテッドロウ", "default_sets": 3, "default_reps": 10}]'::jsonb, true),
  ('脚の日', '[{"name": "スクワット", "default_sets": 3, "default_reps": 8}, {"name": "レッグプレス", "default_sets": 3, "default_reps": 10}, {"name": "レッグカール", "default_sets": 3, "default_reps": 12}]'::jsonb, true),
  ('肩の日', '[{"name": "オーバーヘッドプレス", "default_sets": 3, "default_reps": 8}, {"name": "サイドレイズ", "default_sets": 3, "default_reps": 15}, {"name": "フェイスプル", "default_sets": 3, "default_reps": 15}]'::jsonb, true),
  ('腕の日', '[{"name": "バーベルカール", "default_sets": 3, "default_reps": 10}, {"name": "トライセプスプッシュダウン", "default_sets": 3, "default_reps": 10}, {"name": "ハンマーカール", "default_sets": 3, "default_reps": 12}]'::jsonb, true);
