import { createClient } from "@/lib/supabase/server";
import { calculateFeedback } from "@/lib/feedback";
import { FeedbackCard } from "@/components/feedback-card";
import { NavBar } from "@/components/nav-bar";
import Link from "next/link";
import type { Meal, WorkoutSession, WorkoutSet, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const today = new Date().toISOString().split("T")[0];

  // Parallel fetch for performance
  const [profileRes, mealsRes, sessionsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("meals")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .order("created_at", { ascending: true }),
    supabase
      .from("workout_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .order("created_at", { ascending: true }),
  ]);

  const profile = profileRes.data as Profile | null;
  const meals = (mealsRes.data ?? []) as Meal[];
  const sessions = (sessionsRes.data ?? []) as WorkoutSession[];

  // Fetch sets for today's sessions
  let sets: WorkoutSet[] = [];
  if (sessions.length > 0) {
    const sessionIds = sessions.map((s) => s.id);
    const { data } = await supabase
      .from("workout_sets")
      .select("*")
      .in("session_id", sessionIds)
      .order("set_order", { ascending: true });
    sets = (data ?? []) as WorkoutSet[];
  }

  const totalProtein = meals.reduce((sum, m) => sum + (m.protein_g ?? 0), 0);
  const totalVolume = sets.reduce(
    (sum, s) => sum + s.weight_kg * s.reps,
    0
  );

  const feedback = calculateFeedback(
    profile?.weight_kg ?? 70,
    profile?.protein_target_per_kg ?? 2.0,
    totalProtein,
    totalVolume,
    meals.length > 0,
    sessions.length > 0
  );

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      <header className="px-4 pt-6 pb-2">
        <h1 className="text-lg font-bold text-[#f5f5f5]">ダッシュボード</h1>
        <p className="text-xs text-[#737373]">{today}</p>
      </header>

      <main className="px-4 space-y-4">
        {/* Feedback Card */}
        <FeedbackCard feedback={feedback} />

        {/* Today's Meals */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-[#a3a3a3]">今日の食事</h2>
            <Link
              href="/meals/new"
              className="text-xs text-[#3b82f6] hover:text-[#60a5fa] min-h-[44px] flex items-center"
            >
              + 追加
            </Link>
          </div>
          {meals.length === 0 ? (
            <div className="rounded-xl bg-[#1a1a1a] border border-[#262626] p-4 text-center">
              <p className="text-[#737373] text-sm">
                食事を記録して、フィードバックを確認しよう
              </p>
              <Link
                href="/meals/new"
                className="inline-block mt-2 text-sm text-[#3b82f6] hover:text-[#60a5fa]"
              >
                食事を追加する
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  className="rounded-xl bg-[#1a1a1a] border border-[#262626] p-3"
                >
                  <p className="text-sm text-[#f5f5f5]">{meal.description}</p>
                  <div className="flex gap-3 mt-1 text-xs text-[#a3a3a3] tabular-nums">
                    <span>P: {meal.protein_g ?? 0}g</span>
                    <span>F: {meal.fat_g ?? 0}g</span>
                    <span>C: {meal.carbs_g ?? 0}g</span>
                    <span>{meal.calories ?? 0}kcal</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Today's Workouts */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-[#a3a3a3]">
              今日のトレーニング
            </h2>
            <Link
              href="/workouts/new"
              className="text-xs text-[#3b82f6] hover:text-[#60a5fa] min-h-[44px] flex items-center"
            >
              + 追加
            </Link>
          </div>
          {sessions.length === 0 ? (
            <div className="rounded-xl bg-[#1a1a1a] border border-[#262626] p-4 text-center">
              <p className="text-[#737373] text-sm">
                トレーニングを記録しよう
              </p>
              <Link
                href="/workouts/new"
                className="inline-block mt-2 text-sm text-[#3b82f6] hover:text-[#60a5fa]"
              >
                トレーニングを追加する
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => {
                const sessionSets = sets.filter(
                  (s) => s.session_id === session.id
                );
                const volume = sessionSets.reduce(
                  (sum, s) => sum + s.weight_kg * s.reps,
                  0
                );
                const exercises = [
                  ...new Set(sessionSets.map((s) => s.exercise_name)),
                ];
                return (
                  <div
                    key={session.id}
                    className="rounded-xl bg-[#1a1a1a] border border-[#262626] p-3"
                  >
                    <p className="text-sm font-medium text-[#f5f5f5]">
                      {session.template_name ?? "カスタム"}
                    </p>
                    <p className="text-xs text-[#a3a3a3] mt-1">
                      {exercises.join("、")}
                    </p>
                    <p className="text-xs text-[#737373] mt-1 tabular-nums">
                      総ボリューム: {volume.toLocaleString()}kg
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <NavBar />
    </div>
  );
}
