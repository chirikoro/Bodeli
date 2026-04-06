import type { ActivityLevel } from "./types";

// Activity level multipliers (Harris-Benedict)
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,    // デスクワーク中心
  light: 1.375,      // 軽い運動（週1-3回）
  moderate: 1.55,    // 中程度の運動（週3-5回）
  active: 1.725,     // 激しい運動（週6-7回）
  very_active: 1.9,  // 非常に激しい運動（アスリート）
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "ほぼ運動しない",
  light: "軽い運動（週1-3回）",
  moderate: "中程度（週3-5回）",
  active: "激しい運動（週6-7回）",
  very_active: "アスリートレベル",
};

// Mifflin-St Jeor equation for BMR
export function calculateBMR(
  weightKg: number,
  heightCm: number | null,
  age: number | null,
  isMale = true // default assumption when gender unknown
): number {
  const h = heightCm ?? 170;
  const a = age ?? 30;
  if (isMale) {
    return 10 * weightKg + 6.25 * h - 5 * a + 5;
  }
  return 10 * weightKg + 6.25 * h - 5 * a - 161;
}

export function calculateTDEE(
  weightKg: number,
  heightCm: number | null,
  age: number | null,
  activityLevel: ActivityLevel
): number {
  const bmr = calculateBMR(weightKg, heightCm, age);
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

// 1RM calculation (Epley formula)
export function calculate1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}
