import { createClient } from "@/lib/supabase/server";
import { calculateFeedback } from "@/lib/feedback";
import { FeedbackCard } from "@/components/feedback-card";
import { WeeklyChart } from "@/components/weekly-chart";
import { NavBar } from "@/components/nav-bar";
import { DeleteButton } from "@/components/delete-button";
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

  // 7 days ago for weekly chart
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekAgoStr = weekAgo.toISOString().split("T")[0];

  // Parallel fetch for performance
  const [profileRes, mealsRes, sessionsRes, weekMealsRes, weekSessionsRes] = await Promise.all([
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
    supabase
      .from("meals")
      .select("date, protein_g")
      .eq("user_id", user.id)
      .gte("date", weekAgoStr)
      .lte("date", today),
    supabase
      .from("workout_sessions")
      .select("id, date")
      .eq("user_id", user.id)
      .gte("date", weekAgoStr)
      .lte("date", today),
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

  // Weekly chart data
  const weekMeals = (weekMealsRes.data ?? []) as { date: string; protein_g: number | null }[];
  const weekSessions = (weekSessionsRes.data ?? []) as { id: string; date: string }[];

  // Fetch sets for weekly sessions
  let weekSets: { session_id: string; weight_kg: number; reps: number }[] = [];
  if (weekSessions.length > 0) {
    const weekSessionIds = weekSessions.map((s) => s.id);
    const { data } = await supabase
      .from("workout_sets")
      .select("session_id, weight_kg, reps")
      .in("session_id", weekSessionIds);
    weekSets = (data ?? []) as typeof weekSets;
  }

  const dayLabels = ["日", "月", "火", "水", "木", "金", "土"];
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    const dateStr = d.toISOString().split("T")[0];
    const dayProtein = weekMeals
      .filter((m) => m.date === dateStr)
      .reduce((sum, m) => sum + (m.protein_g ?? 0), 0);
    const daySessions = weekSessions.filter((s) => s.date === dateStr);
    const daySessionIds = new Set(daySessions.map((s) => s.id));
    const dayVolume = weekSets
      .filter((s) => daySessionIds.has(s.session_id))
      .reduce((sum, s) => sum + s.weight_kg * s.reps, 0);
    return {
      date: dateStr,
      label: `${d.getMonth() + 1}/${d.getDate()}(${dayLabels[d.getDay()]})`,
      volume: dayVolume,
      protein: Math.round(dayProtein),
    };
  });

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

        {/* Weekly Chart */}
        <WeeklyChart data={weeklyData} />

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
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-[#f5f5f5]">{meal.description}</p>
                      <div className="flex gap-3 mt-1 text-xs text-[#a3a3a3] tabular-nums">
                        <span>P: {meal.protein_g ?? 0}g</span>
                        <span>F: {meal.fat_g ?? 0}g</span>
                        <span>C: {meal.carbs_g ?? 0}g</span>
                        <span>{meal.calories ?? 0}kcal</span>
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2 shrink-0">
                      <Link
                        href={`/meals/${meal.id}/edit`}
                        className="text-xs text-[#3b82f6] min-w-[44px] min-h-[44px] flex items-center justify-center"
                      >
                        編集
                      </Link>
                      <DeleteButton table="meals" id={meal.id} />
                    </div>
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
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
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
                      <div className="flex gap-1 ml-2 shrink-0">
                        <Link
                          href={`/workouts/${session.id}/edit`}
                          className="text-xs text-[#3b82f6] min-w-[44px] min-h-[44px] flex items-center justify-center"
                        >
                          編集
                        </Link>
                        <DeleteButton table="workout_sessions" id={session.id} />
                      </div>
                    </div>
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
