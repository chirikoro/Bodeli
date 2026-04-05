"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { NavBar } from "@/components/nav-bar";
import { RestTimer } from "@/components/rest-timer";
import type { WorkoutSet } from "@/lib/types";

type SetInput = {
  id?: string;
  exercise_name: string;
  weight_kg: string;
  reps: string;
};

export default function EditWorkoutPage() {
  const { id } = useParams<{ id: string }>();
  const [templateName, setTemplateName] = useState("");
  const [sets, setSets] = useState<SetInput[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadSession() {
      const [sessionRes, setsRes] = await Promise.all([
        supabase.from("workout_sessions").select("*").eq("id", id).single(),
        supabase
          .from("workout_sets")
          .select("*")
          .eq("session_id", id)
          .order("set_order", { ascending: true }),
      ]);

      if (sessionRes.data) {
        setTemplateName(sessionRes.data.template_name ?? "カスタム");
      }
      if (setsRes.data) {
        setSets(
          (setsRes.data as WorkoutSet[]).map((s) => ({
            id: s.id,
            exercise_name: s.exercise_name,
            weight_kg: String(s.weight_kg),
            reps: String(s.reps),
          }))
        );
      }
    }
    loadSession();
  }, [supabase, id]);

  function updateSet(index: number, field: keyof SetInput, value: string) {
    const updated = [...sets];
    updated[index] = { ...updated[index], [field]: value };
    setSets(updated);
  }

  function addSet() {
    setSets([...sets, { exercise_name: "", weight_kg: "", reps: "" }]);
  }

  function removeSet(index: number) {
    setSets(sets.filter((_, i) => i !== index));
  }

  async function handleSave() {
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

    // Delete existing sets and re-insert
    await supabase.from("workout_sets").delete().eq("session_id", id);

    const setsToInsert = validSets.map((s, i) => ({
      session_id: id,
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
      setError("保存に失敗しました");
      setSaving(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (sets.length === 0) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <p className="text-[#737373] animate-pulse">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      <header className="px-4 pt-6 pb-2 flex items-center justify-between">
        <h1 className="text-lg font-bold text-[#f5f5f5]">
          {templateName}を編集
        </h1>
        <button
          onClick={() => router.back()}
          className="text-xs text-[#3b82f6] min-h-[44px] flex items-center"
        >
          キャンセル
        </button>
      </header>

      <main className="px-4 space-y-4">
        {sets.map((set, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={set.exercise_name}
              onChange={(e) => updateSet(idx, "exercise_name", e.target.value)}
              placeholder="種目名"
              className="flex-1 rounded-lg bg-[#262626] border border-[#333] px-3 py-2 text-sm text-[#f5f5f5] placeholder-[#737373] min-h-[44px]"
            />
            <input
              type="number"
              value={set.weight_kg}
              onChange={(e) => updateSet(idx, "weight_kg", e.target.value)}
              placeholder="kg"
              className="w-20 rounded-lg bg-[#262626] border border-[#333] px-3 py-2 text-sm text-[#f5f5f5] text-center tabular-nums min-h-[44px]"
            />
            <span className="text-[#737373] text-xs">×</span>
            <input
              type="number"
              value={set.reps}
              onChange={(e) => updateSet(idx, "reps", e.target.value)}
              placeholder="回"
              className="w-16 rounded-lg bg-[#262626] border border-[#333] px-3 py-2 text-sm text-[#f5f5f5] text-center tabular-nums min-h-[44px]"
            />
            <button
              onClick={() => removeSet(idx)}
              className="text-[#737373] hover:text-[#f97316] min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              ×
            </button>
          </div>
        ))}

        <button
          onClick={addSet}
          className="w-full rounded-xl border border-dashed border-[#262626] p-3 text-sm text-[#737373] hover:border-[#3b82f6] hover:text-[#3b82f6] transition-colors min-h-[44px]"
        >
          + セットを追加
        </button>

        {error && <p className="text-[#f97316] text-sm">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-xl bg-[#22c55e] px-4 py-3 text-white font-semibold hover:bg-[#16a34a] transition-colors disabled:opacity-50 min-h-[44px]"
        >
          {saving ? "保存中..." : "保存する"}
        </button>
      </main>

      <RestTimer />
      <NavBar />
    </div>
  );
}
