"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OnboardingPage() {
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const weight = parseFloat(weightKg);
    if (!weight || weight <= 0 || weight > 300) {
      setError("正しい体重を入力してください");
      return;
    }

    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      weight_kg: weight,
      height_cm: heightCm ? parseFloat(heightCm) : null,
      display_name: user.user_metadata?.full_name || null,
    });

    if (insertError) {
      setError("プロフィールの保存に失敗しました。再試行してください。");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#f5f5f5]">プロフィール設定</h1>
          <p className="mt-2 text-[#a3a3a3] text-sm">
            フィードバックに必要な情報を教えてください
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="weight"
              className="block text-sm text-[#a3a3a3] mb-1"
            >
              体重 (kg) <span className="text-[#f97316]">*</span>
            </label>
            <input
              id="weight"
              type="number"
              step="0.1"
              min="30"
              max="300"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="70.0"
              className="w-full rounded-xl bg-[#1a1a1a] border border-[#262626] px-4 py-3 text-[#f5f5f5] placeholder-[#737373] focus:outline-none focus:border-[#3b82f6] min-h-[44px] tabular-nums"
              required
            />
          </div>

          <div>
            <label
              htmlFor="height"
              className="block text-sm text-[#a3a3a3] mb-1"
            >
              身長 (cm) <span className="text-[#737373]">任意</span>
            </label>
            <input
              id="height"
              type="number"
              step="0.1"
              min="100"
              max="250"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="170.0"
              className="w-full rounded-xl bg-[#1a1a1a] border border-[#262626] px-4 py-3 text-[#f5f5f5] placeholder-[#737373] focus:outline-none focus:border-[#3b82f6] min-h-[44px] tabular-nums"
            />
          </div>

          {error && (
            <p className="text-[#f97316] text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#22c55e] px-4 py-3 text-white font-semibold hover:bg-[#16a34a] transition-colors disabled:opacity-50 min-h-[44px]"
          >
            {loading ? "保存中..." : "始める"}
          </button>
        </form>
      </div>
    </div>
  );
}
