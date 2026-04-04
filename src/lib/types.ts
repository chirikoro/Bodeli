export type Profile = {
  id: string;
  display_name: string | null;
  weight_kg: number;
  height_cm: number | null;
  protein_target_per_kg: number;
  created_at: string;
  updated_at: string;
};

export type Meal = {
  id: string;
  user_id: string;
  recorded_at: string;
  date: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack" | null;
  description: string;
  calories: number | null;
  protein_g: number | null;
  fat_g: number | null;
  carbs_g: number | null;
  ai_estimated: boolean;
  user_confirmed: boolean;
  created_at: string;
};

export type WorkoutSession = {
  id: string;
  user_id: string;
  date: string;
  template_name: string | null;
  notes: string | null;
  created_at: string;
};

export type WorkoutSet = {
  id: string;
  session_id: string;
  user_id: string;
  exercise_name: string;
  weight_kg: number;
  reps: number;
  set_order: number;
  created_at: string;
};

export type TemplateExercise = {
  name: string;
  default_sets: number;
  default_reps: number;
};

export type WorkoutTemplate = {
  id: string;
  user_id: string | null;
  name: string;
  exercises: TemplateExercise[];
  is_preset: boolean;
  created_at: string;
};

export type NutritionEstimate = {
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
};

export type FeedbackType =
  | "sufficient"
  | "deficit"
  | "reminder_meal"
  | "reminder_workout"
  | "neutral";

export type FeedbackResult = {
  type: FeedbackType;
  message: string;
  deficit_g?: number;
  target_g?: number;
  current_g?: number;
};
