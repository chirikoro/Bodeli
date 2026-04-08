import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/nav-bar";
import { DeleteButton } from "@/components/delete-button";
import Link from "next/link";
import type { SavedRecipe } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("saved_recipes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const recipes = (data ?? []) as SavedRecipe[];

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      <header className="px-4 pt-6 pb-4">
        <h1 className="text-lg font-bold text-[#f5f5f5]">保存レシピ</h1>
        <p className="text-xs text-[#737373] mt-1">
          よく食べるメニューを保存して、すばやく記録
        </p>
      </header>

      <main className="px-4 space-y-3">
        {recipes.length === 0 ? (
          <div className="rounded-xl bg-[#1a1a1a] border border-[#262626] p-6 text-center">
            <p className="text-[#737373] text-sm">
              まだレシピがありません
            </p>
            <p className="text-[#737373] text-xs mt-1">
              食事を記録した後に「レシピとして保存」できます
            </p>
            <Link
              href="/meals/new"
              className="inline-block mt-3 text-sm text-[#3b82f6] hover:text-[#60a5fa]"
            >
              食事を記録する
            </Link>
          </div>
        ) : (
          recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="rounded-xl bg-[#1a1a1a] border border-[#262626] p-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#f5f5f5]">
                    {recipe.name}
                  </p>
                  {recipe.name !== recipe.description && (
                    <p className="text-xs text-[#737373] mt-0.5">
                      {recipe.description}
                    </p>
                  )}
                  <div className="flex gap-3 mt-1 text-xs text-[#a3a3a3] tabular-nums">
                    <span>P: {recipe.protein_g ?? 0}g</span>
                    <span>F: {recipe.fat_g ?? 0}g</span>
                    <span>C: {recipe.carbs_g ?? 0}g</span>
                    <span>{recipe.calories ?? 0}kcal</span>
                  </div>
                </div>
                <div className="flex gap-1 ml-2 shrink-0">
                  <Link
                    href={`/meals/new?recipe=${recipe.id}`}
                    className="text-xs text-[#22c55e] min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    記録
                  </Link>
                  <DeleteButton table="saved_recipes" id={recipe.id} />
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      <NavBar />
    </div>
  );
}
