import type { FeedbackResult } from "./types";

export function calculateFeedback(
  weightKg: number,
  proteinTargetPerKg: number,
  totalProteinToday: number,
  totalVolumeKg: number,
  hasMeals: boolean,
  hasWorkout: boolean
): FeedbackResult {
  if (!hasMeals && !hasWorkout) {
    return { type: "neutral", message: "今日の記録を始めよう" };
  }

  if (hasWorkout && !hasMeals) {
    return {
      type: "reminder_meal",
      message:
        "トレーニングお疲れ様！食事を記録して、フィードバックを確認しよう",
    };
  }

  if (hasMeals && !hasWorkout) {
    return {
      type: "reminder_workout",
      message:
        "食事記録OK！トレーニングも記録すると、より正確なフィードバックが出るよ",
    };
  }

  const baseTarget = weightKg * proteinTargetPerKg;
  const volumeBonus = Math.floor(totalVolumeKg / 1000) * 5;
  const adjustedTarget = baseTarget + volumeBonus;
  const deficit = adjustedTarget - totalProteinToday;

  if (deficit <= 0) {
    return {
      type: "sufficient",
      message: "タンパク質OK！現時点で目標を達成しています",
      target_g: Math.round(adjustedTarget),
      current_g: Math.round(totalProteinToday),
    };
  }

  const chickenGrams = Math.round((deficit / 23.3) * 100);
  return {
    type: "deficit",
    message: `現時点であと鶏胸肉 約${chickenGrams}g分のタンパク質で達成`,
    deficit_g: Math.round(deficit),
    target_g: Math.round(adjustedTarget),
    current_g: Math.round(totalProteinToday),
  };
}
