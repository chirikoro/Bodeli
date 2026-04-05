"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteButton({
  table,
  id,
}: {
  table: "meals" | "workout_sessions";
  id: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleDelete() {
    setDeleting(true);

    if (table === "workout_sessions") {
      await supabase.from("workout_sets").delete().eq("session_id", id);
    }

    await supabase.from(table).delete().eq("id", id);

    setDeleting(false);
    setConfirming(false);
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex gap-1">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-[#ef4444] min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          {deleting ? "..." : "確定"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-[#737373] min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          戻る
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-[#737373] hover:text-[#ef4444] min-w-[44px] min-h-[44px] flex items-center justify-center"
    >
      削除
    </button>
  );
}
