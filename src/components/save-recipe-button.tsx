"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

type Props = {
  description: string;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
};

export function SaveRecipeButton({ description, calories, protein_g, fat_g, carbs_g }: Props) {
  const [state, setState] = useState<"idle" | "input" | "saving" | "saved">("idle");
  const [name, setName] = useState(description);
  const [error, setError] = useState("");
  const supabase = createClient();

  async function handleSave() {
    if (!name.trim()) return;
    setState("saving");
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error: insertError } = await supabase.from("saved_recipes").insert({
      user_id: user.id,
      name: name.trim(),
      description,
      calories,
      protein_g,
      fat_g,
      carbs_g,
    });

    if (insertError) {
      setError("保存に失敗しました");
      setState("input");
      return;
    }

    setState("saved");
  }

  if (state === "saved") {
    return (
      <p className="text-xs text-[#22c55e] text-center py-2">
        ✓ レシピに保存しました
      </p>
    );
  }

  if (state === "idle") {
    return (
      <button
        onClick={() => setState("input")}
        className="w-full rounded-xl bg-[#262626] px-4 py-3 text-[#a3a3a3] text-sm hover:bg-[#333] transition-colors min-h-[44px]"
      >
        レシピとして保存
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !("saving" === state)) handleSave();
        }}
        placeholder="レシピ名"
        className="w-full rounded-lg bg-[#262626] border border-[#333] px-3 py-2 text-sm text-[#f5f5f5] placeholder-[#737373] focus:outline-none focus:border-[#3b82f6] min-h-[44px]"
        autoFocus
      />
      {error && <p className="text-[#f97316] text-xs">{error}</p>}
      <button
        onClick={handleSave}
        disabled={state === "saving" || !name.trim()}
        className="w-full rounded-xl bg-[#3b82f6] px-4 py-2.5 text-white text-sm font-medium hover:bg-[#2563eb] transition-colors disabled:opacity-50 min-h-[44px]"
      >
        {state === "saving" ? "保存中..." : "保存"}
      </button>
    </div>
  );
}
