"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { NavBar } from "@/components/nav-bar";
import { ACTIVITY_LABELS, calculateTDEE } from "@/lib/tdee";
import type { Profile, ActivityLevel } from "@/lib/types";

const ACTIVITY_OPTIONS: ActivityLevel[] = [
  "sedentary", "light", "moderate", "active", "very_active",
];

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [age, setAge] = useState("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");
  const [proteinTarget, setProteinTarget] = useState("2.0");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        const p = data as Profile;
        setProfile(p);
        setWeightKg(String(p.weight_kg));
        setHeightCm(p.height_cm ? String(p.height_cm) : "");
        setAge(p.age ? String(p.age) : "");
        setActivityLevel(p.activity_level ?? "moderate");
        setProteinTarget(String(p.protein_target_per_kg));
      }
    }
    loadProfile();
  }, [supabase, router]);

  async function handleSave() {
    if (!profile) return;
    const weight = parseFloat(weightKg);
    if (!weight || weight <= 0) {
      setError("体重を正しく入力してください");
      return;
    }

    setSaving(true);
    setError("");
    setSaved(false);

    const updates: Record<string, number | string | null> = {
      weight_kg: weight,
      height_cm: heightCm ? parseFloat(heightCm) : null,
      age: age ? parseInt(age) : null,
      activity_level: activityLevel,
      protein_target_per_kg: parseFloat(proteinTarget) || 2.0,
    };

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", profile.id);

    if (updateError) {
      setError("保存に失敗しました");
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <p className="text-[#737373] animate-pulse">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      <header className="px-4 pt-6 pb-2">
        <h1 className="text-lg font-bold text-[#f5f5f5]">設定</h1>
      </header>

      <main className="px-4 space-y-6">
        {/* Profile section */}
        <section className="rounded-xl bg-[#1a1a1a] border border-[#262626] p-4 space-y-4">
          <h2 className="text-sm font-semibold text-[#a3a3a3]">プロフィール</h2>

          <div>
            <label className="text-xs text-[#737373]">��重 (kg)</label>
            <input
              type="number"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-full mt-1 rounded-lg bg-[#262626] border border-[#333] px-3 py-2 text-sm text-[#f5f5f5] tabular-nums min-h-[44px]"
            />
          </div>

          <div>
            <label className="text-xs text-[#737373]">身長 (cm)</label>
            <input
              type="number"
              step="0.1"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="任意"
              className="w-full mt-1 rounded-lg bg-[#262626] border border-[#333] px-3 py-2 text-sm text-[#f5f5f5] placeholder-[#737373] tabular-nums min-h-[44px]"
            />
          </div>

          <div>
            <label className="text-xs text-[#737373]">年齢</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="任意"
              className="w-full mt-1 rounded-lg bg-[#262626] border border-[#333] px-3 py-2 text-sm text-[#f5f5f5] placeholder-[#737373] tabular-nums min-h-[44px]"
            />
          </div>

          <div>
            <label className="text-xs text-[#737373] mb-2 block">生活強度</label>
            <div className="space-y-1">
              {ACTIVITY_OPTIONS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setActivityLevel(level)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-xs transition-colors min-h-[44px] ${
                    activityLevel === level
                      ? "bg-[#22c55e] text-white"
                      : "bg-[#262626] border border-[#333] text-[#a3a3a3]"
                  }`}
                >
                  {ACTIVITY_LABELS[level]}
                </button>
              ))}
            </div>
            <p className="text-xs text-[#737373] mt-2">
              推定消費カロリー: {calculateTDEE(
                parseFloat(weightKg) || 70,
                heightCm ? parseFloat(heightCm) : null,
                age ? parseInt(age) : null,
                activityLevel
              ).toLocaleString()} kcal/日
            </p>
          </div>

          <div>
            <label className="text-xs text-[#737373]">
              タンパク質目標 (g/kg体重)
            </label>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.1"
              value={proteinTarget}
              onChange={(e) => setProteinTarget(e.target.value)}
              className="w-full mt-2 accent-[#22c55e]"
            />
            <div className="flex justify-between text-xs text-[#737373] mt-1">
              <span>1.0</span>
              <span className="text-[#22c55e] font-semibold tabular-nums">
                {proteinTarget} g/kg
              </span>
              <span>3.0</span>
            </div>
            <p className="text-xs text-[#737373] mt-1">
              目標: {Math.round(parseFloat(weightKg || "0") * parseFloat(proteinTarget))}g/日
            </p>
          </div>
        </section>

        {error && <p className="text-[#f97316] text-sm">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-xl bg-[#22c55e] px-4 py-3 text-white font-semibold hover:bg-[#16a34a] transition-colors disabled:opacity-50 min-h-[44px]"
        >
          {saving ? "保存中..." : saved ? "保存しました ✓" : "保存する"}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full rounded-xl bg-[#262626] px-4 py-3 text-[#a3a3a3] font-medium hover:bg-[#333] transition-colors min-h-[44px]"
        >
          ログアウト
        </button>
      </main>

      <NavBar />
    </div>
  );
}
