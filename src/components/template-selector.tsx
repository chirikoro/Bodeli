"use client";

import Link from "next/link";
import type { WorkoutTemplate } from "@/lib/types";

export function TemplateSelector({
  templates,
  onSelect,
}: {
  templates: WorkoutTemplate[];
  onSelect: (template: WorkoutTemplate | null) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#737373]">テンプレートを選択</p>
        <Link
          href="/workouts/templates"
          className="text-xs text-[#3b82f6] hover:text-[#60a5fa] min-h-[44px] flex items-center"
        >
          テンプレート管理
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t)}
            className="rounded-xl bg-[#1a1a1a] border border-[#262626] p-3 text-left hover:border-[#3b82f6] transition-colors min-h-[44px]"
          >
            <p className="text-sm font-medium text-[#f5f5f5]">{t.name}</p>
            <p className="text-xs text-[#737373] mt-1">
              {t.exercises.length}種目
            </p>
          </button>
        ))}
        <button
          onClick={() => onSelect(null)}
          className="rounded-xl bg-[#1a1a1a] border border-[#262626] border-dashed p-3 text-left hover:border-[#3b82f6] transition-colors min-h-[44px]"
        >
          <p className="text-sm font-medium text-[#a3a3a3]">カスタム</p>
          <p className="text-xs text-[#737373] mt-1">自由に入力</p>
        </button>
      </div>
    </div>
  );
}
