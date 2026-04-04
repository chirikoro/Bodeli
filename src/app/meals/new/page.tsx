import { MealForm } from "@/components/meal-form";
import { NavBar } from "@/components/nav-bar";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NewMealPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      <header className="px-4 pt-6 pb-4 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-[#a3a3a3] hover:text-[#f5f5f5] min-h-[44px] flex items-center"
        >
          ← 戻る
        </Link>
        <h1 className="text-lg font-bold text-[#f5f5f5]">食事を追加</h1>
      </header>

      <main className="px-4">
        <MealForm />
      </main>

      <NavBar />
    </div>
  );
}
