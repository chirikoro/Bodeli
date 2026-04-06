import { createClient } from "@/lib/supabase/server";
import { calculateFeedback } from "@/lib/feedback";
import { calculate1RM, calculateTDEE, GOAL_PHASE_PRESETS } from "@/lib/tdee";
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
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-[#f5f5f5]">
            {profile?.display_name ? `${profile.display_name}さん` : "ダッシュボード"}
          </h1>
        </div>
        <p className="text-xs text-[#737373]">{today}</p>
      </header>

      <main className="px-4 space-y-4">
        {/* Feedback Card */}
        <FeedbackCard feedback={feedback} />

        {/* Calorie & PFC Balance Card */}
        {meals.length > 0 && (
          <div className="rounded-xl bg-[#1a1a1a] border border-[#262626] p-3 space-y-3">
            {(() => {
              const phase = profile?.goal_phase ?? "maintain";
              const preset = GOAL_PHASE_PRESETS[phase];
              const tdee = calculateTDEE(
                profile?.weight_kg ?? 70,
                profile?.height_cm ?? null,
                profile?.age ?? null,
                profile?.activity_level ?? "moderate"
              );
              const targetCal = Math.round(tdee * preset.calorie_adjustment);
              const totalCal = Math.round(meals.reduce((sum, m) => sum + (m.calories ?? 0), 0));
              const balance = totalCal - targetCal;

              const proteinPerKg = profile?.protein_target_per_kg ?? preset.protein_per_kg;
              const targetProtein = Math.round((profile?.weight_kg ?? 70) * proteinPerKg);
              const targetFat = Math.round((targetCal * (profile?.fat_target_pct ?? preset.fat_pct) / 100) / 9);
              const targetCarbs = Math.round((targetCal * (profile?.carbs_target_pct ?? preset.carbs_pct) / 100) / 4);

              const actualProtein = Math.round(meals.reduce((sum, m) => sum + (m.protein_g ?? 0), 0));
              const actualFat = Math.round(meals.reduce((sum, m) => sum + (m.fat_g ?? 0), 0));
              const actualCarbs = Math.round(meals.reduce((sum, m) => sum + (m.carbs_g ?? 0), 0));

              const pfcItems = [
                { label: "P タンパク質", actual: actualProtein, target: targetProtein, unit: "g", color: "#22c55e" },
                { label: "F 脂質", actual: actualFat, target: targetFat, unit: "g", color: "#eab308" },
                { label: "C 炭水化物", actual: actualCarbs, target: targetCarbs, unit: "g", color: "#3b82f6" },
              ];

              return (
                <>
                  {/* Calorie row */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-[#a3a3a3]">カロリー</p>
                      <p className="text-xs tabular-nums text-[#a3a3a3]">
                        <span className="text-[#f5f5f5] font-semibold">{totalCal}</span> / {targetCal} kcal
                        <span className={`ml-1 ${balance >= 0 ? "text-[#3b82f6]" : "text-[#f97316]"}`}>
                          ({balance >= 0 ? "+" : ""}{balance})
                        </span>
                      </p>
                    </div>
                    <div className="w-full h-2 bg-[#262626] rounded-full">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min((totalCal / targetCal) * 100, 100)}%`,
                          backgroundColor: Math.abs(balance) < targetCal * 0.1 ? "#22c55e" : balance > 0 ? "#3b82f6" : "#f97316",
                        }}
                      />
                    </div>
                  </div>

                  {/* PFC bars */}
                  {pfcItems.map((item) => {
                    const pct = item.target > 0 ? Math.min((item.actual / item.target) * 100, 100) : 0;
                    const diff = item.actual - item.target;
                    return (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-[#a3a3a3]">{item.label}</p>
                          <p className="text-xs tabular-nums text-[#a3a3a3]">
                            <span className="text-[#f5f5f5] font-semibold">{item.actual}</span> / {item.target}{item.unit}
                            {diff !== 0 && (
                              <span className={`ml-1 ${diff > 0 ? "text-[#f97316]" : "text-[#737373]"}`}>
                                ({diff > 0 ? "+" : ""}{diff})
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="w-full h-2 bg-[#262626] rounded-full">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </>
              );
            })()}
          </div>
        )}

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
                // Group by exercise with best set (highest 1RM)
                const exerciseMap = new Map<string, { weight: number; reps: number; rm: number }>();
                for (const s of sessionSets) {
                  const rm = calculate1RM(s.weight_kg, s.reps);
                  const current = exerciseMap.get(s.exercise_name);
                  if (!current || rm > current.rm) {
                    exerciseMap.set(s.exercise_name, { weight: s.weight_kg, reps: s.reps, rm });
                  }
                }
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
                        <div className="mt-1 space-y-0.5">
                          {[...exerciseMap.entries()].map(([name, best]) => (
                            <p key={name} className="text-xs text-[#a3a3a3] tabular-nums">
                              {name}: {best.weight}kg×{best.reps} <span className="text-[#737373]">(1RM {best.rm}kg)</span>
                            </p>
                          ))}
                        </div>
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
