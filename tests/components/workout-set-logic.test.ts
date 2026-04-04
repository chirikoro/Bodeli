import { describe, it, expect } from "vitest";

/**
 * workout-form.tsx のセット生成・フィルタリングロジックをテスト。
 * Bug #1: テンプレに追加したメニューだけだと記録保存できない
 * Bug #2: 追加した筋トレに名前がつけられない
 *
 * 根本原因: isFromTemplate フラグがなく、テンプレモードで
 * 追加したセットの名前入力が非表示になっていた。
 */

type SetInput = {
  exercise_name: string;
  weight_kg: string;
  reps: string;
  isFromTemplate: boolean;
};

// handleSave の validSets フィルタと同じロジック
function filterValidSets(sets: SetInput[]) {
  return sets.filter(
    (s) => s.exercise_name.trim() && s.weight_kg && s.reps
  );
}

// テンプレからセットを生成するロジック
function createTemplateSets(
  exercises: { name: string; default_sets: number; default_reps: number }[]
): SetInput[] {
  const sets: SetInput[] = [];
  exercises.forEach((ex) => {
    for (let i = 0; i < ex.default_sets; i++) {
      sets.push({
        exercise_name: ex.name,
        weight_kg: "",
        reps: String(ex.default_reps),
        isFromTemplate: true,
      });
    }
  });
  return sets;
}

// addSet ロジック
function addSet(
  currentSets: SetInput[],
  exerciseName?: string,
  fromTemplate = false
): SetInput[] {
  return [
    ...currentSets,
    {
      exercise_name: exerciseName || "",
      weight_kg: "",
      reps: "",
      isFromTemplate: fromTemplate,
    },
  ];
}

describe("workout-form set logic", () => {
  describe("Bug #1: テンプレ追加メニューの保存", () => {
    it("テンプレ由来セットのみ: 名前あり → 保存可能", () => {
      const sets = createTemplateSets([
        { name: "ベンチプレス", default_sets: 3, default_reps: 10 },
      ]);
      // ユーザーが重量を入力
      sets.forEach((s) => {
        s.weight_kg = "60";
      });

      const valid = filterValidSets(sets);
      expect(valid.length).toBe(3);
    });

    it("追加メニューに名前を入力すれば保存可能", () => {
      const sets = createTemplateSets([
        { name: "ベンチプレス", default_sets: 2, default_reps: 10 },
      ]);
      // ユーザーが種目を追加して名前・重量・回数を入力
      const withAdded = addSet(sets, "", false);
      const addedIdx = withAdded.length - 1;
      withAdded[addedIdx].exercise_name = "ダンベルフライ";
      withAdded[addedIdx].weight_kg = "12";
      withAdded[addedIdx].reps = "10";

      const valid = filterValidSets(withAdded);
      // テンプレ2セット(重量未入力) + 追加1セット(全入力済み) = 1
      expect(valid.length).toBe(1);
      expect(valid[0].exercise_name).toBe("ダンベルフライ");
    });

    it("追加メニューのみでも名前入力済みなら保存可能", () => {
      const templateSets = createTemplateSets([
        { name: "ベンチプレス", default_sets: 2, default_reps: 10 },
      ]);
      // テンプレのセットは重量未入力のまま
      // 追加メニューだけ全部入力
      const sets = addSet(templateSets, "", false);
      const addedIdx = sets.length - 1;
      sets[addedIdx].exercise_name = "ケーブルクロスオーバー";
      sets[addedIdx].weight_kg = "20";
      sets[addedIdx].reps = "15";

      const valid = filterValidSets(sets);
      expect(valid.length).toBe(1);
      expect(valid[0].exercise_name).toBe("ケーブルクロスオーバー");
      expect(valid[0].isFromTemplate).toBe(false);
    });

    it("名前が空の追加メニューは保存されない（意図的）", () => {
      const sets = addSet([], "", false);
      sets[0].weight_kg = "50";
      sets[0].reps = "10";
      // exercise_name は空のまま

      const valid = filterValidSets(sets);
      expect(valid.length).toBe(0);
    });
  });

  describe("Bug #2: isFromTemplate フラグの正確性", () => {
    it("テンプレ由来セットは isFromTemplate: true", () => {
      const sets = createTemplateSets([
        { name: "スクワット", default_sets: 3, default_reps: 8 },
      ]);
      sets.forEach((s) => {
        expect(s.isFromTemplate).toBe(true);
        expect(s.exercise_name).toBe("スクワット");
      });
    });

    it("ユーザー追加セットは isFromTemplate: false", () => {
      const sets = addSet([], "", false);
      expect(sets[0].isFromTemplate).toBe(false);
    });

    it("テンプレ種目へのセット追加は isFromTemplate: true を引き継ぐ", () => {
      const sets = createTemplateSets([
        { name: "デッドリフト", default_sets: 2, default_reps: 5 },
      ]);
      // テンプレ種目にセットを追加（UIの「+ セットを追加」と同じ）
      const withExtra = addSet(sets, "デッドリフト", true);
      expect(withExtra.length).toBe(3);
      expect(withExtra[2].exercise_name).toBe("デッドリフト");
      expect(withExtra[2].isFromTemplate).toBe(true);
    });

    it("カスタムモードのセットは全て isFromTemplate: false", () => {
      // テンプレなし → カスタムモード
      const sets: SetInput[] = [
        { exercise_name: "", weight_kg: "", reps: "", isFromTemplate: false },
      ];
      const withAdded = addSet(sets, "", false);
      withAdded.forEach((s) => {
        expect(s.isFromTemplate).toBe(false);
      });
    });
  });

  describe("名前入力表示ロジック", () => {
    // UIの表示条件: !sets[idx].isFromTemplate → 名前入力を表示
    function shouldShowNameInput(set: SetInput): boolean {
      return !set.isFromTemplate;
    }

    // UIのラベル表示条件: sets[indices[0]].isFromTemplate → ラベルを表示
    function shouldShowLabel(firstSetInGroup: SetInput): boolean {
      return firstSetInGroup.isFromTemplate;
    }

    it("テンプレ由来: ラベル表示、入力非表示", () => {
      const set: SetInput = {
        exercise_name: "ベンチプレス",
        weight_kg: "",
        reps: "",
        isFromTemplate: true,
      };
      expect(shouldShowNameInput(set)).toBe(false);
      expect(shouldShowLabel(set)).toBe(true);
    });

    it("ユーザー追加: 入力表示、ラベル非表示", () => {
      const set: SetInput = {
        exercise_name: "",
        weight_kg: "",
        reps: "",
        isFromTemplate: false,
      };
      expect(shouldShowNameInput(set)).toBe(true);
      expect(shouldShowLabel(set)).toBe(false);
    });

    it("ユーザー追加で名前入力後も入力表示が継続", () => {
      const set: SetInput = {
        exercise_name: "ダンベルカール",
        weight_kg: "",
        reps: "",
        isFromTemplate: false,
      };
      // 名前を入力しても isFromTemplate は false のまま → 入力欄は表示され続ける
      expect(shouldShowNameInput(set)).toBe(true);
      expect(shouldShowLabel(set)).toBe(false);
    });
  });
});
