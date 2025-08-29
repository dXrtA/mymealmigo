"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  initialHeightCm?: number | null;
  initialWeightKg?: number | null;
};

export default function BmiCalculator({ initialHeightCm, initialWeightKg }: Props) {
  const [heightCm, setHeightCm] = useState<number | "">("");
  const [weightKg, setWeightKg] = useState<number | "">("");

  useEffect(() => {
    if (initialHeightCm != null && heightCm === "") setHeightCm(initialHeightCm);
    if (initialWeightKg != null && weightKg === "") setWeightKg(initialWeightKg);
  }, [initialHeightCm, initialWeightKg]); // prefill once

  const bmi = useMemo(() => {
    if (!heightCm || !weightKg) return null;
    const m = Number(heightCm) / 100;
    const val = Number(weightKg) / (m * m);
    return Number.isFinite(val) ? Number(val.toFixed(1)) : null;
  }, [heightCm, weightKg]);

  const bmiCat = useMemo(() => {
    if (bmi == null) return "";
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Overweight";
    return "Obese";
  }, [bmi]);

  return (
    <div className="rounded-xl border bg-white p-6">
      <h3 className="text-lg font-semibold mb-3">BMI Calculator</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm text-gray-700">Height (cm)</span>
          <input
            type="number" min={0} step="0.1"
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value ? Number(e.target.value) : "")}
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-700">Weight (kg)</span>
          <input
            type="number" min={0} step="0.1"
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value ? Number(e.target.value) : "")}
          />
        </label>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-lg border p-3">
          <div className="text-sm text-gray-500">BMI</div>
          <div className="text-2xl font-bold">{bmi ?? "—"}</div>
        </div>
        <div className="rounded-lg border p-3 md:col-span-2">
          <div className="text-sm text-gray-500">Category</div>
          <div className="text-base">{bmi ? bmiCat : "—"}</div>
        </div>
      </div>
    </div>
  );
}
