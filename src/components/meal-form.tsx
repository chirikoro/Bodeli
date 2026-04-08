"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { SaveRecipeButton } from "@/components/save-recipe-button";
import type { NutritionEstimate, Meal, SavedRecipe } from "@/lib/types";

export function MealForm() {
  const [description, setDescription] = useState("");
  const [estimate, setEstimate] = useState<NutritionEstimate | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState<NutritionEstimate>({
    calories: 0,
    protein_g: 0,
    fat_g: 0,
    carbs_g: 0,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [recentMeals, setRecentMeals] = useState<Meal[]>([]);
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Load recent meals and saved recipes
  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [mealsRes, recipesRes] = await Promise.all([
        supabase
          .from("meals")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("saved_recipes")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (mealsRes.data) {
        const seen = new Set<string>();
        const unique = mealsRes.data.filter((m: Meal) => {
          if (seen.has(m.description)) return false;
          seen.add(m.description);
          return true;
        });
        setRecentMeals(unique);
      }

      if (recipesRes.data) {
        setRecipes(recipesRes.data as SavedRecipe[]);

        // Auto-fill from recipe query param
        const recipeId = searchParams.get("recipe");
        if (recipeId) {
          const recipe = (recipesRes.data as SavedRecipe[]).find((r) => r.id === recipeId);
          if (recipe) {
            handleRecipeEntry(recipe);
          }
        }
      }
    }
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleEstimate() {
    if (!description.trim()) return;
    setLoading(true);
    setError("");
    setEstimate(null);

    try {
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "推定に失敗しました");
        setLoading(false);
        return;
      }

      const data: NutritionEstimate = await res.json();
      setEstimate(data);
      setEditValues(data);
    } catch {
      setError("通信エラーが発生しました");
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");

    const values = editMode ? editValues : estimate;
    if (!values) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { error: insertError } = await supabase.from("meals").insert({
      user_id: user.id,
      date: new Date().toISOString().split("T")[0],
      description: description.trim(),
      calories: values.calories,
      protein_g: values.protein_g,
      fat_g: values.fat_g,
      carbs_g: values.carbs_g,
      ai_estimated: !editMode,
      user_confirmed: true,
    });

    if (insertError) {
      setError("保存に失敗しました。再試行してください");
      setSaving(false);
      return;
    }

    setSaved(true);
  }

  function handleQuickEntry(meal: Meal) {
    setDescription(meal.description);
    setEstimate({
      calories: meal.calories ?? 0,
      protein_g: meal.protein_g ?? 0,
      fat_g: meal.fat_g ?? 0,
      carbs_g: meal.carbs_g ?? 0,
    });
    setEditValues({
      calories: meal.calories ?? 0,
      protein_g: meal.protein_g ?? 0,
      fat_g: meal.fat_g ?? 0,
      carbs_g: meal.carbs_g ?? 0,
    });
  }

  function handleRecipeEntry(recipe: SavedRecipe) {
    setDescription(recipe.description);
    setEstimate({
      calories: recipe.calories ?? 0,
      protein_g: recipe.protein_g ?? 0,
      fat_g: recipe.fat_g ?? 0,
      carbs_g: recipe.carbs_g ?? 0,
    });
    setEditValues({
      calories: recipe.calories ?? 0,
      protein_g: recipe.protein_g ?? 0,
      fat_g: recipe.fat_g ?? 0,
      carbs_g: recipe.carbs_g ?? 0,
    });
  }

  return (
    <div className="space-y-4">
      {/* Saved recipes for quick entry */}
      {recipes.length > 0 && !estimate && (
        <div>
          <p className="text-xs text-[#737373] mb-2">保存レシピ</p>
          <div className="flex flex-wrap gap-2">
            {recipes.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => handleRecipeEntry(recipe)}
                className="rounded-lg bg-[#1a3a2a] border border-[#22c55e33] px-3 py-2 text-xs text-[#22c55e] hover:bg-[#1a4a2a] transition-colors text-left max-w-[200px] truncate"
              >
                {recipe.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent meals for quick re-entry */}
      {recentMeals.length > 0 && !estimate && (
        <div>
          <p className="text-xs text-[#737373] mb-2">最近の食事</p>
          <div className="flex flex-wrap gap-2">
            {recentMeals.map((meal) => (
              <button
                key={meal.id}
                onClick={() => handleQuickEntry(meal)}
                className="rounded-lg bg-[#262626] border border-[#333] px-3 py-2 text-xs text-[#a3a3a3] hover:bg-[#333] transition-colors text-left max-w-[200px] truncate"
              >
                {meal.description}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Text input */}
      <div>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) handleEstimate();
          }}
          placeholder="鶏胸肉200g、ご飯1杯"
          className="w-full rounded-xl bg-[#1a1a1a] border border-[#262626] px-4 py-3 text-[#f5f5f5] placeholder-[#737373] focus:outline-none focus:border-[#3b82f6] min-h-[44px]"
          disabled={loading}
        />
      </div>

      {!estimate && (
        <div className="space-y-2">
          <button
            onClick={handleEstimate}
            disabled={loading || !description.trim()}
            className="w-full rounded-xl bg-[#3b82f6] px-4 py-3 text-white font-medium hover:bg-[#2563eb] transition-colors disabled:opacity-50 min-h-[44px]"
          >
            {loading ? (
              <span className="animate-pulse">栄養素を推定中...</span>
            ) : (
              "AIで栄養素を推定"
            )}
          </button>
          <button
            onClick={() => {
              if (!description.trim()) {
                setError("食事内容を入力してください");
                return;
              }
              setEstimate({ calories: 0, protein_g: 0, fat_g: 0, carbs_g: 0 });
              setEditValues({ calories: 0, protein_g: 0, fat_g: 0, carbs_g: 0 });
              setEditMode(true);
            }}
            disabled={!description.trim()}
            className="w-full rounded-xl bg-[#262626] px-4 py-3 text-[#a3a3a3] font-medium hover:bg-[#333] transition-colors disabled:opacity-50 min-h-[44px]"
          >
            手動で入力
          </button>
        </div>
      )}

      {error && <p className="text-[#f97316] text-sm">{error}</p>}

      {/* Estimation result */}
      {estimate && (
        <div className="rounded-xl bg-[#1a1a1a] border border-[#262626] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#f5f5f5]">推定結果</p>
            <button
              onClick={() => setEditMode(!editMode)}
              className="text-xs text-[#3b82f6] hover:text-[#60a5fa] min-h-[44px] flex items-center"
            >
              {editMode ? "元に戻す" : "編集"}
            </button>
          </div>

          {editMode ? (
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["calories", "カロリー", "kcal"],
                  ["protein_g", "タンパク質", "g"],
                  ["fat_g", "脂質", "g"],
                  ["carbs_g", "炭水化物", "g"],
                ] as const
              ).map(([key, label, unit]) => (
                <div key={key}>
                  <label className="text-xs text-[#737373]">
                    {label} ({unit})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editValues[key]}
                    onChange={(e) =>
                      setEditValues({
                        ...editValues,
                        [key]: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full mt-1 rounded-lg bg-[#262626] border border-[#333] px-3 py-2 text-sm text-[#f5f5f5] tabular-nums min-h-[44px]"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-xs text-[#737373]">カロリー</p>
                <p className="text-lg font-semibold text-[#f5f5f5] tabular-nums">
                  {estimate.calories}
                </p>
                <p className="text-xs text-[#737373]">kcal</p>
              </div>
              <div>
                <p className="text-xs text-[#737373]">タンパク質</p>
                <p className="text-lg font-semibold text-[#22c55e] tabular-nums">
                  {estimate.protein_g}
                </p>
                <p className="text-xs text-[#737373]">g</p>
              </div>
              <div>
                <p className="text-xs text-[#737373]">脂質</p>
                <p className="text-lg font-semibold text-[#f5f5f5] tabular-nums">
                  {estimate.fat_g}
                </p>
                <p className="text-xs text-[#737373]">g</p>
              </div>
              <div>
                <p className="text-xs text-[#737373]">炭水化物</p>
                <p className="text-lg font-semibold text-[#f5f5f5] tabular-nums">
                  {estimate.carbs_g}
                </p>
                <p className="text-xs text-[#737373]">g</p>
              </div>
            </div>
          )}

          {saved ? (
            <div className="space-y-2">
              <p className="text-sm text-[#22c55e] text-center font-medium">
                ✓ 食事を記録しました
              </p>
              <SaveRecipeButton
                description={description}
                calories={editMode ? editValues.calories : (estimate?.calories ?? 0)}
                protein_g={editMode ? editValues.protein_g : (estimate?.protein_g ?? 0)}
                fat_g={editMode ? editValues.fat_g : (estimate?.fat_g ?? 0)}
                carbs_g={editMode ? editValues.carbs_g : (estimate?.carbs_g ?? 0)}
              />
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full rounded-xl bg-[#262626] px-4 py-3 text-[#a3a3a3] text-sm hover:bg-[#333] transition-colors min-h-[44px]"
              >
                ダッシュボードに戻る
              </button>
            </div>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-xl bg-[#22c55e] px-4 py-3 text-white font-semibold hover:bg-[#16a34a] transition-colors disabled:opacity-50 min-h-[44px]"
            >
              {saving ? "保存中..." : "保存する"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
