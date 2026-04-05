"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { NavBar } from "@/components/nav-bar";
import type { Meal } from "@/lib/types";

export default function EditMealPage() {
  const { id } = useParams<{ id: string }>();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [description, setDescription] = useState("");
  const [calories, setCalories] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [fatG, setFatG] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadMeal() {
      const { data } = await supabase
        .from("meals")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        const m = data as Meal;
        setMeal(m);
        setDescription(m.description);
        setCalories(String(m.calories ?? 0));
        setProteinG(String(m.protein_g ?? 0));
        setFatG(String(m.fat_g ?? 0));
        setCarbsG(String(m.carbs_g ?? 0));
      }
    }
    loadMeal();
  }, [supabase, id]);

  async function handleSave() {
    if (!description.trim()) {
      setError("食事内容を入力してください");
      return;
    }
    setSaving(true);
    setError("");

    const { error: updateError } = await supabase
      .from("meals")
      .update({
        description: description.trim(),
        calories: parseFloat(calories) || 0,
        protein_g: parseFloat(proteinG) || 0,
        fat_g: parseFloat(fatG) || 0,
        carbs_g: parseFloat(carbsG) || 0,
      })
      .eq("id", id);

    if (updateError) {
      setError("保存に失敗しました");
      setSaving(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (!meal) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <p className="text-[#737373] animate-pulse">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      <header className="px-4 pt-6 pb-2 flex items-center justify-between">
        <h1 className="text-lg font-bold text-[#f5f5f5]">食事を編集</h1>
        <button
          onClick={() => router.back()}
          className="text-xs text-[#3b82f6] min-h-[44px] flex items-center"
        >
          キャンセル
        </button>
      </header>

      <main className="px-4 space-y-4">
        <div>
          <label className="text-xs text-[#737373]">食事内容</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full mt-1 rounded-xl bg-[#1a1a1a] border border-[#262626] px-4 py-3 text-[#f5f5f5] min-h-[44px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {([
            ["calories", "カロリー (kcal)", calories, setCalories],
            ["protein_g", "タンパク質 (g)", proteinG, setProteinG],
            ["fat_g", "脂質 (g)", fatG, setFatG],
            ["carbs_g", "炭水化物 (g)", carbsG, setCarbsG],
          ] as const).map(([key, label, value, setter]) => (
            <div key={key}>
              <label className="text-xs text-[#737373]">{label}</label>
              <input
                type="number"
                step="0.1"
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="w-full mt-1 rounded-lg bg-[#262626] border border-[#333] px-3 py-2 text-sm text-[#f5f5f5] tabular-nums min-h-[44px]"
              />
            </div>
          ))}
        </div>

        {error && <p className="text-[#f97316] text-sm">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-xl bg-[#22c55e] px-4 py-3 text-white font-semibold hover:bg-[#16a34a] transition-colors disabled:opacity-50 min-h-[44px]"
        >
          {saving ? "保存中..." : "保存する"}
        </button>
      </main>

      <NavBar />
    </div>
  );
}
