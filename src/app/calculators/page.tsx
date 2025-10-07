// src/app/calculators/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import BmiCalculator from "@/components/bmiCalculator";
import BmrCalculator from "@/components/bmrCalculator";

type Sex = "male" | "female" | "other" | null;

type UserProfile = {
  birthday?: string;        // ISO yyyy-mm-dd
  heightCm?: number | null;
  weightKg?: number | null;
  sex?: Sex;
};

export default function CalculatorsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        setProfile(null);
        return;
      }
      try {
        // same path you were using for health profile
        const snap = await getDoc(doc(db, "users", user.uid, "private", "health_profile"));
        if (!cancelled) setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
      } catch {
        if (!cancelled) setProfile(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const initial = useMemo(() => {
    const age = (() => {
      if (!profile?.birthday) return undefined;
      const dob = new Date(profile.birthday);
      const now = new Date();
      let a = now.getFullYear() - dob.getFullYear();
      const m = now.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) a--;
      return a;
    })();

    return {
      age,
      heightCm: profile?.heightCm ?? undefined,
      weightKg: profile?.weightKg ?? undefined,
      sex: profile?.sex ?? null as Sex,
    };
  }, [profile]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Guest CTA banner removed */}
      <div className="space-y-6">
        <BmiCalculator
          initialHeightCm={initial.heightCm}
          initialWeightKg={initial.weightKg}
        />
        <BmrCalculator
          initialAge={initial.age}
          initialHeightCm={initial.heightCm}
          initialWeightKg={initial.weightKg}
          initialSex={initial.sex}
        />
      </div>
    </div>
  );
}
