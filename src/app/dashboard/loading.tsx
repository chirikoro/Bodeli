import { NavBar } from "@/components/nav-bar";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      <header className="px-4 pt-6 pb-2">
        <div className="h-5 w-32 bg-[#1a1a1a] rounded animate-pulse" />
        <div className="h-3 w-20 bg-[#1a1a1a] rounded animate-pulse mt-2" />
      </header>

      <main className="px-4 space-y-4">
        {/* Feedback card skeleton */}
        <div className="rounded-xl bg-[#1a1a1a] border border-[#262626] p-4 h-20 animate-pulse" />

        {/* Meals skeleton */}
        <section>
          <div className="h-4 w-20 bg-[#1a1a1a] rounded animate-pulse mb-2" />
          <div className="rounded-xl bg-[#1a1a1a] border border-[#262626] p-4 h-16 animate-pulse" />
        </section>

        {/* Workouts skeleton */}
        <section>
          <div className="h-4 w-28 bg-[#1a1a1a] rounded animate-pulse mb-2" />
          <div className="rounded-xl bg-[#1a1a1a] border border-[#262626] p-4 h-16 animate-pulse" />
        </section>
      </main>

      <NavBar />
    </div>
  );
}
