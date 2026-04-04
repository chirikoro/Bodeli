import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { NUTRITION_SYSTEM_PROMPT } from "@/lib/prompts";
import type { NutritionEstimate } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  // Input validation
  const body = await request.json().catch(() => null);
  if (!body?.description || typeof body.description !== "string") {
    return NextResponse.json(
      { error: "食事内容を入力してください" },
      { status: 400 }
    );
  }

  const description = body.description.trim();
  if (description.length === 0 || description.length > 500) {
    return NextResponse.json(
      { error: "入力は1〜500文字で入力してください" },
      { status: 400 }
    );
  }

  // Rate limit check (20/day per user)
  const today = new Date().toISOString().split("T")[0];
  const { count } = await supabase
    .from("meals")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("date", today)
    .eq("ai_estimated", true);

  if (count !== null && count >= 20) {
    return NextResponse.json(
      { error: "本日のAI推定回数(20回)を超えました。手動で栄養素を入力してください" },
      { status: 429 }
    );
  }

  // Call OpenAI
  try {
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: NUTRITION_SYSTEM_PROMPT },
        { role: "user", content: description },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json(
        { error: "推定に失敗しました。手動で入力してください" },
        { status: 500 }
      );
    }

    const estimate: NutritionEstimate = JSON.parse(content);

    // Validate the response has required fields
    if (
      typeof estimate.calories !== "number" ||
      typeof estimate.protein_g !== "number" ||
      typeof estimate.fat_g !== "number" ||
      typeof estimate.carbs_g !== "number"
    ) {
      return NextResponse.json(
        { error: "推定結果が不正です。手動で入力してください" },
        { status: 500 }
      );
    }

    return NextResponse.json(estimate);
  } catch {
    return NextResponse.json(
      { error: "推定に失敗しました。手動で入力してください" },
      { status: 500 }
    );
  }
}
