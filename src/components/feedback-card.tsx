"use client";

import type { FeedbackResult } from "@/lib/types";
import { useState } from "react";

const CONFIG = {
  sufficient: { bg: "bg-[#052e16]", border: "border-[#22c55e]/30", icon: "✓", accent: "text-[#22c55e]" },
  deficit: { bg: "bg-[#431407]", border: "border-[#f97316]/30", icon: "⚠", accent: "text-[#f97316]" },
  reminder_meal: { bg: "bg-[#172554]", border: "border-[#3b82f6]/30", icon: "🍽", accent: "text-[#3b82f6]" },
  reminder_workout: { bg: "bg-[#172554]", border: "border-[#3b82f6]/30", icon: "💪", accent: "text-[#3b82f6]" },
  neutral: { bg: "bg-[#1a1a1a]", border: "border-[#262626]", icon: "○", accent: "text-[#a3a3a3]" },
} as const;

export function FeedbackCard({ feedback }: { feedback: FeedbackResult }) {
  const [expanded, setExpanded] = useState(false);
  const config = CONFIG[feedback.type];

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className={`w-full rounded-xl ${config.bg} border ${config.border} p-4 text-left transition-all`}
    >
      <div className="flex items-start gap-3">
        <span className={`text-lg ${config.accent}`} role="img" aria-label={feedback.type}>
          {config.icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[#f5f5f5] text-sm font-medium leading-relaxed">
            {feedback.message}
          </p>

          {(feedback.type === "sufficient" || feedback.type === "deficit") && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#a3a3a3]">
                  現時点: {feedback.current_g}g
                </span>
                <span className="text-[#a3a3a3]">
                  目標: {feedback.target_g}g
                </span>
              </div>
              <div className="h-1 bg-[#262626] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    feedback.type === "sufficient"
                      ? "bg-[#22c55e]"
                      : "bg-[#f97316]"
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      ((feedback.current_g ?? 0) / (feedback.target_g ?? 1)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {expanded && feedback.target_g && (
            <div className="mt-3 pt-3 border-t border-[#262626] text-xs text-[#a3a3a3] space-y-1">
              <p>目標タンパク質: {feedback.target_g}g</p>
              <p>現時点の摂取量: {feedback.current_g}g</p>
              {feedback.deficit_g && (
                <p>不足分: {feedback.deficit_g}g</p>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
