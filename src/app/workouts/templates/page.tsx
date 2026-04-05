"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { NavBar } from "@/components/nav-bar";
import type { WorkoutTemplate, TemplateExercise } from "@/lib/types";

type ExerciseInput = {
  name: string;
  default_sets: string;
  default_reps: string;
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [editing, setEditing] = useState<WorkoutTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [exercises, setExercises] = useState<ExerciseInput[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("workout_templates")
      .select("*")
      .or(`user_id.eq.${user.id},is_preset.eq.true`)
      .order("is_preset", { ascending: false })
      .order("name");

    if (data) setTemplates(data as WorkoutTemplate[]);
  }

  function startEdit(template: WorkoutTemplate) {
    setEditing(template);
    setCreating(false);
    setTemplateName(template.name);
    setExercises(
      template.exercises.map((ex) => ({
        name: ex.name,
        default_sets: String(ex.default_sets),
        default_reps: String(ex.default_reps),
      }))
    );
    setError("");
  }

  function startCopy(template: WorkoutTemplate) {
    setEditing(null);
    setCreating(true);
    setTemplateName(template.name + " (コピー)");
    setExercises(
      template.exercises.map((ex) => ({
        name: ex.name,
        default_sets: String(ex.default_sets),
        default_reps: String(ex.default_reps),
      }))
    );
    setError("");
  }

  function startCreate() {
    setEditing(null);
    setCreating(true);
    setTemplateName("");
    setExercises([{ name: "", default_sets: "3", default_reps: "10" }]);
    setError("");
  }

  function updateExercise(index: number, field: keyof ExerciseInput, value: string) {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  }

  function addExercise() {
    setExercises([...exercises, { name: "", default_sets: "3", default_reps: "10" }]);
  }

  function removeExercise(index: number) {
    setExercises(exercises.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!templateName.trim()) {
      setError("テンプレート名を入力してください");
      return;
    }
    const validExercises = exercises.filter((ex) => ex.name.trim());
    if (validExercises.length === 0) {
      setError("少なくとも1つの種目を追加してください");
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

    const exerciseData: TemplateExercise[] = validExercises.map((ex) => ({
      name: ex.name.trim(),
      default_sets: parseInt(ex.default_sets) || 3,
      default_reps: parseInt(ex.default_reps) || 10,
    }));

    if (editing && !editing.is_preset) {
      // Update existing custom template
      const { error: updateError } = await supabase
        .from("workout_templates")
        .update({
          name: templateName.trim(),
          exercises: exerciseData,
        })
        .eq("id", editing.id);

      if (updateError) {
        setError("保存に失敗しました");
        setSaving(false);
        return;
      }
    } else {
      // Create new template (or copy from preset)
      const { error: insertError } = await supabase
        .from("workout_templates")
        .insert({
          user_id: user.id,
          name: templateName.trim(),
          exercises: exerciseData,
          is_preset: false,
        });

      if (insertError) {
        setError("保存に失敗しました");
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setEditing(null);
    setCreating(false);
    await loadTemplates();
  }

  async function handleDelete(template: WorkoutTemplate) {
    if (template.is_preset) return;

    const { error: deleteError } = await supabase
      .from("workout_templates")
      .delete()
      .eq("id", template.id);

    if (!deleteError) {
      await loadTemplates();
    }
  }

  function cancelEdit() {
    setEditing(null);
    setCreating(false);
    setError("");
  }

  // Edit/Create form
  if (editing || creating) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] pb-20">
        <header className="px-4 pt-6 pb-2 flex items-center justify-between">
          <h1 className="text-lg font-bold text-[#f5f5f5]">
            {editing ? "テンプレートを編集" : "テンプレートを作成"}
          </h1>
          <button
            onClick={cancelEdit}
            className="text-xs text-[#3b82f6] min-h-[44px] flex items-center"
          >
            キャンセル
          </button>
        </header>

        <main className="px-4 space-y-4">
          <div>
            <label className="text-xs text-[#737373]">テンプレート名</label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="例: 胸の日"
              className="w-full mt-1 rounded-xl bg-[#1a1a1a] border border-[#262626] px-4 py-3 text-[#f5f5f5] placeholder-[#737373] min-h-[44px]"
            />
          </div>

          <div className="space-y-3">
            <p className="text-xs text-[#737373]">種目</p>
            {exercises.map((ex, idx) => (
              <div key={idx} className="rounded-xl bg-[#1a1a1a] border border-[#262626] p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ex.name}
                    onChange={(e) => updateExercise(idx, "name", e.target.value)}
                    placeholder="種目名"
                    className="flex-1 rounded-lg bg-[#262626] border border-[#333] px-3 py-2 text-sm text-[#f5f5f5] placeholder-[#737373] min-h-[44px]"
                  />
                  <button
                    onClick={() => removeExercise(idx)}
                    className="text-[#737373] hover:text-[#f97316] min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-[#737373]">セット数</label>
                    <input
                      type="number"
                      value={ex.default_sets}
                      onChange={(e) => updateExercise(idx, "default_sets", e.target.value)}
                      className="w-full mt-1 rounded-lg bg-[#262626] border border-[#333] px-3 py-2 text-sm text-[#f5f5f5] text-center tabular-nums min-h-[44px]"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-[#737373]">レップ数</label>
                    <input
                      type="number"
                      value={ex.default_reps}
                      onChange={(e) => updateExercise(idx, "default_reps", e.target.value)}
                      className="w-full mt-1 rounded-lg bg-[#262626] border border-[#333] px-3 py-2 text-sm text-[#f5f5f5] text-center tabular-nums min-h-[44px]"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addExercise}
              className="w-full rounded-xl border border-dashed border-[#262626] p-3 text-sm text-[#737373] hover:border-[#3b82f6] hover:text-[#3b82f6] transition-colors min-h-[44px]"
            >
              + 種目を追加
            </button>
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

  // Template list
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      <header className="px-4 pt-6 pb-2 flex items-center justify-between">
        <h1 className="text-lg font-bold text-[#f5f5f5]">テンプレート管理</h1>
        <button
          onClick={() => router.back()}
          className="text-xs text-[#3b82f6] min-h-[44px] flex items-center"
        >
          戻る
        </button>
      </header>

      <main className="px-4 space-y-4">
        <button
          onClick={startCreate}
          className="w-full rounded-xl bg-[#3b82f6] px-4 py-3 text-white font-medium hover:bg-[#2563eb] transition-colors min-h-[44px]"
        >
          新しいテンプレートを作成
        </button>

        {templates.map((template) => (
          <div
            key={template.id}
            className="rounded-xl bg-[#1a1a1a] border border-[#262626] p-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[#f5f5f5]">
                    {template.name}
                  </p>
                  {template.is_preset && (
                    <span className="text-[10px] bg-[#262626] text-[#737373] px-1.5 py-0.5 rounded">
                      プリセット
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#a3a3a3] mt-1">
                  {template.exercises.map((ex) => ex.name).join("、")}
                </p>
              </div>
              <div className="flex gap-1 ml-2 shrink-0">
                {template.is_preset ? (
                  <button
                    onClick={() => startCopy(template)}
                    className="text-xs text-[#3b82f6] min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    コピー
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(template)}
                      className="text-xs text-[#3b82f6] min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(template)}
                      className="text-xs text-[#737373] hover:text-[#ef4444] min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      削除
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </main>

      <NavBar />
    </div>
  );
}
