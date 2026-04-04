import { describe, it, expect } from "vitest";
import { calculateFeedback } from "@/lib/feedback";

describe("calculateFeedback", () => {
  // === Case: Neither meals nor workout ===
  it("returns neutral when no data recorded", () => {
    const result = calculateFeedback(70, 2.0, 0, 0, false, false);
    expect(result.type).toBe("neutral");
    expect(result.message).toContain("始めよう");
  });

  // === Case: Only workout recorded ===
  it("returns reminder_meal when only workout recorded", () => {
    const result = calculateFeedback(70, 2.0, 0, 2640, true, false);
    // Note: hasMeals=true means has_workout in the function signature order
    // Actually let me re-check the signature
    const result2 = calculateFeedback(70, 2.0, 0, 2640, false, true);
    expect(result2.type).toBe("reminder_meal");
    expect(result2.message).toContain("食事を記録");
  });

  // === Case: Only meals recorded ===
  it("returns reminder_workout when only meals recorded", () => {
    const result = calculateFeedback(70, 2.0, 100, 0, true, false);
    expect(result.type).toBe("reminder_workout");
    expect(result.message).toContain("トレーニングも記録");
  });

  // === Case: Both recorded, protein sufficient ===
  it("returns sufficient when protein target met", () => {
    // 70kg × 2.0 = 140g base + volume bonus
    // 2640kg volume → floor(2640/1000) × 5 = 10g bonus → target = 150g
    // 160g consumed → sufficient
    const result = calculateFeedback(70, 2.0, 160, 2640, true, true);
    expect(result.type).toBe("sufficient");
    expect(result.message).toContain("OK");
    expect(result.target_g).toBe(150);
    expect(result.current_g).toBe(160);
  });

  // === Case: Both recorded, protein deficit ===
  it("returns deficit with food equivalent when protein insufficient", () => {
    // target = 150g, consumed = 85g → deficit = 65g
    // chicken equivalent: round((65/23.3) * 100) = 279g
    const result = calculateFeedback(70, 2.0, 85, 2640, true, true);
    expect(result.type).toBe("deficit");
    expect(result.message).toContain("鶏胸肉");
    expect(result.message).toContain("達成");
    expect(result.deficit_g).toBe(65);
    expect(result.target_g).toBe(150);
    expect(result.current_g).toBe(85);
  });

  // === Edge: Exactly at target ===
  it("returns sufficient when exactly at target", () => {
    const result = calculateFeedback(70, 2.0, 150, 2640, true, true);
    expect(result.type).toBe("sufficient");
  });

  // === Edge: Zero training volume ===
  it("handles zero training volume (bodyweight exercises)", () => {
    // 70kg × 2.0 = 140g, no volume bonus
    const result = calculateFeedback(70, 2.0, 100, 0, true, true);
    expect(result.type).toBe("deficit");
    expect(result.target_g).toBe(140);
    expect(result.deficit_g).toBe(40);
  });

  // === Edge: Very high protein intake ===
  it("handles protein overshoot gracefully", () => {
    const result = calculateFeedback(70, 2.0, 300, 2640, true, true);
    expect(result.type).toBe("sufficient");
    expect(result.current_g).toBe(300);
  });

  // === Edge: Low body weight ===
  it("works with low body weight", () => {
    const result = calculateFeedback(45, 1.6, 50, 1000, true, true);
    // 45 × 1.6 = 72g + floor(1000/1000)*5 = 5g → target = 77g
    expect(result.target_g).toBe(77);
    expect(result.type).toBe("deficit");
  });

  // === Edge: High body weight ===
  it("works with high body weight", () => {
    const result = calculateFeedback(120, 2.2, 200, 5000, true, true);
    // 120 × 2.2 = 264g + floor(5000/1000)*5 = 25g → target = 289g
    expect(result.target_g).toBe(289);
    expect(result.type).toBe("deficit");
  });

  // === Edge: Very high volume ===
  it("handles very high training volume", () => {
    const result = calculateFeedback(70, 2.0, 200, 50000, true, true);
    // 140g + floor(50000/1000)*5 = 250g bonus → target = 390g
    expect(result.target_g).toBe(390);
  });

  // === "現時点で" framing check ===
  it("uses 現時点で framing in deficit message (not 未達成)", () => {
    const result = calculateFeedback(70, 2.0, 85, 2640, true, true);
    expect(result.message).toContain("現時点で");
    expect(result.message).not.toContain("未達成");
    expect(result.message).not.toContain("失敗");
  });
});
