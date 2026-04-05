"use client";

import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");
  const supabase = createClient();

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (otpError) {
      setError(otpError.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#f5f5f5] tracking-tight">
            Bodeli
          </h1>
          <p className="mt-2 text-[#a3a3a3] text-sm">
            筋トレ × 食事を、ひとつに。
          </p>
        </div>

        {authError && (
          <div className="rounded-xl bg-[#262626] border border-[#f97316] p-3 text-center">
            <p className="text-[#f97316] text-sm">
              {authError === "expired"
                ? "ログインリンクの有効期限が切れました。もう一度お試しください。"
                : "ログインに失敗しました。もう一度お試しください。"}
            </p>
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 rounded-xl bg-[#262626] px-4 py-3 text-[#f5f5f5] font-medium hover:bg-[#333] transition-colors min-h-[44px]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Googleでログイン
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#262626]" />
          <span className="text-[#737373] text-xs">または</span>
          <div className="flex-1 h-px bg-[#262626]" />
        </div>

        {error && (
          <p className="text-[#f97316] text-sm text-center">{error}</p>
        )}

        {sent ? (
          <p className="text-center text-[#22c55e] text-sm">
            メールを送信しました。リンクをクリックしてログインしてください。
          </p>
        ) : (
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="メールアドレス"
              className="w-full rounded-xl bg-[#1a1a1a] border border-[#262626] px-4 py-3 text-[#f5f5f5] placeholder-[#737373] focus:outline-none focus:border-[#3b82f6] min-h-[44px]"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#3b82f6] px-4 py-3 text-white font-medium hover:bg-[#2563eb] transition-colors disabled:opacity-50 min-h-[44px]"
            >
              {loading ? "送信中..." : "メールでログイン"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
