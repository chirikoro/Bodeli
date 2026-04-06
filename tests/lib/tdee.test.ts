import { describe, it, expect } from "vitest";
import { calculate1RM, calculateBMR, calculateTDEE } from "@/lib/tdee";

describe("calculate1RM (Epley formula)", () => {
  it("returns weight for 1 rep", () => {
    expect(calculate1RM(100, 1)).toBe(100);
  });

  it("calculates 1RM for multiple reps", () => {
    // 100kg x 5 reps = 100 * (1 + 5/30) = 116.7
    expect(calculate1RM(100, 5)).toBe(116.7);
  });

  it("returns 0 for invalid input", () => {
    expect(calculate1RM(0, 5)).toBe(0);
    expect(calculate1RM(100, 0)).toBe(0);
    expect(calculate1RM(-10, 5)).toBe(0);
  });

  it("higher reps increase 1RM estimate", () => {
    const rm5 = calculate1RM(80, 5);
    const rm10 = calculate1RM(80, 10);
    expect(rm10).toBeGreaterThan(rm5);
  });
});

describe("calculateBMR (Mifflin-St Jeor)", () => {
  it("calculates BMR for male defaults", () => {
    // 10*70 + 6.25*170 - 5*30 + 5 = 700 + 1062.5 - 150 + 5 = 1617.5
    const bmr = calculateBMR(70, 170, 30, true);
    expect(bmr).toBeCloseTo(1617.5, 0);
  });

  it("uses defaults when height/age are null", () => {
    const bmr = calculateBMR(70, null, null);
    expect(bmr).toBeGreaterThan(1000);
  });
});

describe("calculateTDEE", () => {
  it("moderate activity increases BMR by 1.55x", () => {
    const bmr = calculateBMR(70, 170, 30);
    const tdee = calculateTDEE(70, 170, 30, "moderate");
    expect(tdee).toBe(Math.round(bmr * 1.55));
  });

  it("sedentary < light < moderate < active < very_active", () => {
    const levels = ["sedentary", "light", "moderate", "active", "very_active"] as const;
    const tdees = levels.map((l) => calculateTDEE(70, 170, 30, l));
    for (let i = 1; i < tdees.length; i++) {
      expect(tdees[i]).toBeGreaterThan(tdees[i - 1]);
    }
  });
});
