import { describe, it, expect } from "vitest";

// Test the validation logic that lives in the API route
// We extract the validation rules and test them independently

function validateDescription(description: unknown): string | null {
  if (!description || typeof description !== "string") {
    return "食事内容を入力してください";
  }
  const trimmed = description.trim();
  if (trimmed.length === 0 || trimmed.length > 500) {
    return "入力は1〜500文字で入力してください";
  }
  return null;
}

function validateNutritionEstimate(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.calories === "number" &&
    typeof d.protein_g === "number" &&
    typeof d.fat_g === "number" &&
    typeof d.carbs_g === "number"
  );
}

describe("Nutrition API validation", () => {
  describe("validateDescription", () => {
    it("rejects empty string", () => {
      expect(validateDescription("")).not.toBeNull();
    });

    it("rejects whitespace-only string", () => {
      expect(validateDescription("   ")).not.toBeNull();
    });

    it("rejects null/undefined", () => {
      expect(validateDescription(null)).not.toBeNull();
      expect(validateDescription(undefined)).not.toBeNull();
    });

    it("rejects non-string", () => {
      expect(validateDescription(123)).not.toBeNull();
    });

    it("rejects string over 500 chars", () => {
      expect(validateDescription("a".repeat(501))).not.toBeNull();
    });

    it("accepts valid food description", () => {
      expect(validateDescription("鶏胸肉200g、ご飯1杯")).toBeNull();
    });

    it("accepts single character", () => {
      expect(validateDescription("卵")).toBeNull();
    });

    it("accepts exactly 500 chars", () => {
      expect(validateDescription("a".repeat(500))).toBeNull();
    });
  });

  describe("validateNutritionEstimate", () => {
    it("accepts valid estimate", () => {
      expect(
        validateNutritionEstimate({
          calories: 535,
          protein_g: 52,
          fat_g: 3,
          carbs_g: 75,
        })
      ).toBe(true);
    });

    it("rejects missing fields", () => {
      expect(validateNutritionEstimate({ calories: 535 })).toBe(false);
    });

    it("rejects string values", () => {
      expect(
        validateNutritionEstimate({
          calories: "535",
          protein_g: 52,
          fat_g: 3,
          carbs_g: 75,
        })
      ).toBe(false);
    });

    it("rejects null", () => {
      expect(validateNutritionEstimate(null)).toBe(false);
    });

    it("accepts zero values", () => {
      expect(
        validateNutritionEstimate({
          calories: 0,
          protein_g: 0,
          fat_g: 0,
          carbs_g: 0,
        })
      ).toBe(true);
    });
  });
});
