"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { TemplateSelector } from "./template-selector";
import type { WorkoutTemplate, TemplateExercise } from "@/lib/types";

type SetInput = {
  exercise_name: string;
  weight_kg: string;
  reps: string;
  isFromTemplate: boolean;
};

export function WorkoutForm() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null | undefined>(undefined);
  const [sets, setSets] = useState<SetInput[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadTemplates() {
      const { data } = await supabase
        .from("workout_templates")
        .select("*")
        .order("name");
      if (data) setTemplates(data as WorkoutTemplate[]);
    }
    loadTemplates();
  }, [supabase]);

  function handleSelectTemplate(template: WorkoutTemplate | null) {
    setSelectedTemplate(template);
    if (template) {
      const initialSets: SetInput[] = [];
      template.exercises.forEach((ex: TemplateExercise) => {
        for (let i = 0; i < ex.default_sets; i++) {
          initialSets.push({
            exercise_name: ex.name,
            weight_kg: "",
            reps: String(ex.default_reps),
            isFromTemplate: true,
          });
        }
      });
      setSets(initialSets);
    } else {
      setSets([{ exercise_name: "", weight_kg: "", reps: "", isFromTemplate: false }]);
    }
  }

  function addSet(exerciseName?: string, fromTemplate = false) {
    setSets([
      ...sets,
      {
        exercise_name: exerciseName || "",
        weight_kg: "",
        reps: "",
        isFromTemplate: fromTemplate,
      },
    ]);
  }

  function updateSet(index: number, field: keyof SetInput, value: string) {
    const updated = [...sets];
    updated[index] = { ...updated[index], [field]: value };
    setSets(updated);
  }

  function removeSet(index: number) {
    setSets(sets.filter((_, i) => i !== index));
  }

  async function handleSave() {
    // Filter out empty sets (途中保存OK = 完璧主義の罠回避)
    const validSets = sets.filter(
      (s) => s.exercise_name.trim() && s.weight_kg && s.reps
    );

    if (validSets.length === 0) {
      setError("少なくとも1セット入力してください");
      return;
    }

    setSaving(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from("workout_sessions")
      .insert({
        user_id: user.id,
        date: new Date().toISOString().split("T")[0],
        template_name: selectedTemplate?.name || null,
      })
      .select()
      .single();

    if (sessionError || !session) {
      setError("保存に失敗しました。再試行してください");
      setSaving(false);
      return;
    }

    // Insert sets
    const setsToInsert = validSets.map((s, i) => ({
      session_id: session.id,
      user_id: user.id,
      exercise_name: s.exercise_name.trim(),
      weight_kg: parseFloat(s.weight_kg),
      reps: parseInt(s.reps),
      set_order: i + 1,
    }));

    const { error: setsError } = await supabase
      .from("workout_sets")
      .insert(setsToInsert);

    if (setsError) {
      setError("セットの保存に失敗しました");
      setSaving(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  // Group sets by exercise for display
  // Use stable group keys to avoid re-mounting inputs on name change
  const exercises: { key: string; name: string; indices: number[] }[] = [];
  for (let i = 0; i < sets.length; i++) {
    const s = sets[i];
    const displayName = s.exercise_name || `種目${i + 1}`;
    // Template sets group by exercise_name; user-added sets each get their own group
    if (s.isFromTemplate) {
      const existing = exercises.find((g) => g.name === s.exercise_name && sets[g.indices[0]]?.isFromTemplate);
      if (existing) {
        existing.indices.push(i);
      } else {
        exercises.push({ key: `tmpl-${s.exercise_name}`, name: displayName, indices: [i] });
      }
    } else {
      // Each non-template set is its own group with a stable index-based key
      const lastGroup = exercises[exercises.length - 1];
      if (lastGroup && !sets[lastGroup.indices[0]]?.isFromTemplate && lastGroup.name === displayName) {
        lastGroup.indices.push(i);
      } else {
        exercises.push({ key: `custom-${i}`, name: displayName, indices: [i] });
      }
    }
  }

  // Template selection screen
  if (selectedTemplate === undefined) {
    return <TemplateSelector templates={templates} onSelect={handleSelectTemplate} />;
  }

  return (
    <div className="space-y-4">
      {/* Template name */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#f5f5f5]">
          {selectedTemplate?.name || "カスタムトレーニング"}
        </p>
        <button
          onClick={() => setSelectedTemplate(undefined)}
          className="text-xs text-[#3b82f6] min-h-[44px] flex items-center"
        >
          テンプレート変更
        </button>
      </div>

      {/* Sets grouped by exercise */}
      {exercises.map((group) => (
        <div key={group.key} className="rounded-xl bg-[#1a1a1a] border border-[#262626] p-3 space-y-2">
          {sets[group.indices[0]]?.isFromTemplate ? (
            <p className="text-sm font-medium text-[#f5f5f5]">{group.name}</p>
          ) : null}

          {group.indices.map((idx) => (
            <div key={idx} className="space-y-1">
              {!sets[idx].isFromTemplate && (
                <input
                  type="text"
                  value={sets[idx].exercise_name}
                  onChange={(e) => updateSet(idx, "exercise_name", e.target.value)}
                  placeholder="種目名"
                  className="w-full rounded-lg bg-[#262626] border border-[#333] px-3 py-2 text-sm text-[#f5f5f5] placeholder-[#737373] min-h-[44px]"
                />
              )}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={sets[idx].weight_kg}
                  onChange={(e) => updateSet(idx, "weight_kg", e.target.value)}
                  placeholder="kg"
                  className="flex-1 rounded-lg bg-[#262626] border border-[#333] px-3 py-2 text-sm text-[#f5f5f5] text-center tabular-nums min-h-[44px]"
                />
                <span className="text-[#737373] text-xs">×</span>
                <input
                  type="number"
                  value={sets[idx].reps}
                  onChange={(e) => updateSet(idx, "reps", e.target.value)}
                  placeholder="回"
                  className="flex-1 rounded-lg bg-[#262626] border border-[#333] px-3 py-2 text-sm text-[#f5f5f5] text-center tabular-nums min-h-[44px]"
                />
                <button
                  onClick={() => removeSet(idx)}
                  className="text-[#737373] hover:text-[#f97316] min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
                  aria-label="セットを削除"
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => addSet(
              sets[group.indices[0]]?.isFromTemplate ? group.name : "",
              sets[group.indices[0]]?.isFromTemplate ?? false
            )}
            className="text-xs text-[#3b82f6] hover:text-[#60a5fa] min-h-[44px] flex items-center"
          >
            + セットを追加
          </button>
        </div>
      ))}

      {/* Add new exercise (for custom mode or adding to template) */}
      <button
        onClick={() => addSet("")}
        className="w-full rounded-xl border border-dashed border-[#262626] p-3 text-sm text-[#737373] hover:border-[#3b82f6] hover:text-[#3b82f6] transition-colors min-h-[44px]"
      >
        + 種目を追加
      </button>

      {error && <p className="text-[#f97316] text-sm">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-xl bg-[#22c55e] px-4 py-3 text-white font-semibold hover:bg-[#16a34a] transition-colors disabled:opacity-50 min-h-[44px]"
      >
        {saving ? "保存中..." : "保存する"}
      </button>
    </div>
  );
}
