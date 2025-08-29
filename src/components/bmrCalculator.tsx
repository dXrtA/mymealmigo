"use client";

import { useEffect, useMemo, useState } from "react";

type Sex = "male" | "female";

type Props = {
  initialAge?: number | null;
  initialHeightCm?: number | null;
  initialWeightKg?: number | null;
  initialSex?: Sex | "other" | null;
};

export default function BmrCalculator({
  initialAge, initialHeightCm, initialWeightKg, initialSex,
}: Props) {
  const [age, setAge] = useState<number | "">("");
  const [heightCm, setHeightCm] = useState<number | "">("");
  const [weightKg, setWeightKg] = useState<number | "">("");
  const [sex, setSex] = useState<Sex>("male");
  const [activity, setActivity] = useState<"sed"|"light"|"mod"|"very"|"extra">("sed");

  useEffect(() => {
    if (initialAge != null && age === "") setAge(initialAge);
    if (initialHeightCm != null && heightCm === "") setHeightCm(initialHeightCm);
    if (initialWeightKg != null && weightKg === "") setWeightKg(initialWeightKg);
    if (initialSex && (initialSex === "male" || initialSex === "female")) setSex(initialSex);
  }, [initialAge, initialHeightCm, initialWeightKg, initialSex]);

  const bmr = useMemo(() => {
    if (!age || !heightCm || !weightKg) return null;
    const A = Number(age), H = Number(heightCm), W = Number(weightKg);
    const base = 10 * W + 6.25 * H - 5 * A + (sex === "male" ? 5 : -161); // Mifflin–St Jeor
    return Math.round(base);
  }, [age, heightCm, weightKg, sex]);

  const activityFactor = useMemo(() => {
    switch (activity) {
      case "sed": return 1.2;
      case "light": return 1.375;
      case "mod": return 1.55;
      case "very": return 1.725;
      case "extra": return 1.9;
    }
  }, [activity]);

  const tdee = useMemo(() => (bmr ? Math.round(bmr * activityFactor) : null), [bmr, activityFactor]);

  return (
    <div className="rounded-xl border bg-white p-6">
      <h3 className="text-lg font-semibold mb-3">BMR & TDEE Calculator</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="block">
          <span className="text-sm text-gray-700">Age (years)</span>
          <input
            type="number" min={0} className="mt-1 w-full rounded-md border px-3 py-2"
            value={age} onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-700">Height (cm)</span>
          <input
            type="number" min={0} step="0.1" className="mt-1 w-full rounded-md border px-3 py-2"
            value={heightCm} onChange={(e) => setHeightCm(e.target.value ? Number(e.target.value) : "")}
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-700">Weight (kg)</span>
          <input
            type="number" min={0} step="0.1" className="mt-1 w-full rounded-md border px-3 py-2"
            value={weightKg} onChange={(e) => setWeightKg(e.target.value ? Number(e.target.value) : "")}
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-700">Sex</span>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={sex} onChange={(e) => setSex(e.target.value as Sex)}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm text-gray-700">Activity Level (for TDEE)</span>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={activity} onChange={(e) => setActivity(e.target.value as any)}
          >
            <option value="sed">Sedentary (little/no exercise)</option>
            <option value="light">Light (1–3 days/wk)</option>
            <option value="mod">Moderate (3–5 days/wk)</option>
            <option value="very">Very active (6–7 days/wk)</option>
            <option value="extra">Extra active (hard training)</option>
          </select>
        </label>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border p-3">
          <div className="text-sm text-gray-500">BMR</div>
          <div className="text-2xl font-bold">{bmr ?? "—"}</div>
          <div className="text-sm text-gray-600">{bmr ? "kcal/day" : ""}</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-sm text-gray-500">TDEE (estimate)</div>
          <div className="text-2xl font-bold">{tdee ?? "—"}</div>
          <div className="text-sm text-gray-600">{tdee ? "kcal/day" : ""}</div>
        </div>
      </div>
    </div>
  );
}
